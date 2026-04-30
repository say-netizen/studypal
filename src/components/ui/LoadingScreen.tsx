"use client";

export function LoadingScreen({ fullPage = false }: { fullPage?: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4"
      style={{ minHeight: fullPage ? "100svh" : "200px" }}
    >
      <div className="relative">
        {/* 外側の回転リング */}
        <svg width="64" height="64" viewBox="0 0 64 64" className="animate-spin" style={{ animationDuration: "1.2s" }}>
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke="var(--color-bg-tertiary)"
            strokeWidth="5"
          />
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke="var(--color-brand-primary)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 28 * 0.25} ${2 * Math.PI * 28 * 0.75}`}
          />
        </svg>
        {/* 中央の本アイコン */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>📚</span>
        </div>
      </div>

      {/* ドット */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "var(--color-brand-primary)",
              opacity: 0.4,
              animation: `dotPulse 1.2s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
