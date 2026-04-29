"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronRight, X } from "lucide-react";

const STEPS = [
  {
    id: "test",
    emoji: "📅",
    title: "テスト日を登録する",
    desc: "テスト日を入れると、今日やることが自動で決まる",
    href: "/tests/new",
    cta: "テストを登録",
  },
  {
    id: "study",
    emoji: "⏱️",
    title: "勉強タイマーを1回使う",
    desc: "タイマーを止めるとXPがもらえてランキングに反映",
    href: "/study",
    cta: "タイマーへ",
  },
  {
    id: "ai",
    emoji: "✨",
    title: "AI予想問題を生成する",
    desc: "テスト範囲を入力するだけで10問自動作成（月3回無料）",
    href: "/tests",
    cta: "問題を作る",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function getCompleted(): StepId[] {
  try {
    return JSON.parse(localStorage.getItem("onboarding_done") ?? "[]") as StepId[];
  } catch { return []; }
}

export function OnboardingChecklist({ hasTests }: { hasTests: boolean }) {
  const [completed, setCompleted] = useState<StepId[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCompleted(getCompleted());
    setDismissed(!!localStorage.getItem("onboarding_dismissed"));
    // テスト登録済みなら自動チェック
    if (hasTests) markDone("test");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTests]);

  function markDone(id: StepId) {
    setCompleted((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem("onboarding_done", JSON.stringify(next));
      return next;
    });
  }

  function dismiss() {
    setDismissed(true);
    localStorage.setItem("onboarding_dismissed", "1");
  }

  if (!mounted || dismissed) return null;

  const doneCount = completed.length;
  const total = STEPS.length;
  const pct = Math.round((doneCount / total) * 100);

  // 全完了したら完了バナーに切り替え
  if (doneCount === total) {
    return (
      <div
        className="rounded-2xl p-4 flex items-center gap-3"
        style={{ background: "rgba(88,204,2,0.08)", border: "1px solid rgba(88,204,2,0.25)" }}
      >
        <span style={{ fontSize: "24px" }}>🎉</span>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: "var(--color-brand-green)" }}>
            準備完了！StudyPalを使いこなしてるね
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            テスト前に焦らないために、毎日続けよう
          </p>
        </div>
        <button onClick={dismiss} className="p-1 hover:opacity-60">
          <X size={15} style={{ color: "var(--color-text-muted)" }} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: "linear-gradient(135deg, rgba(28,176,246,0.05), rgba(155,93,229,0.05))",
        border: "1px solid rgba(28,176,246,0.2)",
      }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            🚀 StudyPalをはじめよう
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {doneCount}/{total} 完了
          </p>
        </div>
        <button onClick={dismiss} className="p-1 hover:opacity-60">
          <X size={15} style={{ color: "var(--color-text-muted)" }} />
        </button>
      </div>

      {/* プログレスバー */}
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--color-bg-tertiary)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #1CB0F6, #9B5DE5)" }}
        />
      </div>

      {/* ステップリスト */}
      <div className="space-y-2">
        {STEPS.map((step) => {
          const done = completed.includes(step.id);
          return (
            <Link
              key={step.id}
              href={step.href}
              onClick={() => markDone(step.id)}
              className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-80"
              style={{
                background: done ? "rgba(88,204,2,0.06)" : "var(--color-bg-primary)",
                border: `1px solid ${done ? "rgba(88,204,2,0.2)" : "var(--color-bg-tertiary)"}`,
                opacity: done ? 0.7 : 1,
              }}
            >
              {done
                ? <CheckCircle2 size={18} style={{ color: "var(--color-brand-green)", flexShrink: 0 }} />
                : <Circle size={18} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
              }
              <span style={{ fontSize: "20px", flexShrink: 0 }}>{step.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: done ? "var(--color-text-muted)" : "var(--color-text-primary)", textDecoration: done ? "line-through" : "none" }}>
                  {step.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {step.desc}
                </p>
              </div>
              {!done && <ChevronRight size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
