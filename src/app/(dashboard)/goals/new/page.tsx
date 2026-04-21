"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { createGoal } from "@/lib/firebase/schema";
import { ArrowLeft, Target } from "lucide-react";
import Link from "next/link";

const SUBJECTS = ["国語", "数学", "英語", "理科", "社会", "その他"];
const SUBJECT_COLORS: Record<string, string> = {
  国語: "#9B5DE5", 数学: "#1CB0F6", 英語: "#58CC02", 理科: "#00C9A7", 社会: "#FF9600", その他: "#9CA3AF",
};
const SCORE_PRESETS = [60, 70, 75, 80, 85, 90, 95, 100];

export default function NewGoalPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [subject, setSubject] = useState("");
  const [targetScore, setTargetScore] = useState(80);
  const [saving, setSaving] = useState(false);

  const description = subject ? `${subject}で${targetScore}点取る` : "";
  const color = SUBJECT_COLORS[subject] ?? "var(--color-brand-blue)";

  async function handleSave() {
    if (!currentUser || !subject) return;
    setSaving(true);
    try {
      await createGoal({
        userId: currentUser.uid,
        subject,
        description,
        targetScore,
        testId: null,
      });
      router.push("/goals");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/goals"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <h1 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          目標を追加
        </h1>
      </div>

      {/* プレビュー */}
      {subject && (
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: color + "10", border: `2px solid ${color}30` }}
        >
          <div className="text-4xl">🎯</div>
          <div>
            <p className="text-xl font-display font-black" style={{ color }}>
              {description}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              {subject} · 目標点数: {targetScore}点
            </p>
          </div>
        </div>
      )}

      {/* 科目 */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>科目</p>
        <div className="grid grid-cols-3 gap-2">
          {SUBJECTS.map((s) => {
            const c = SUBJECT_COLORS[s];
            const active = subject === s;
            return (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: active ? c + "18" : "var(--color-bg-secondary)",
                  border: `2px solid ${active ? c : "var(--color-bg-tertiary)"}`,
                  color: active ? c : "var(--color-text-secondary)",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* 目標点数 */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
          目標点数: <span style={{ color: subject ? color : "var(--color-brand-blue)" }}>{targetScore}点</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {SCORE_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => setTargetScore(s)}
              className="px-3.5 py-1.5 rounded-pill text-sm font-semibold transition-all"
              style={{
                background: targetScore === s ? (subject ? color : "var(--color-brand-blue)") : "var(--color-bg-secondary)",
                color: targetScore === s ? "#fff" : "var(--color-text-secondary)",
                border: `1px solid ${targetScore === s ? "transparent" : "var(--color-bg-tertiary)"}`,
              }}
            >
              {s}点
            </button>
          ))}
        </div>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={targetScore}
          onChange={(e) => setTargetScore(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: subject ? color : "var(--color-brand-blue)" }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!subject || saving}
        className="w-full py-3.5 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: subject ? color : "var(--color-brand-blue)", boxShadow: `0 4px 12px ${subject ? color : "#1CB0F6"}40` }}
      >
        {saving ? (
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
        ) : (
          <Target size={16} />
        )}
        {saving ? "保存中..." : "目標を設定する"}
      </button>
    </div>
  );
}
