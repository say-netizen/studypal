"use client";

export function CtaSection() {
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
          無料プランですぐに始められます。クレジットカード不要。<br />
          Proプランは7日間無料でお試しいただけます。
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", marginBottom: "20px" }}>
          <a
            href="/register"
            style={{
              background: "var(--color-brand-green)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-pill)",
              padding: "16px 36px",
              fontSize: "1.0625rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(88,204,2,0.4)",
              textDecoration: "none",
              display: "inline-block",
              fontFamily: "var(--font-ui)",
              transition: "transform 120ms, box-shadow 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; }}
          >
            無料で始める →
          </a>
          <a
            href="/login"
            style={{
              background: "transparent",
              color: "rgba(255,255,255,.8)",
              border: "1.5px solid rgba(255,255,255,.25)",
              borderRadius: "var(--radius-pill)",
              padding: "16px 36px",
              fontSize: "1.0625rem",
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-block",
              fontFamily: "var(--font-ui)",
              transition: "border-color 150ms, background 150ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,.6)";
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,.25)";
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            }}
          >
            ログイン
          </a>
        </div>

        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.4)" }}>
          クレジットカード不要 · いつでも解約OK
        </p>
      </div>

      <style>{`
        @media(max-width:480px){ .cta-btns{flex-direction:column;align-items:stretch} }
      `}</style>
    </section>
  );
}
