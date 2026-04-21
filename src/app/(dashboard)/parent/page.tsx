"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getUser,
  getUserTests,
  getUserGoals,
  getStudySessionRange,
  type UserDoc,
  type TestDoc,
  type GoalDoc,
  type StudySessionDoc,
} from "@/lib/firebase/schema";
import { format, subDays, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Lock, Sparkles, Target, Flame, CheckCircle2, AlertTriangle, Clock, TrendingUp, Star,
} from "lucide-react";
import Link from "next/link";

// 準備ステータス判定
function getTestPrepStatus(
  test: TestDoc & { id: string },
  sessions: (StudySessionDoc & { id: string })[],
): { label: string; color: string; emoji: string } {
  const daysLeft = differenceInDays(test.testDate.toDate(), new Date());
  if (daysLeft < 0) return { label: "終了", color: "#9CA3AF", emoji: "✅" };

  const subjectSessions = sessions.filter((s) => s.subject === test.subject);
  const sessionCount = subjectSessions.length;
  const totalMins = subjectSessions.reduce((a, b) => a + b.actualMinutes, 0);

  if (sessionCount === 0) {
    return { label: "まだ何もしてない", color: "#FF4B4B", emoji: "😟" };
  }
  if (totalMins >= 60 || (daysLeft > 3 && sessionCount >= 2)) {
    return { label: "準備OK", color: "#58CC02", emoji: "💪" };
  }
  return { label: "準備中", color: "#FF9600", emoji: "📖" };
}

export default function ParentPage() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserDoc | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 指標データ
  const [sessions, setSessions] = useState<(StudySessionDoc & { id: string })[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<(TestDoc & { id: string })[]>([]);
  const [goals, setGoals] = useState<(GoalDoc & { id: string })[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      try {
        const user = await getUser(currentUser!.uid);
        setUserData(user);
        setPlan(user?.plan ?? "free");
        if (user?.plan !== "family") { setLoading(false); return; }

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
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

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
          <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
            保護者ダッシュボード
          </h1>
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
            "目標設定・達成通知",
            "週次メールレポート",
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

  // ── 自主性スコア計算 ──
  const weekSessions = sessions.filter((s) => {
    const weekAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");
    return s.date >= weekAgo;
  });
  const scheduledCount = weekSessions.filter((s) => s.scheduleId !== null).length;
  const freeCount = weekSessions.filter((s) => s.scheduleId === null).length;
  const totalCount = weekSessions.length;
  const scheduledRate = totalCount > 0 ? Math.round((scheduledCount / totalCount) * 100) : 0;

  // 自主性スコア: 予定通り率 × 0.5 + 自発勉強あり × 0.3 + ストリーク × 0.2
  const streakScore = Math.min((userData?.currentStreak ?? 0) / 7, 1) * 100;
  const autonomyScore = Math.round(scheduledRate * 0.5 + (freeCount > 0 ? 100 : 0) * 0.3 + streakScore * 0.2);

  const childName = userData?.name ?? "お子さん";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          保護者ダッシュボード
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {childName}さんの今週の学習状況
        </p>
      </div>

      {/* ── 自主性スコア（メインカード）── */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(88,204,2,0.08), rgba(28,176,246,0.08))",
          border: "2px solid rgba(88,204,2,0.25)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-brand-green)" }}>
              🧠 自主性スコア
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              「うちの子、自分で考えて勉強してる」指標
            </p>
          </div>
          <div
            className="flex items-center justify-center w-20 h-20 rounded-full"
            style={{
              background: `conic-gradient(#58CC02 ${autonomyScore * 3.6}deg, var(--color-bg-tertiary) 0deg)`,
            }}
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--color-bg-primary)" }}>
              <span className="text-xl font-display font-black" style={{ color: "var(--color-brand-green)" }}>
                {autonomyScore}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: "📅",
              label: "予定通りに勉強した率",
              value: `${scheduledRate}%`,
              sub: `今週 ${scheduledCount}/${totalCount} 回`,
              color: scheduledRate >= 70 ? "#58CC02" : scheduledRate >= 40 ? "#FF9600" : "#FF4B4B",
            },
            {
              icon: "⚡",
              label: "自発的に勉強した回数",
              value: `${freeCount}回`,
              sub: "予定外の自主学習",
              color: freeCount >= 3 ? "#58CC02" : freeCount >= 1 ? "#FF9600" : "#9CA3AF",
            },
            {
              icon: "🔥",
              label: "ストリーク継続",
              value: `${userData?.currentStreak ?? 0}日`,
              sub: "連続学習日数",
              color: (userData?.currentStreak ?? 0) >= 3 ? "#FF9600" : "#9CA3AF",
            },
            {
              icon: "📝",
              label: "テスト登録数",
              value: `${upcomingTests.length}件`,
              sub: "今後のテスト",
              color: upcomingTests.length >= 1 ? "#1CB0F6" : "#9CA3AF",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-3"
              style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
            >
              <p className="text-lg mb-1">{item.icon}</p>
              <p className="text-xl font-display font-black" style={{ color: item.color }}>{item.value}</p>
              <p className="text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{item.label}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── テスト準備状況 ── */}
      {upcomingTests.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="font-display font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <Target size={16} style={{ color: "var(--color-brand-blue)" }} />
            テストまでの準備状況
          </h2>
          <div className="space-y-3">
            {upcomingTests.slice(0, 4).map((test) => {
              const status = getTestPrepStatus(test, sessions);
              const daysLeft = differenceInDays(test.testDate.toDate(), new Date());
              return (
                <div
                  key={test.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                  style={{ borderColor: "var(--color-bg-tertiary)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{status.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                        {test.subject}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        あと{daysLeft}日 ·{" "}
                        {format(test.testDate.toDate(), "M月d日（E）", { locale: ja })}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: status.color + "18", color: status.color }}
                  >
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 目標 ── */}
      {goals.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="font-display font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <Star size={16} style={{ color: "var(--color-xp-gold)" }} />
            {childName}さんの目標
          </h2>
          <div className="space-y-2">
            {goals.filter((g) => !g.achieved).slice(0, 3).map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-bg-tertiary)" }}
              >
                <Target size={16} style={{ color: "var(--color-brand-blue)", flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                    {goal.description}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    目標: {goal.targetScore}点
                  </p>
                </div>
              </div>
            ))}
            {goals.filter((g) => g.achieved).length > 0 && (
              <p className="text-xs text-center pt-1" style={{ color: "var(--color-brand-green)" }}>
                ✓ 達成済み {goals.filter((g) => g.achieved).length}件
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── ストリーク・XP ── */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <Flame size={24} style={{ color: "var(--color-streak)" }} />
          <div>
            <p className="text-2xl font-display font-black" style={{ color: "var(--color-streak)" }}>
              {userData?.currentStreak ?? 0}日
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>連続学習</p>
          </div>
        </div>
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <TrendingUp size={24} style={{ color: "var(--color-brand-blue)" }} />
          <div>
            <p className="text-2xl font-display font-black" style={{ color: "var(--color-brand-blue)" }}>
              Lv.{userData?.currentLevel ?? 1}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>現在のレベル</p>
          </div>
        </div>
      </div>

      {/* ── 緊急アラート ── */}
      {upcomingTests.some((t) => {
        const days = differenceInDays(t.testDate.toDate(), new Date());
        const subjectSessions = sessions.filter((s) => s.subject === t.subject);
        return days <= 3 && days >= 0 && subjectSessions.length === 0;
      }) && (
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "rgba(255,75,75,0.08)", border: "1px solid rgba(255,75,75,0.25)" }}
        >
          <AlertTriangle size={20} style={{ color: "var(--color-error)", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--color-error)" }}>
              ⚠️ テスト直前なのに勉強ゼロです
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {upcomingTests.filter((t) => {
                const days = differenceInDays(t.testDate.toDate(), new Date());
                return days <= 3 && days >= 0 && sessions.filter((s) => s.subject === t.subject).length === 0;
              }).map((t) => t.subject).join("・")}
              のテストが3日以内にあります。今すぐ声をかけてあげてください。
            </p>
          </div>
        </div>
      )}

      {/* ── レポート ── */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: "rgba(28,176,246,0.06)", border: "1px solid rgba(28,176,246,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <Clock size={18} style={{ color: "var(--color-brand-blue)" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              週次メールレポート
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              毎週日曜に保護者メールへ自動送信
            </p>
          </div>
        </div>
        <Link
          href="/settings/parent"
          className="text-xs font-semibold px-3 py-1.5 rounded-pill transition-all hover:opacity-80"
          style={{ background: "var(--color-brand-blue)", color: "#fff" }}
        >
          設定
        </Link>
      </div>
    </div>
  );
}
