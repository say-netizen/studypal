"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUserGoals, achieveGoal, deleteGoal, type GoalDoc } from "@/lib/firebase/schema";
import { Target, Plus, CheckCircle2, Trash2, Star } from "lucide-react";
import Link from "next/link";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const SUBJECT_COLORS: Record<string, string> = {
  国語: "#9B5DE5", 数学: "var(--color-brand-primary)", 英語: "#58CC02", 理科: "#00C9A7", 社会: "#FF9600", その他: "#9CA3AF",
};

export default function GoalsPage() {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState<(GoalDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!currentUser) return;
    try {
      const data = await getUserGoals(currentUser.uid);
      setGoals(data as (GoalDoc & { id: string })[]);
    } catch (e) {
      console.error("goals fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentUser]);

  async function handleAchieve(id: string) {
    await achieveGoal(id);
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, achieved: true } : g));
  }

  async function handleDelete(id: string) {
    await deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  const active = goals.filter((g) => !g.achieved);
  const done = goals.filter((g) => g.achieved);

  if (loading) return <LoadingScreen />;

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <Target size={22} style={{ color: "var(--color-brand-blue)" }} />
            目標
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            自分で決めた目標を達成しよう
          </p>
        </div>
        <Link
          href="/goals/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-pill font-bold text-white text-sm transition-all hover:-translate-y-0.5"
          style={{ background: "var(--color-brand-blue)", boxShadow: "0 4px 12px rgba(28,176,246,0.4)" }}
        >
          <Plus size={15} />
          追加
        </Link>
      </div>

      {/* 進行中の目標 */}
      {active.length > 0 ? (
        <div className="space-y-3">
          {active.map((goal) => {
            const color = SUBJECT_COLORS[goal.subject] ?? "#9CA3AF";
            return (
              <div
                key={goal.id}
                className="rounded-2xl p-4"
                style={{
                  background: "var(--color-bg-primary)",
                  border: `2px solid ${color}30`,
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: color + "15" }}
                    >
                      🎯
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>
                        {goal.description}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color }}>
                        {goal.subject} · 目標{goal.targetScore}点
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <button
                  onClick={() => handleAchieve(goal.id)}
                  className="mt-3 w-full py-2 rounded-pill text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                  style={{ background: color + "15", color }}
                >
                  <CheckCircle2 size={15} />
                  達成した！
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-3"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <Target size={40} style={{ color: "var(--color-text-muted)" }} />
          <p className="font-bold text-center" style={{ color: "var(--color-text-primary)" }}>
            まだ目標がありません
          </p>
          <p className="text-sm text-center" style={{ color: "var(--color-text-muted)" }}>
            「数学で80点取る」など<br />自分だけの目標を設定しよう！
          </p>
          <Link
            href="/goals/new"
            className="mt-2 px-6 py-2.5 rounded-pill font-bold text-white text-sm transition-all hover:-translate-y-0.5"
            style={{ background: "var(--color-brand-blue)", boxShadow: "0 4px 12px rgba(28,176,246,0.4)" }}
          >
            目標を追加する
          </Link>
        </div>
      )}

      {/* 達成済み */}
      {done.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "var(--color-brand-green)" }}>
            <Star size={12} /> 達成済み ({done.length}件)
          </p>
          <div className="space-y-2">
            {done.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-70"
                style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
              >
                <CheckCircle2 size={16} style={{ color: "var(--color-brand-green)", flexShrink: 0 }} />
                <p className="text-sm line-through flex-1" style={{ color: "var(--color-text-muted)" }}>
                  {goal.description}
                </p>
                <button onClick={() => handleDelete(goal.id)} className="hover:opacity-70" style={{ color: "var(--color-text-muted)" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
