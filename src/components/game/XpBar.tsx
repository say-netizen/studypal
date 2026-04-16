"use client";

import { useEffect, useState } from "react";
import { calcLevelProgress } from "@/lib/gamification/level";

type XpBarProps = {
  totalXp: number;
  /** 加算前のXP (アニメーション起点) */
  prevTotalXp?: number;
  onLevelUp?: (newLevel: number) => void;
};

/** レベル帯に応じたカラー */
function levelColor(level: number): string {
  if (level <= 10) return "#CD7F32";   // Bronze
  if (level <= 20) return "#C0C0C0";   // Silver
  if (level <= 30) return "#FFD700";   // Gold
  return "var(--color-brand-blue)";    // Diamond
}

export function XpBar({ totalXp, prevTotalXp, onLevelUp }: XpBarProps) {
  const { level, currentXp, requiredXp, progress } = calcLevelProgress(totalXp);
  const [displayProgress, setDisplayProgress] = useState(
    prevTotalXp !== undefined ? calcLevelProgress(prevTotalXp).progress : progress
  );

  useEffect(() => {
    const prevInfo = prevTotalXp !== undefined ? calcLevelProgress(prevTotalXp) : null;
    if (prevInfo && prevInfo.level < level) {
      onLevelUp?.(level);
    }
    // アニメーション
    const timer = setTimeout(() => setDisplayProgress(progress), 60);
    return () => clearTimeout(timer);
  }, [progress, prevTotalXp, level, onLevelUp]);

  const color = levelColor(level);

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
              fontSize: "0.75rem",
              fontWeight: 900,
              color: "#fff",
            }}
          >
            {level}
          </span>
          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
            レベル {level}
          </span>
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          {currentXp} / {requiredXp} XP
        </span>
      </div>

      {/* バー */}
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
            background: "linear-gradient(90deg,#58CC02,#89E219)",
            borderRadius: "var(--radius-pill)",
            transition: "width 600ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>
    </div>
  );
}
