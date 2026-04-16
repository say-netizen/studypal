"use client";

import { useState } from "react";

export function CtaSection() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDone(true);
  }

  return (
    <section
      id="cta"
      style={{
        padding: "96px 24px",
        background: "linear-gradient(135deg,#0A1628 0%,#1a2d50 50%,#0d2040 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 背景グリッド */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(28,176,246,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(28,176,246,.05) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      {/* オーブ */}
      <div aria-hidden="true" style={{ position: "absolute", width: "400px", height: "400px", background: "radial-gradient(circle,rgba(28,176,246,.12),transparent 70%)", borderRadius: "50%", filter: "blur(80px)", top: "-100px", right: "-100px", pointerEvents: "none" }} />
      <div aria-hidden="true" style={{ position: "absolute", width: "300px", height: "300px", background: "radial-gradient(circle,rgba(155,93,229,.10),transparent 70%)", borderRadius: "50%", filter: "blur(80px)", bottom: "-50px", left: "-80px", pointerEvents: "none" }} />

      <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,.5)", marginBottom: "16px", justifyContent: "center" }}>
          今すぐ始めよう
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: "#fff", marginBottom: "16px", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          今すぐ勉強を<br />
          <span style={{ color: "var(--color-xp-gold)" }}>変えよう。</span>
        </h2>
        <p style={{ fontSize: "1.0625rem", color: "rgba(255,255,255,.65)", marginBottom: "40px", lineHeight: 1.6 }}>
          先行登録で初月無料。クレジットカード不要。<br />
          2026年夏のリリース後すぐに使えます。
        </p>

        {done ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "64px", height: "64px", background: "var(--color-brand-green)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", animation: "bounceIn 0.5s ease" }}>✓</div>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>登録完了！</p>
            <p style={{ fontSize: "0.9375rem", color: "rgba(255,255,255,.6)" }}>リリース時にメールでお知らせします 🎉</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", gap: "12px", maxWidth: "480px", margin: "0 auto 16px", flexWrap: "wrap" }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレスを入力"
              required
              aria-label="メールアドレス"
              style={{
                flex: 1,
                minWidth: "0",
                background: "rgba(255,255,255,.1)",
                border: "1px solid rgba(255,255,255,.2)",
                borderRadius: "var(--radius-pill)",
                padding: "14px 22px",
                fontSize: "1rem",
                color: "#fff",
                fontFamily: "var(--font-ui)",
                outline: "none",
                transition: "border-color 200ms, background 200ms",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = "var(--color-brand-blue)";
                (e.currentTarget as HTMLInputElement).style.background = "rgba(255,255,255,.15)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(255,255,255,.2)";
                (e.currentTarget as HTMLInputElement).style.background = "rgba(255,255,255,.1)";
              }}
            />
            <button
              type="submit"
              style={{
                background: "var(--color-brand-green)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-pill)",
                padding: "14px 28px",
                fontSize: "1.0625rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(88,204,2,0.4)",
                transition: "transform 120ms, box-shadow 120ms",
                fontFamily: "var(--font-ui)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
            >
              先行登録する →
            </button>
          </form>
        )}

        {!done && (
          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.4)" }}>
            クレジットカード不要 · 早期登録者は初月無料
          </p>
        )}
      </div>

      <style>{`
        @keyframes bounceIn { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @media(max-width:480px){ .cta-form{flex-direction:column} }
      `}</style>
    </section>
  );
}
