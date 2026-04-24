"use client";

import { useEffect, useState } from "react";
import { calcLevelProgress, levelTier } from "@/lib/gamification/level";

type XpBarProps = {
  totalXp: number;
  grade?: string | null;
  prevTotalXp?: number;
  onLevelUp?: (newLevel: number) => void;
};

export function XpBar({ totalXp, grade, prevTotalXp, onLevelUp }: XpBarProps) {
  const { level, currentXp, requiredXp, progress } = calcLevelProgress(totalXp, grade);
  const [displayProgress, setDisplayProgress] = useState(
    prevTotalXp !== undefined ? calcLevelProgress(prevTotalXp, grade).progress : progress
  );

  useEffect(() => {
    const prevInfo = prevTotalXp !== undefined ? calcLevelProgress(prevTotalXp, grade) : null;
    if (prevInfo && prevInfo.level < level) {
      onLevelUp?.(level);
    }
    const timer = setTimeout(() => setDisplayProgress(progress), 60);
    return () => clearTimeout(timer);
  }, [progress, prevTotalXp, level, grade, onLevelUp]);

  const { color, label } = levelTier(level);

  return (
    <div
      style={{
        background: "var(--color-bg-primary)",
        border: "1px solid var(--color-bg-tertiary)",
        borderRadius: "var(--radius-xl)",
        padding: "16px 20px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: color,
              fontSize: "0.7rem",
              fontWeight: 900,
              color: "#fff",
            }}
          >
            {level}
          </span>
          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
            レベル {level}
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "1px 7px",
              borderRadius: "9999px",
              background: color + "22",
              color,
            }}
          >
            {label}
          </span>
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {level >= 99 ? "MAX" : `${currentXp.toLocaleString()} / ${requiredXp.toLocaleString()} XP`}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={Math.round(displayProgress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`レベル${level}の進捗`}
        style={{
          width: "100%",
          height: "12px",
          borderRadius: "var(--radius-pill)",
          background: "var(--color-bg-tertiary)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(displayProgress * 100, 100)}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            borderRadius: "var(--radius-pill)",
            transition: "width 600ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>
    </div>
  );
}
