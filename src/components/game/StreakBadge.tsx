"use client";

type StreakBadgeProps = {
  days: number;
  danger?: boolean; // 当日未学習 = 危機状態
  size?: "sm" | "md" | "lg";
};

const SIZE_MAP = {
  sm: { padding: "4px 12px", fontSize: "0.75rem", iconSize: "0.875rem" },
  md: { padding: "6px 14px", fontSize: "0.875rem", iconSize: "1rem" },
  lg: { padding: "8px 18px", fontSize: "1rem", iconSize: "1.25rem" },
};

export function StreakBadge({ days, danger = false, size = "md" }: StreakBadgeProps) {
  const s = SIZE_MAP[size];

  return (
    <div
      aria-label={`${days}日連続ストリーク`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        background: danger ? "rgba(255,75,75,.1)" : "rgba(255,150,0,.1)",
        border: `1px solid ${danger ? "rgba(255,75,75,.25)" : "rgba(255,150,0,.25)"}`,
        borderRadius: "var(--radius-pill)",
        padding: s.padding,
      }}
    >
      <span
        style={{
          fontSize: s.iconSize,
          animation: danger ? "shake 0.5s ease infinite" : "streakPulse 1.5s ease-in-out infinite",
          display: "inline-block",
        }}
        aria-hidden="true"
      >
        🔥
      </span>
      <span
        style={{
          fontSize: s.fontSize,
          fontWeight: 700,
          color: danger ? "var(--color-error)" : "var(--color-streak)",
          fontFamily: "var(--font-display)",
        }}
      >
        {days}日{danger ? " 危機！" : " 連続"}
      </span>

      <style>{`
        @keyframes streakPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 60%{transform:translateX(4px)} }
      `}</style>
    </div>
  );
}
