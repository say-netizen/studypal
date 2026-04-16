"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUserTests, type TestDoc } from "@/lib/firebase/schema";
import { differenceInDays, format } from "date-fns";
import { ja } from "date-fns/locale";
import { Plus, BookOpen, ChevronRight, Calendar } from "lucide-react";

const SUBJECT_COLORS: Record<string, string> = {
  国語: "var(--color-brand-purple)",
  数学: "var(--color-brand-blue)",
  英語: "var(--color-brand-green)",
  理科: "var(--color-accent-teal)",
  社会: "var(--color-brand-orange)",
};

const SUBJECT_ICONS: Record<string, string> = {
  国語: "📖",
  数学: "📐",
  英語: "🌍",
  理科: "🔬",
  社会: "🗺️",
};

function TestCard({ test }: { test: TestDoc & { id: string } }) {
  const days = differenceInDays(test.testDate.toDate(), new Date());
  const color = SUBJECT_COLORS[test.subject] ?? "var(--color-brand-blue)";
  const icon = SUBJECT_ICONS[test.subject] ?? "📝";

  const urgency =
    days < 0
      ? { label: "終了", color: "var(--color-text-muted)" }
      : days === 0
      ? { label: "今日！", color: "var(--color-error)" }
      : days <= 3
      ? { label: `あと${days}日`, color: "var(--color-error)" }
      : days <= 7
      ? { label: `あと${days}日`, color: "var(--color-warning)" }
      : { label: `あと${days}日`, color };

  return (
    <Link
      href={`/tests/${test.id}`}
      className="flex items-center gap-4 rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--color-bg-primary)",
        border: "1px solid var(--color-bg-tertiary)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: color + "15" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="font-display font-bold text-base truncate"
          style={{ color: "var(--color-text-primary)" }}
        >
          {test.subject}
        </p>
        <p
          className="text-xs flex items-center gap-1 mt-0.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          <Calendar size={11} />
          {format(test.testDate.toDate(), "M月d日（E）", { locale: ja })}
        </p>
        {test.range && (
          <p
            className="text-xs mt-1 truncate"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {test.range}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: urgency.color + "18", color: urgency.color }}
        >
          {urgency.label}
        </span>
        <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
      </div>
    </Link>
  );
}

export default function TestsPage() {
  const { currentUser } = useAuth();
  const [tests, setTests] = useState<(TestDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    getUserTests(currentUser.uid, 30)
      .then((list) => setTests(list as (TestDoc & { id: string })[]))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const upcoming = tests.filter(
    (t) => differenceInDays(t.testDate.toDate(), new Date()) >= 0
  );
  const past = tests.filter(
    (t) => differenceInDays(t.testDate.toDate(), new Date()) < 0
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-display font-black"
            style={{ color: "var(--color-text-primary)" }}
          >
            テスト管理
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {upcoming.length}件のテストが予定されています
          </p>
        </div>
        <Link
          href="/tests/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-pill text-sm font-bold text-white transition-all duration-120 hover:-translate-y-0.5"
          style={{
            background: "var(--color-brand-blue)",
            boxShadow: "0 4px 12px rgba(28,176,246,0.4)",
          }}
        >
          <Plus size={16} />
          テストを登録
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div
            className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-brand-blue)" }}
          />
        </div>
      ) : tests.length === 0 ? (
        /* 空状態 */
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="text-6xl">📝</div>
          <div className="text-center">
            <p
              className="font-display font-bold text-lg"
              style={{ color: "var(--color-text-primary)" }}
            >
              まだテストが登録されていません
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              テストを登録してAI予想問題を生成しましょう！
            </p>
          </div>
          <Link
            href="/tests/new"
            className="flex items-center gap-2 px-6 py-3 rounded-pill text-sm font-bold text-white transition-all duration-120 hover:-translate-y-0.5"
            style={{
              background: "var(--color-brand-blue)",
              boxShadow: "0 4px 12px rgba(28,176,246,0.4)",
            }}
          >
            <Plus size={16} />
            最初のテストを登録
          </Link>
        </div>
      ) : (
        <>
          {/* 予定テスト */}
          {upcoming.length > 0 && (
            <section>
              <h2
                className="text-sm font-semibold mb-3 flex items-center gap-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <BookOpen size={14} />
                予定されているテスト
              </h2>
              <div className="space-y-2">
                {upcoming.map((t) => (
                  <TestCard key={t.id} test={t} />
                ))}
              </div>
            </section>
          )}

          {/* 過去のテスト */}
          {past.length > 0 && (
            <section>
              <h2
                className="text-sm font-semibold mb-3 flex items-center gap-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                過去のテスト
              </h2>
              <div className="space-y-2 opacity-60">
                {past.slice(0, 5).map((t) => (
                  <TestCard key={t.id} test={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
