"use client";

import { useEffect, useState } from "react";

type ProgressBarProps = {
  value: number;   // 0〜100
  max?: number;
  height?: number;
  color?: string;
  animated?: boolean;
  label?: string;
};

export function ProgressBar({
  value,
  max = 100,
  height = 12,
  color = "linear-gradient(90deg, #58CC02, #89E219)",
  animated = true,
  label,
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const pct = Math.min((value / max) * 100, 100);

  useEffect(() => {
    // DOM挿入後に幅をアニメーション
    const timer = setTimeout(() => setWidth(pct), 60);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1" style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        style={{
          width: "100%",
          height: `${height}px`,
          borderRadius: "var(--radius-pill)",
          background: "var(--color-bg-tertiary)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${animated ? width : pct}%`,
            background: color,
            borderRadius: "var(--radius-pill)",
            transition: animated ? "width 600ms cubic-bezier(0.34,1.56,0.64,1)" : "none",
          }}
        />
      </div>
    </div>
  );
}
