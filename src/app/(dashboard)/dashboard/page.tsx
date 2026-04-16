"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUser, getUserTests, getSchedulesByDate, type UserDoc, type TestDoc, type ScheduleDoc } from "@/lib/firebase/schema";
import { calcLevelProgress } from "@/lib/gamification/level";
import { format, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Flame,
  Star,
  Clock,
  ChevronRight,
  BookOpen,
  Calendar,
  Trophy,
} from "lucide-react";

// ────────── サブコンポーネント ──────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{
        background: "var(--color-bg-primary)",
        border: "1px solid var(--color-bg-tertiary)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + "15", color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          {value}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      </div>
    </div>
  );
}

function XpLevelBar({ totalXp }: { totalXp: number }) {
  const { level, currentXp, requiredXp, progress } = calcLevelProgress(totalXp);
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--color-bg-primary)",
        border: "1px solid var(--color-bg-tertiary)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black text-white"
            style={{ background: "var(--color-brand-purple)" }}
          >
            {level}
          </span>
          <span className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>
            レベル {level}
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {currentXp} / {requiredXp} XP
        </span>
      </div>
      {/* プログレスバー */}
      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ background: "var(--color-bg-tertiary)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(progress * 100, 100)}%`,
            background: "linear-gradient(90deg, var(--color-brand-green), #89E219)",
          }}
        />
      </div>
    </div>
  );
}

function TestCountdown({ test }: { test: TestDoc & { id: string } }) {
  const days = differenceInDays(test.testDate.toDate(), new Date());
  const daysLabel =
    days < 0 ? "終了" : days === 0 ? "今日！" : `あと ${days} 日`;
  const urgentColor =
    days <= 3
      ? "var(--color-error)"
      : days <= 7
      ? "var(--color-warning)"
      : "var(--color-brand-blue)";

  return (
    <div
      className="flex items-center justify-between py-3 border-b last:border-b-0"
      style={{ borderColor: "var(--color-bg-tertiary)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: urgentColor }}
        />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {test.subject}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {format(test.testDate.toDate(), "M月d日（E）", { locale: ja })}
          </p>
        </div>
      </div>
      <span
        className="text-xs font-bold px-2.5 py-1 rounded-full"
        style={{
          background: urgentColor + "18",
          color: urgentColor,
        }}
      >
        {daysLabel}
      </span>
    </div>
  );
}

const SCHEDULE_COLORS: Record<ScheduleDoc["type"], string> = {
  study:  "var(--color-brand-blue)",
  club:   "var(--color-brand-purple)",
  event:  "var(--color-brand-orange)",
  test:   "var(--color-error)",
};

function ScheduleItem({ schedule }: { schedule: ScheduleDoc & { id: string } }) {
  const color = SCHEDULE_COLORS[schedule.type];
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="w-1 h-8 rounded-full flex-shrink-0"
        style={{ background: color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
          {schedule.title}
        </p>
        {schedule.duration > 0 && (
          <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
            <Clock size={11} />
            {schedule.duration}分
          </p>
        )}
      </div>
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: color + "15", color }}
      >
        {schedule.subject ?? schedule.type}
      </span>
    </div>
  );
}

// ────────── メインページ ──────────

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserDoc | null>(null);
  const [tests, setTests] = useState<(TestDoc & { id: string })[]>([]);
  const [schedules, setSchedules] = useState<(ScheduleDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "M月d日（E）", { locale: ja });

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      try {
        const [user, testList, schedList] = await Promise.all([
          getUser(currentUser!.uid),
          getUserTests(currentUser!.uid, 5),
          getSchedulesByDate(currentUser!.uid, today),
        ]);
        setUserData(user);
        setTests(testList as (TestDoc & { id: string })[]);
        setSchedules(schedList as (ScheduleDoc & { id: string })[]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, today]);

  const displayName = currentUser?.displayName ?? "ゲスト";
  const totalXp = userData?.totalXp ?? 0;
  const streak = userData?.currentStreak ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-brand-blue)" }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* ── ウェルカム ── */}
      <div>
        <h1
          className="text-2xl font-display font-black"
          style={{ color: "var(--color-text-primary)" }}
        >
          おかえり、{displayName.split("").slice(0, 6).join("")}さん！ 👋
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {todayLabel} · 今日も一緒に頑張ろう
        </p>
      </div>

      {/* ── XP / レベルバー ── */}
      <XpLevelBar totalXp={totalXp} />

      {/* ── スタットカード ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Flame size={20} />}
          label="連続学習日数"
          value={`${streak}日`}
          color="var(--color-streak)"
        />
        <StatCard
          icon={<Star size={20} />}
          label="累計XP"
          value={totalXp.toLocaleString()}
          color="var(--color-xp-gold)"
        />
      </div>

      {/* ── 直近のテスト ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-base font-display font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <BookOpen size={18} style={{ color: "var(--color-brand-blue)" }} />
            直近のテスト
          </h2>
          <a
            href="/tests"
            className="text-xs font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-brand-blue)" }}
          >
            すべて見る <ChevronRight size={14} />
          </a>
        </div>

        <div
          className="rounded-2xl px-4 py-1"
          style={{
            background: "var(--color-bg-primary)",
            border: "1px solid var(--color-bg-tertiary)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {tests.length > 0 ? (
            tests.map((t) => <TestCountdown key={t.id} test={t} />)
          ) : (
            <p
              className="py-5 text-sm text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              テストが登録されていません
            </p>
          )}
        </div>
      </section>

      {/* ── 今日のスケジュール ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-base font-display font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Calendar size={18} style={{ color: "var(--color-brand-purple)" }} />
            今日のスケジュール
          </h2>
          <a
            href="/calendar"
            className="text-xs font-semibold flex items-center gap-0.5 hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-brand-blue)" }}
          >
            カレンダー <ChevronRight size={14} />
          </a>
        </div>

        <div
          className="rounded-2xl px-4 py-1"
          style={{
            background: "var(--color-bg-primary)",
            border: "1px solid var(--color-bg-tertiary)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {schedules.length > 0 ? (
            schedules.map((s) => <ScheduleItem key={s.id} schedule={s} />)
          ) : (
            <p
              className="py-5 text-sm text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              今日の予定はありません
            </p>
          )}
        </div>
      </section>

      {/* ── ランキング誘導 ── */}
      <a
        href="/ranking"
        className="flex items-center justify-between rounded-2xl px-5 py-4 transition-all duration-150 hover:-translate-y-0.5"
        style={{
          background: "linear-gradient(135deg, rgba(28,176,246,0.08), rgba(155,93,229,0.08))",
          border: "1px solid rgba(28,176,246,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <Trophy size={22} style={{ color: "var(--color-xp-gold)" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              今週のランキングを確認
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              みんなとスコアを競おう！
            </p>
          </div>
        </div>
        <ChevronRight size={18} style={{ color: "var(--color-text-muted)" }} />
      </a>
    </div>
  );
}
