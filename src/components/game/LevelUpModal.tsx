"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

type LevelUpModalProps = {
  level: number;
  onClose: () => void;
};

function levelTier(level: number): { label: string; color: string; bg: string } {
  if (level <= 10) return { label: "Bronze", color: "#CD7F32", bg: "linear-gradient(135deg,#CD7F32,#A0522D)" };
  if (level <= 20) return { label: "Silver", color: "#C0C0C0", bg: "linear-gradient(135deg,#C0C0C0,#808080)" };
  if (level <= 30) return { label: "Gold", color: "#FFD700", bg: "linear-gradient(135deg,#FFD700,#FFA500)" };
  return { label: "Diamond", color: "var(--color-brand-blue)", bg: "linear-gradient(135deg,#1CB0F6,#9B5DE5)" };
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const tier = levelTier(level);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
      colors: ["#58CC02","#1CB0F6","#9B5DE5","#FFD900","#FF9600"],
    });
  }, []);

  // ESCキーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`レベル${level}に上がりました`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--color-bg-primary)",
          borderRadius: "var(--radius-xl)",
          padding: "40px 32px",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          boxShadow: "var(--shadow-xl)",
          animation: "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* バッジ */}
        <div
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            background: tier.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "2.5rem",
            fontWeight: 900,
            color: "#fff",
            fontFamily: "var(--font-display)",
            boxShadow: `0 8px 30px ${tier.color}50`,
            animation: "bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
          }}
        >
          {level}
        </div>

        <div style={{ fontSize: "2rem", marginBottom: "8px", animation: "bounceIn 0.4s ease 0.2s both" }}>🎉</div>

        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 900, color: "var(--color-text-primary)", marginBottom: "8px" }}>
          レベルアップ！
        </h2>
        <p style={{ fontSize: "1rem", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
          <strong style={{ color: tier.color }}>{tier.label}</strong> ランクに到達
        </p>
        <p style={{ fontSize: "2rem", fontFamily: "var(--font-display)", fontWeight: 900, color: tier.color, marginBottom: "24px" }}>
          Lv. {level}
        </p>

        <button
          onClick={onClose}
          style={{
            background: "var(--color-brand-blue)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-pill)",
            padding: "12px 32px",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "var(--font-ui)",
            boxShadow: "var(--shadow-brand-blue)",
            transition: "transform 120ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          続ける！
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes bounceIn { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
