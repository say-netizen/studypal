"use client";

import { useEffect, useState } from "react";

type BadgeUnlockToastProps = {
  badge: {
    emoji: string;
    title: string;
    desc?: string;
  };
  onDismiss: () => void;
  duration?: number; // ms
};

export function BadgeUnlockToast({ badge, onDismiss, duration = 4000 }: BadgeUnlockToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // マウント後にフェードイン
    const t1 = setTimeout(() => setVisible(true), 30);
    // 自動消去
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 350);
    }, duration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "20px"})`,
        opacity: visible ? 1 : 0,
        transition: "opacity 350ms ease, transform 350ms ease",
        zIndex: 9000,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          background: "var(--color-bg-primary)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          boxShadow: "var(--shadow-xl)",
          minWidth: "280px",
          maxWidth: "360px",
        }}
      >
        {/* バッジアイコン */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#FFD900,#FF9600)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            flexShrink: 0,
            animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: "0 4px 15px rgba(255,217,0,0.4)",
          }}
        >
          {badge.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-xp-gold)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
            🏅 バッジ獲得！
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {badge.title}
          </div>
          {badge.desc && (
            <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {badge.desc}
            </div>
          )}
        </div>

        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 350); }}
          aria-label="閉じる"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.2rem",
            color: "var(--color-text-muted)",
            lineHeight: 1,
            flexShrink: 0,
            padding: "4px",
          }}
        >
          ×
        </button>
      </div>

      <style>{`
        @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
