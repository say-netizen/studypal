"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUser, getScheduleRange, getTestQuestions, getUserTests, type UserDoc, type ScheduleDoc } from "@/lib/firebase/schema";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ja } from "date-fns/locale";
import { Lock, TrendingUp, CheckCircle2, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import { calcLevelProgress } from "@/lib/gamification/level";

const SUBJECT_COLORS: Record<string, string> = {
  国語: "#9B5DE5",
  数学: "#1CB0F6",
  英語: "#58CC02",
  理科: "#00C9A7",
  社会: "#FF9600",
};

function StudyBarChart({ data }: { data: { date: string; minutes: number }[] }) {
  const max = Math.max(...data.map((d) => d.minutes), 60);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d) => {
        const height = max > 0 ? (d.minutes / max) * 100 : 0;
        const today = format(new Date(), "yyyy-MM-dd");
        const isToday = d.date === today;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex-1 flex items-end w-full">
              <div
                className="w-full rounded-t-lg transition-all duration-600"
                style={{
                  height: `${height}%`,
                  minHeight: d.minutes > 0 ? "4px" : "0",
                  background: isToday
                    ? "var(--color-brand-blue)"
                    : "rgba(28,176,246,0.4)",
                }}
              />
            </div>
            <span
              className="text-[9px]"
              style={{ color: isToday ? "var(--color-brand-blue)" : "var(--color-text-muted)" }}
            >
              {format(new Date(d.date + "T00:00:00"), "E", { locale: ja })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ParentPage() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserDoc | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyStudy, setWeeklyStudy] = useState<{ date: string; minutes: number }[]>([]);
  const [subjectMinutes, setSubjectMinutes] = useState<Record<string, number>>({});
  const [recentTestResults, setRecentTestResults] = useState<{
    subject: string;
    correct: number;
    total: number;
    date: string;
  }[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      try {
        const user = await getUser(currentUser!.uid);
        setUserData(user);
        setPlan(user?.plan ?? "free");

        if (user?.plan === "free") {
          setLoading(false);
          return;
        }

        // 過去7日間のスケジュール取得
        const today = new Date();
        const weekAgo = subDays(today, 6);
        const startStr = format(weekAgo, "yyyy-MM-dd");
        const endStr = format(today, "yyyy-MM-dd");
        const schedules = await getScheduleRange(currentUser!.uid, startStr, endStr) as (ScheduleDoc & { id: string })[];

        // 日別勉強時間
        const days = eachDayOfInterval({ start: weekAgo, end: today });
        const studyByDay = days.map((d) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const daySchedules = schedules.filter((s) => s.date === dateStr && s.type === "study");
          const minutes = daySchedules.reduce((sum, s) => sum + (s.duration || 0), 0);
          return { date: dateStr, minutes };
        });
        setWeeklyStudy(studyByDay);

        // 科目別勉強時間
        const subjectMap: Record<string, number> = {};
        for (const s of schedules) {
          if (s.type === "study" && s.subject) {
            subjectMap[s.subject] = (subjectMap[s.subject] ?? 0) + (s.duration || 0);
          }
        }
        setSubjectMinutes(subjectMap);

        // テスト結果
        const tests = await getUserTests(currentUser!.uid, 5);
        const results = await Promise.all(
          tests.map(async (t) => {
            const qs = await getTestQuestions(t.id);
            const answered = qs.filter((q) => q.isCorrect !== null);
            const correct = qs.filter((q) => q.isCorrect === true).length;
            return {
              subject: t.subject,
              correct,
              total: answered.length,
              date: format(t.testDate.toDate(), "M月d日", { locale: ja }),
            };
          })
        );
        setRecentTestResults(results.filter((r) => r.total > 0));
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

  // Family以外はアップグレード誘導
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
            お子さんの学習状況を詳しく確認できます。
          </p>
        </div>
        <div className="w-full rounded-2xl p-5" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Lock size={18} style={{ color: "var(--color-brand-purple)" }} />
            <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>Familyプランの機能です</p>
          </div>
          {["週次学習レポート", "科目別学習時間グラフ", "テスト結果履歴", "今週のランキング順位"].map((f) => (
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

  const { level, currentXp, requiredXp, progress } = calcLevelProgress(userData?.totalXp ?? 0);
  const totalStudyMinutes = weeklyStudy.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          保護者ダッシュボード
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {userData?.name ?? "お子さん"} さんの学習状況
        </p>
      </div>

      {/* ステータスカード */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "レベル", value: `Lv.${level}`, icon: "⭐", color: "var(--color-brand-purple)" },
          { label: "今週の勉強", value: `${totalStudyMinutes}分`, icon: "📖", color: "var(--color-brand-blue)" },
          { label: "ストリーク", value: `${userData?.currentStreak ?? 0}日`, icon: "🔥", color: "var(--color-streak)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-3 text-center"
            style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="text-xl font-display font-black" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* XPバー */}
      <div className="rounded-2xl p-5" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>レベル {level} 進捗</span>
          <span style={{ color: "var(--color-text-muted)" }}>{currentXp} / {requiredXp} XP</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--color-bg-tertiary)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(progress * 100, 100)}%`,
              background: "linear-gradient(90deg, var(--color-brand-green), #89E219)",
            }}
          />
        </div>
      </div>

      {/* 週間勉強グラフ */}
      <div className="rounded-2xl p-5" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}>
        <h2 className="font-display font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <TrendingUp size={16} style={{ color: "var(--color-brand-blue)" }} />
          今週の勉強時間
        </h2>
        <StudyBarChart data={weeklyStudy} />
        <p className="text-xs mt-2 text-right" style={{ color: "var(--color-text-muted)" }}>
          合計 {totalStudyMinutes}分 / 今週
        </p>
      </div>

      {/* 科目別時間 */}
      {Object.keys(subjectMinutes).length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-display font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <BookOpen size={16} style={{ color: "var(--color-brand-purple)" }} />
            科目別学習時間
          </h2>
          <div className="space-y-3">
            {Object.entries(subjectMinutes)
              .sort(([, a], [, b]) => b - a)
              .map(([subj, mins]) => {
                const max = Math.max(...Object.values(subjectMinutes));
                const pct = max > 0 ? (mins / max) * 100 : 0;
                const color = SUBJECT_COLORS[subj] ?? "var(--color-brand-blue)";
                return (
                  <div key={subj}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{subj}</span>
                      <span style={{ color: "var(--color-text-muted)" }}>{mins}分</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--color-bg-tertiary)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-600"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* テスト結果 */}
      {recentTestResults.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-display font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <CheckCircle2 size={16} style={{ color: "var(--color-brand-green)" }} />
            テスト結果
          </h2>
          <div className="space-y-3">
            {recentTestResults.map((r, i) => {
              const score = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
              const color = score >= 80 ? "var(--color-brand-green)" : score >= 60 ? "var(--color-warning)" : "var(--color-error)";
              return (
                <div key={i} className="flex items-center gap-4 py-2.5 border-b last:border-b-0" style={{ borderColor: "var(--color-bg-tertiary)" }}>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{r.subject}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{r.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-display font-black" style={{ color }}>
                      {score}%
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {r.correct}/{r.total}問
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
