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
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 角帽子（モルタルボード） — 上の平らな板 */}
      <rect x="8" y="14" width="48" height="9" rx="2" fill={color} />
      {/* 帽子の頭部分 */}
      <rect x="27" y="23" width="10" height="7" fill={color} />
      {/* タッセル紐 */}
      <line x1="56" y1="18.5" x2="60" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* タッセル先端 */}
      <circle cx="60" cy="31" r="3" fill={color} />

      {/* 顔 */}
      <circle cx="32" cy="40" r="11" fill={color} />
      {/* スマイル（白抜き） */}
      <path d="M 24 42 Q 32 50 40 42" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* ガウン/体 */}
      <path d="M 10 58 L 22 51 L 32 56 L 42 51 L 54 58 L 50 64 L 14 64 Z" fill={color} />
      {/* Vネック（白） */}
      <path d="M 32 52 L 23 58 L 41 58 Z" fill="white" />
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
