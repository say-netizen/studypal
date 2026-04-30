type LogoProps = {
  size?: number;
  color?: string;
  className?: string;
};

export function LogoIcon({ size = 32, color = "var(--color-brand-primary)", className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 角帽子 — 上の平らな板（広め） */}
      <rect x="16" y="4" width="44" height="19" rx="2.5" fill={color} />
      {/* 角帽子 — ブリム */}
      <rect x="9" y="21" width="58" height="10" rx="3" fill={color} />

      {/* 顔（円） */}
      <circle cx="38" cy="50" r="18" fill={color} />
      {/* スマイル（白抜き） */}
      <path
        d="M29 55 Q38 66 47 55"
        stroke="white"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* 卒業ガウン — Vネックラペル + ボディ */}
      <path
        d="M9 80 L20 63 L30 56 L38 67 L46 56 L56 63 L67 80 Z"
        fill={color}
      />

      {/* タッセル紐（顔の上に重ねて表示） */}
      <rect x="57" y="4" width="2.5" height="36" rx="1.25" fill={color} />
      {/* タッセル先端 */}
      <circle cx="58.25" cy="43" r="4.5" fill={color} />
    </svg>
  );
}

export function LogoWithText({ size = 32, color = "var(--color-brand-primary)" }: LogoProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <LogoIcon size={size} color={color} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: `${size * 0.6}px`,
          color,
          letterSpacing: "-0.01em",
        }}
      >
        StudyPal
      </span>
    </span>
  );
}
