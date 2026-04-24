"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getUser,
  getUserTests,
  getUserGoals,
  getStudySessionRange,
  getWeeklyReports,
  type UserDoc,
  type TestDoc,
  type GoalDoc,
  type StudySessionDoc,
  type WeeklyReportDoc,
} from "@/lib/firebase/schema";
import { format, subDays, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Lock, Sparkles, Target, Flame, CheckCircle2, AlertTriangle, Clock, TrendingUp,
  TrendingDown, Minus, Star, Download, ChevronDown, ChevronUp, Loader2, Users,
} from "lucide-react";
import Link from "next/link";

// ─── 型 ──────────────────────────────────────────────────────

interface ChildData {
  uid: string;
  name: string;
  grade: string | null;
  currentLevel: number;
  currentStreak: number;
  totalXp: number;
  plan: string;
}

interface TestTrend {
  subject: string;
  date: string;
  actualScore: number;
  maxScore: number;
  pct: number;
  delta: number | null;
}

interface WeekStats {
  scheduledRate: number;
  freeCount: number;
  scheduledCount: number;
  totalCount: number;
  autonomyScore: number;
}

interface ChildApiResponse {
  child: ChildData;
  sessions: (StudySessionDoc & { id: string })[];
  tests: (TestDoc & { id: string; daysLeft: number; testDate: string; scoredAt: string | null })[];
  goals: { id: string; description: string; targetScore: number; achieved: boolean }[];
  weekStats: WeekStats;
  testTrends: TestTrend[];
}

// ─── ユーティリティ ───────────────────────────────────────────────────────────

function autonomyComment(score: number, name: string): string {
  if (score >= 90) return `${name}さんは今週も自分で考えて勉強できています！この調子でいきましょう。`;
  if (score >= 70) return `${name}さんは自発的に勉強する習慣がついてきています。もう少しで満点です！`;
  if (score >= 50) return `${name}さんは予定通りに勉強できている部分もあります。自主学習の回数を増やすと、さらに成長できます。`;
  return `${name}さんの自主学習がまだ少ない週でした。一緒に計画を立ててみましょう。`;
}

function getTestPrepStatus(daysLeft: number, subject: string, sessions: { subject: string; scheduleId: string | null; actualMinutes: number }[]): { label: string; color: string; emoji: string } {
  if (daysLeft < 0) return { label: "終了", color: "#9CA3AF", emoji: "✅" };
  const subjectSessions = sessions.filter((s) => s.subject === subject);
  const totalMins = subjectSessions.reduce((a, b) => a + b.actualMinutes, 0);
  if (subjectSessions.length === 0) return { label: "まだ何もしてない", color: "#FF4B4B", emoji: "😟" };
  if (totalMins >= 60 || (daysLeft > 3 && subjectSessions.length >= 2)) return { label: "準備OK", color: "#58CC02", emoji: "💪" };
  return { label: "準備中", color: "#FF9600", emoji: "📖" };
}

// ─── 過去レポートカード ────────────────────────────────────────────────────────

function ReportHistoryCard({ report }: { report: WeeklyReportDoc & { id: string } }) {
  const [open, setOpen] = useState(false);
  const start = format(new Date(report.periodStart), "M月d日", { locale: ja });
  const end = format(new Date(report.periodEnd), "M月d日（E）", { locale: ja });

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left transition-all hover:opacity-80"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: `conic-gradient(#58CC02 ${report.autonomyScore * 3.6}deg, var(--color-bg-tertiary) 0deg)` }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--color-bg-primary)" }}>
              <span className="text-xs font-black" style={{ color: "var(--color-brand-green)" }}>{report.autonomyScore}</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>{start}〜{end}</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              自主性スコア {report.autonomyScore}点 · ストリーク {report.streak}日
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          : <ChevronDown size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: "var(--color-bg-tertiary)" }}>
          {report.aiComment && (
            <div className="rounded-xl p-4 mt-3" style={{ background: "rgba(28,176,246,0.06)", border: "1px solid rgba(28,176,246,0.18)" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--color-brand-blue)" }}>✨ AIアシスタントのコメント</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{report.aiComment}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "📅 予定通り勉強した率", value: `${report.scheduledRate}%` },
              { label: "⚡ 自発的に勉強した回数", value: `${report.freeCount}回` },
              { label: "🔥 ストリーク継続", value: `${report.streak}日` },
              { label: "📝 登録テスト数", value: `${report.testCount}件` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3" style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-bg-tertiary)" }}>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.label}</p>
                <p className="text-lg font-black" style={{ color: "var(--color-text-primary)" }}>{item.value}</p>
              </div>
            ))}
          </div>
          {report.completedTests?.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text-secondary)" }}>📋 テスト結果</p>
              {report.completedTests.map((t, i) => {
                const pct = Math.round((t.actualScore / t.maxScore) * 100);
                const color = pct >= 80 ? "#58CC02" : pct >= 60 ? "#FF9600" : "#FF4B4B";
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: "var(--color-bg-tertiary)" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{t.subject}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black" style={{ color }}>{t.actualScore}点</p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {report.testStatuses.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text-secondary)" }}>📚 テスト準備状況</p>
              {report.testStatuses.map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: "var(--color-bg-tertiary)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {t.subject}
                    <span className="font-normal text-xs ml-1" style={{ color: "var(--color-text-muted)" }}>（あと{t.daysLeft}日）</span>
                  </p>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: t.label.includes("OK") ? "rgba(88,204,2,0.12)" : t.label.includes("中") ? "rgba(255,150,0,0.12)" : "rgba(255,75,75,0.12)",
                      color: t.label.includes("OK") ? "#58CC02" : t.label.includes("中") ? "#FF9600" : "#FF4B4B",
                    }}
                  >
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          )}
          {report.goals.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--color-text-secondary)" }}>🎯 目標</p>
              {report.goals.map((g, i) => (
                <p key={i} className="text-sm py-1" style={{ color: "var(--color-text-primary)" }}>
                  {g.description}（目標{g.targetScore}点）
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────

export default function ParentPage() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserDoc | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"current" | "history">("current");

  // 子どもリスト
  const [childUids, setChildUids] = useState<string[]>([]);
  const [selectedChildUid, setSelectedChildUid] = useState<string | null>(null);
  const [childData, setChildData] = useState<ChildApiResponse | null>(null);
  const [childLoading, setChildLoading] = useState(false);

  // 自分自身のデータ（子ども連携なし時のフォールバック）
  const [sessions, setSessions] = useState<(StudySessionDoc & { id: string })[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<(TestDoc & { id: string })[]>([]);
  const [goals, setGoals] = useState<(GoalDoc & { id: string })[]>([]);

  // 過去レポート
  const [reports, setReports] = useState<(WeeklyReportDoc & { id: string })[]>([]);
  const [reportsLoaded, setReportsLoaded] = useState(false);

  // AI生成状態
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [latestAiComment, setLatestAiComment] = useState<string | null>(null);

  // 保護者ダッシュボードで表示する子どもデータ (API or 自分)
  const isViewingChild = !!childData;
  const viewUid = isViewingChild ? childData!.child.uid : currentUser?.uid ?? "";
  const childName = isViewingChild ? childData!.child.name : userData?.name ?? "お子さん";
  const currentStreak = isViewingChild ? childData!.child.currentStreak : userData?.currentStreak ?? 0;
  const currentLevel = isViewingChild ? childData!.child.currentLevel : userData?.currentLevel ?? 1;
  const effectiveSessions = isViewingChild ? childData!.sessions : sessions;
  const effectiveTests = isViewingChild
    ? childData!.tests.map((t) => ({
        ...t,
        testDate: { toDate: () => new Date(t.testDate) } as unknown as import("firebase/firestore").Timestamp,
      }))
    : upcomingTests;
  const effectiveGoals = isViewingChild
    ? childData!.goals.map((g) => ({
        ...g,
        userId: viewUid,
        testId: null,
        achievedAt: null,
        createdAt: null as unknown as import("firebase/firestore").Timestamp,
      }))
    : goals;
  const weekStats = isViewingChild
    ? childData!.weekStats
    : (() => {
        const weekAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");
        const ws = sessions.filter((s) => s.date >= weekAgo);
        const sc = ws.filter((s) => s.scheduleId !== null).length;
        const fc = ws.filter((s) => s.scheduleId === null).length;
        const tc = ws.length;
        const sr = tc > 0 ? Math.round((sc / tc) * 100) : 0;
        const ss = Math.min((userData?.currentStreak ?? 0) / 7, 1) * 100;
        return { scheduledRate: sr, freeCount: fc, scheduledCount: sc, totalCount: tc, autonomyScore: Math.round(sr * 0.5 + (fc > 0 ? 100 : 0) * 0.3 + ss * 0.2) };
      })();

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      try {
        const user = await getUser(currentUser!.uid);
        setUserData(user);
        setPlan(user?.plan ?? "free");
        if (user?.plan !== "family") { setLoading(false); return; }

        const uids = user?.childUids ?? [];
        setChildUids(uids);

        // 子どもが連携済みなら最初の子をデフォルト選択
        if (uids.length > 0) {
          setSelectedChildUid(uids[0]);
        } else {
          // 自分のデータをフォールバックとして取得
          const today = format(new Date(), "yyyy-MM-dd");
          const monthAgo = format(subDays(new Date(), 29), "yyyy-MM-dd");
          const [sessionData, testData, goalData] = await Promise.all([
            getStudySessionRange(currentUser!.uid, monthAgo, today),
            getUserTests(currentUser!.uid, 20),
            getUserGoals(currentUser!.uid),
          ]);
          setSessions(sessionData as (StudySessionDoc & { id: string })[]);
          const upcoming = (testData as (TestDoc & { id: string })[]).filter(
            (t) => differenceInDays(t.testDate.toDate(), new Date()) >= 0
          );
          setUpcomingTests(upcoming);
          setGoals(goalData as (GoalDoc & { id: string })[]);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  // 選択された子どものデータを取得
  useEffect(() => {
    if (!currentUser || !selectedChildUid) return;
    setChildLoading(true);
    currentUser.getIdToken().then((token) => {
      fetch(`/api/parent/child?childUid=${selectedChildUid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data: ChildApiResponse) => setChildData(data))
        .finally(() => setChildLoading(false));
    });
  }, [currentUser, selectedChildUid]);

  // 履歴タブ切替時に1回だけ取得（表示対象のUID基準）
  useEffect(() => {
    if (tab !== "history" || reportsLoaded || !currentUser) return;
    const uid = selectedChildUid ?? currentUser.uid;
    getWeeklyReports(uid).then((data) => {
      setReports(data as (WeeklyReportDoc & { id: string })[]);
      setReportsLoaded(true);
    });
  }, [tab, reportsLoaded, currentUser, selectedChildUid]);

  // 子どもが変わったら履歴をリセット
  useEffect(() => {
    setReportsLoaded(false);
    setReports([]);
  }, [selectedChildUid]);

  async function handleGenerateReport() {
    if (!currentUser || saving) return;
    setSaving(true);
    setSaveMsg(null);
    setLatestAiComment(null);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUid: selectedChildUid ?? currentUser.uid }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { report } = await res.json();
      setLatestAiComment(report.aiComment ?? null);
      setSaveMsg("レポートを生成・保存しました");
      setReportsLoaded(false);
    } catch {
      setSaveMsg("生成に失敗しました。しばらく後にお試しください");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 5000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--color-brand-blue)" }} />
      </div>
    );
  }

  if (plan !== "family") {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl" style={{ background: "rgba(155,93,229,0.1)" }}>
          👨‍👩‍👧
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>保護者ダッシュボード</h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
            お子さんが「自分で考えて勉強しているか」を可視化します。
          </p>
        </div>
        <div className="w-full rounded-2xl p-5" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Lock size={18} style={{ color: "var(--color-brand-purple)" }} />
            <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>Familyプランの機能です</p>
          </div>
          {[
            "自主性スコア（予定通り勉強した率）",
            "自発的に勉強した回数",
            "テスト準備状況（準備OK/準備中/未着手）",
            "テスト結果の分析レポート（AI生成）",
            "週次レポート（いつでも閲覧・メール配信）",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} style={{ color: "var(--color-brand-purple)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{f}</p>
            </div>
          ))}
        </div>
        <Link
          href="/settings/billing"
          className="w-full py-3.5 rounded-pill font-bold text-white text-center flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #9B5DE5, #1CB0F6)", boxShadow: "0 4px 15px rgba(155,93,229,0.35)" }}
        >
          <Sparkles size={16} />
          Familyプランを開始 — ¥780/月
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* ── ヘッダー ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>保護者ダッシュボード</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {childLoading ? "読み込み中..." : `${childName}さんの学習状況`}
          </p>
        </div>
        <Link
          href="/settings/family"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-pill transition-all hover:opacity-80"
          style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
        >
          <Users size={13} />
          家族連携
        </Link>
      </div>

      {/* ── 子ども選択タブ（連携済みの場合） ── */}
      {childUids.length > 0 && childData && (
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--color-bg-tertiary)" }}>
          {childUids.map((cuid) => {
            const label = cuid === selectedChildUid ? childData.child.name : `子ども${childUids.indexOf(cuid) + 1}`;
            return (
              <button
                key={cuid}
                onClick={() => { setSelectedChildUid(cuid); }}
                className="flex-1 whitespace-nowrap py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: cuid === selectedChildUid ? "var(--color-bg-primary)" : "transparent",
                  color: cuid === selectedChildUid ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  boxShadow: cuid === selectedChildUid ? "var(--shadow-sm)" : "none",
                  minWidth: "80px",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 子どもが未連携なら案内 ── */}
      {childUids.length === 0 && (
        <div
          className="rounded-2xl p-5 flex items-start gap-4"
          style={{ background: "rgba(28,176,246,0.06)", border: "1px solid rgba(28,176,246,0.2)" }}
        >
          <Users size={20} style={{ color: "var(--color-brand-blue)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>お子さんとまだ連携していません</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              お子さんのアプリで招待コードを発行してもらい、こちらで入力してください。
            </p>
            <Link
              href="/settings/family"
              className="inline-block mt-2 text-xs font-bold px-3 py-1.5 rounded-pill transition-all hover:opacity-80"
              style={{ background: "var(--color-brand-blue)", color: "#fff" }}
            >
              家族連携を設定 →
            </Link>
          </div>
        </div>
      )}

      {childLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--color-brand-blue)" }} />
        </div>
      ) : (
        <>
          {/* ── タブ ── */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-bg-tertiary)" }}>
            {(["current", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: tab === t ? "var(--color-bg-primary)" : "transparent",
                  color: tab === t ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  boxShadow: tab === t ? "var(--shadow-sm)" : "none",
                }}
              >
                {t === "current" ? "今週" : "過去のレポート"}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════
              今週タブ
          ════════════════════════════════════ */}
          {tab === "current" && (
            <>
              {/* 自主性スコア */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "linear-gradient(135deg, rgba(88,204,2,0.08), rgba(28,176,246,0.08))",
                  border: "2px solid rgba(88,204,2,0.25)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-brand-green)" }}>
                      🧠 自主性スコア
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      「うちの子、自分で考えて勉強してる」指標
                    </p>
                  </div>
                  <div
                    className="flex items-center justify-center w-20 h-20 rounded-full flex-shrink-0"
                    style={{ background: `conic-gradient(#58CC02 ${weekStats.autonomyScore * 3.6}deg, var(--color-bg-tertiary) 0deg)` }}
                  >
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--color-bg-primary)" }}>
                      <span className="text-xl font-display font-black" style={{ color: "var(--color-brand-green)" }}>{weekStats.autonomyScore}</span>
                    </div>
                  </div>
                </div>

                {/* 自主性スコアコメント */}
                <div
                  className="rounded-xl p-3 mb-4"
                  style={{ background: "rgba(88,204,2,0.06)", border: "1px solid rgba(88,204,2,0.18)" }}
                >
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
                    {autonomyComment(weekStats.autonomyScore, childName)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "📅", label: "予定通りに勉強した率", value: `${weekStats.scheduledRate}%`, sub: `今週 ${weekStats.scheduledCount}/${weekStats.totalCount} 回`, color: weekStats.scheduledRate >= 70 ? "#58CC02" : weekStats.scheduledRate >= 40 ? "#FF9600" : "#FF4B4B" },
                    { icon: "⚡", label: "自発的に勉強した回数", value: `${weekStats.freeCount}回`, sub: "予定外の自主学習", color: weekStats.freeCount >= 3 ? "#58CC02" : weekStats.freeCount >= 1 ? "#FF9600" : "#9CA3AF" },
                    { icon: "🔥", label: "ストリーク継続", value: `${currentStreak}日`, sub: "連続学習日数", color: currentStreak >= 3 ? "#FF9600" : "#9CA3AF" },
                    { icon: "📝", label: "テスト登録数", value: `${isViewingChild ? childData!.tests.filter((t) => t.daysLeft >= 0).length : upcomingTests.length}件`, sub: "今後のテスト", color: "var(--color-brand-blue)" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl p-3" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
                      <p className="text-lg mb-1">{item.icon}</p>
                      <p className="text-xl font-display font-black" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{item.label}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* テスト準備状況 */}
              {isViewingChild && childData!.tests.filter((t) => t.daysLeft >= 0).length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
                  <h2 className="font-display font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                    <Target size={16} style={{ color: "var(--color-brand-blue)" }} />
                    テストまでの準備状況
                  </h2>
                  <div className="space-y-3">
                    {childData!.tests.filter((t) => t.daysLeft >= 0).slice(0, 4).map((test) => {
                      const status = getTestPrepStatus(test.daysLeft, test.subject, childData!.sessions);
                      return (
                        <div key={test.id} className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: "var(--color-bg-tertiary)" }}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{status.emoji}</span>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{test.subject}</p>
                              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                あと{test.daysLeft}日 · {format(new Date(test.testDate), "M月d日（E）", { locale: ja })}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: status.color + "18", color: status.color }}>
                            {status.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* テスト得点トレンド */}
              {isViewingChild && childData!.testTrends.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
                  <h2 className="font-display font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                    <TrendingUp size={16} style={{ color: "var(--color-brand-green)" }} />
                    テスト得点の推移
                  </h2>
                  <div className="space-y-2">
                    {childData!.testTrends.slice(-6).map((t, i) => {
                      const color = t.pct >= 80 ? "#58CC02" : t.pct >= 60 ? "#FF9600" : "#FF4B4B";
                      return (
                        <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: "var(--color-bg-tertiary)" }}>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{t.subject}</p>
                            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t.date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {t.delta !== null && (
                              <span
                                className="flex items-center gap-0.5 text-xs font-semibold"
                                style={{ color: t.delta > 0 ? "#58CC02" : t.delta < 0 ? "#FF4B4B" : "#9CA3AF" }}
                              >
                                {t.delta > 0 ? <TrendingUp size={12} /> : t.delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                                {t.delta > 0 ? "+" : ""}{t.delta}%
                              </span>
                            )}
                            <div className="text-right">
                              <p className="text-base font-black" style={{ color }}>{t.actualScore}点</p>
                              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t.pct}%</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 目標 */}
              {effectiveGoals.filter((g) => !g.achieved).length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
                  <h2 className="font-display font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                    <Star size={16} style={{ color: "var(--color-xp-gold)" }} />
                    {childName}さんの目標
                  </h2>
                  <div className="space-y-2">
                    {effectiveGoals.filter((g) => !g.achieved).slice(0, 3).map((goal) => (
                      <div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-bg-tertiary)" }}>
                        <Target size={16} style={{ color: "var(--color-brand-blue)", flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{goal.description}</p>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>目標: {goal.targetScore}点</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ストリーク・レベル */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
                  <Flame size={24} style={{ color: "var(--color-streak)" }} />
                  <div>
                    <p className="text-2xl font-display font-black" style={{ color: "var(--color-streak)" }}>{currentStreak}日</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>連続学習</p>
                  </div>
                </div>
                <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
                  <TrendingUp size={24} style={{ color: "var(--color-brand-blue)" }} />
                  <div>
                    <p className="text-2xl font-display font-black" style={{ color: "var(--color-brand-blue)" }}>Lv.{currentLevel}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>現在のレベル</p>
                  </div>
                </div>
              </div>

              {/* 緊急アラート */}
              {isViewingChild && childData!.tests.some((t) => {
                return t.daysLeft <= 3 && t.daysLeft >= 0 && childData!.sessions.filter((s) => s.subject === t.subject).length === 0;
              }) && (
                <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "rgba(255,75,75,0.08)", border: "1px solid rgba(255,75,75,0.25)" }}>
                  <AlertTriangle size={20} style={{ color: "var(--color-error)", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: "var(--color-error)" }}>⚠️ テスト直前なのに勉強ゼロです</p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                      {childData!.tests.filter((t) => t.daysLeft <= 3 && t.daysLeft >= 0 && childData!.sessions.filter((s) => s.subject === t.subject).length === 0).map((t) => t.subject).join("・")}
                      のテストが3日以内にあります。今すぐ声をかけてあげてください。
                    </p>
                  </div>
                </div>
              )}

              {/* AIレポート生成カード */}
              <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(155,93,229,0.05)", border: "1px solid rgba(155,93,229,0.2)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Sparkles size={20} style={{ color: "var(--color-brand-purple)", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>AIレポートを生成</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        今週の学習データ・テスト結果をAIが分析してコメントを作成します。
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateReport}
                    disabled={saving}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-pill transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #9B5DE5, #1CB0F6)", color: "#fff" }}
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    {saving ? "生成中..." : "生成・保存"}
                  </button>
                </div>
                {saving && (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 size={14} className="animate-spin" style={{ color: "var(--color-brand-purple)" }} />
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>AIが学習データとテスト結果を分析しています...</p>
                  </div>
                )}
                {saveMsg && !saving && (
                  <p
                    className="text-xs font-semibold text-center py-1.5 rounded-lg"
                    style={{
                      background: saveMsg.includes("失敗") ? "rgba(255,75,75,0.08)" : "rgba(88,204,2,0.08)",
                      color: saveMsg.includes("失敗") ? "var(--color-error)" : "var(--color-brand-green)",
                    }}
                  >
                    {saveMsg.includes("失敗") ? "❌" : "✓"} {saveMsg}
                  </p>
                )}
                {latestAiComment && (
                  <div className="rounded-xl p-4" style={{ background: "rgba(28,176,246,0.06)", border: "1px solid rgba(28,176,246,0.18)" }}>
                    <p className="text-xs font-bold mb-2" style={{ color: "var(--color-brand-blue)" }}>✨ AIアシスタントのコメント</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{latestAiComment}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "rgba(155,93,229,0.15)" }}>
                  <div className="flex items-center gap-2">
                    <Clock size={14} style={{ color: "var(--color-text-muted)" }} />
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>週次メール（毎週日曜に自動生成・送信）</p>
                  </div>
                  <Link
                    href="/settings/parent"
                    className="text-xs font-semibold px-3 py-1 rounded-pill transition-all hover:opacity-80"
                    style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
                  >
                    設定
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* ════════════════════════════════════
              過去のレポートタブ
          ════════════════════════════════════ */}
          {tab === "history" && (
            <>
              {!reportsLoaded ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-7 h-7 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--color-brand-blue)" }} />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <p className="text-4xl">📭</p>
                  <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>まだレポートがありません</p>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    「今週」タブの「AIレポートを生成」ボタンでレポートを作成できます。
                  </p>
                  <button
                    onClick={() => setTab("current")}
                    className="mt-2 text-sm font-semibold px-4 py-2 rounded-pill transition-all hover:opacity-80"
                    style={{ background: "var(--color-brand-blue)", color: "#fff" }}
                  >
                    今週を見る →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                    {reports.length}件のレポートがあります（タップで展開）
                  </p>
                  {reports.map((r) => (
                    <ReportHistoryCard key={r.id} report={r} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
