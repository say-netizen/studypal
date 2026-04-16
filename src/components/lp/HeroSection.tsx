"use client";

import { ButtonLink } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section
      aria-label="ヒーローセクション"
      style={{
        minHeight: "100svh",
        paddingTop: "68px",
        background: "var(--color-bg-primary)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* グリッド背景 */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(28,176,246,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(28,176,246,.035) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />
      {/* オーブ */}
      {[
        { w: 600, h: 600, bg: "rgba(28,176,246,.12)", top: "-100px", right: "-80px", left: "auto", bottom: "auto" },
        { w: 400, h: 400, bg: "rgba(155,93,229,.10)", bottom: "0", left: "-80px", top: "auto", right: "auto" },
        { w: 280, h: 280, bg: "rgba(88,204,2,.08)", top: "40%", right: "32%", left: "auto", bottom: "auto" },
      ].map((orb, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            width: `${orb.w}px`,
            height: `${orb.h}px`,
            background: `radial-gradient(circle,${orb.bg},transparent 70%)`,
            borderRadius: "50%",
            filter: "blur(80px)",
            pointerEvents: "none",
            top: orb.top,
            right: orb.right,
            bottom: orb.bottom,
            left: orb.left,
          }}
        />
      ))}

      {/* メインコンテンツ */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(48px,8vw,80px) 24px clamp(32px,5vw,60px)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(32px,5vw,60px)",
          alignItems: "center",
          flex: 1,
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
        className="hero-grid"
      >
        {/* 左: コピー */}
        <div>
          {/* バッジ */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg,rgba(28,176,246,.12),rgba(155,93,229,.12))",
              border: "1px solid rgba(28,176,246,.25)",
              borderRadius: "var(--radius-pill)",
              padding: "8px 16px",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--color-brand-blue)",
              marginBottom: "24px",
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                background: "var(--color-brand-green)",
                borderRadius: "50%",
                flexShrink: 0,
                animation: "pulseGlow 2s infinite",
              }}
              aria-hidden="true"
            />
            小学5年生〜中学3年生向け AI 学習アプリ
          </div>

          {/* 見出し */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.25rem,5vw,3.75rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              color: "var(--color-text-primary)",
              marginBottom: "24px",
              letterSpacing: "-0.02em",
            }}
          >
            定期テスト対策は、
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#1CB0F6 0%,#9B5DE5 50%,#58CC02 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
                animation: "shimmer 4s linear infinite",
              }}
            >
              これ一本。
            </span>
          </h1>

          {/* サブコピー */}
          <p
            style={{
              fontSize: "1.125rem",
              color: "var(--color-text-secondary)",
              lineHeight: 1.75,
              marginBottom: "40px",
              maxWidth: "480px",
            }}
          >
            テスト2週間前からAIが予想問題を生成。
            <br />
            カレンダーが計画して、ランキングで燃える。
            <br />
            小学5年生から中学3年生まで。
          </p>

          {/* CTAボタン */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
            <ButtonLink href="#cta" variant="success" size="lg">
              先行登録する →
            </ButtonLink>
            <ButtonLink href="#features" variant="ghost" size="lg">
              機能を見る
            </ButtonLink>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "40px" }}>
            クレジットカード不要 · 1分で登録完了
          </p>

          {/* リリース情報バッジ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { emoji: "🚀", text: "2026年夏リリース予定", bg: "rgba(88,204,2,.1)", border: "rgba(88,204,2,.25)", color: "var(--color-brand-green)" },
              { emoji: "📧", text: "先行登録受付中", bg: "rgba(28,176,246,.1)", border: "rgba(28,176,246,.25)", color: "var(--color-brand-blue)" },
              { emoji: "🎁", text: "早期登録者は初月無料", bg: "rgba(255,217,0,.12)", border: "rgba(255,217,0,.35)", color: "#B8960A" },
            ].map(({ emoji, text, bg, border, color }) => (
              <div
                key={text}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: "var(--radius-pill)",
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color,
                  alignSelf: "flex-start",
                }}
              >
                {emoji} {text}
              </div>
            ))}
          </div>
        </div>

        {/* 右: モックアップ */}
        <div
          style={{ position: "relative", height: "520px" }}
          role="img"
          aria-label="アプリUI画面プレビュー"
          className="hero-visuals-container"
        >
          {/* AI チャット */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              zIndex: 3,
            }}
          >
            <div
              style={{
                width: "320px",
                background: "var(--color-bg-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "var(--shadow-xl)",
                overflow: "hidden",
                animation: "float 5s ease-in-out infinite",
              }}
            >
              <MockHeader title="✨ AI予想問題生成中" />
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px", height: "240px", overflow: "hidden" }}>
                <div style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(28,176,246,0.3)", borderRadius: "var(--radius-md)", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>📷</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>数学「二次方程式」を撮影</div>
                </div>
                <ChatBubble type="ai" text={<>10問の予想問題を生成しました！<br /><strong>四択 3問 · 穴埋め 4問 · 記述 3問</strong></>} />
                <div style={{ background: "rgba(88,204,2,.12)", border: "1px solid rgba(88,204,2,.3)", borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", color: "var(--color-brand-green)" }}>
                  Q1. x²−5x+6=0 の解は？（四択）
                </div>
                <div style={{ background: "rgba(28,176,246,.1)", border: "1px solid rgba(28,176,246,.2)", borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", color: "var(--color-brand-blue)" }}>
                  Q2. (x−3)(x+?)=0 を完成せよ（穴埋め）
                </div>
              </div>
            </div>
          </div>

          {/* ランキング (右上) */}
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: 0,
              width: "218px",
              background: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-xl)",
              overflow: "hidden",
              zIndex: 4,
              animation: "slideInRight 0.6s cubic-bezier(0.175,0.885,0.32,1.275) 0.5s both",
            }}
            className="hidden-xs"
          >
            <MockHeader title="🏆 全国ランキング" />
            <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { medal: "🥇", name: "たろう", xp: "3,840 XP", bg: "linear-gradient(135deg,#FFD700,#FF9600)", highlight: "rgba(255,217,0,.1)" },
                { medal: "🥈", name: "はなこ", xp: "3,210 XP", bg: "linear-gradient(135deg,#1CB0F6,#9B5DE5)", highlight: "" },
                { medal: "🥉", name: "じろう", xp: "2,980 XP", bg: "linear-gradient(135deg,#58CC02,#00C9A7)", highlight: "" },
                { medal: "12", name: "あなた", xp: "1,240 XP", bg: "linear-gradient(135deg,#FF6BB3,#FF9600)", highlight: "rgba(28,176,246,.1)", isMe: true },
              ].map(({ medal, name, xp, bg, highlight, isMe }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "var(--radius-md)", background: highlight, border: isMe ? "1px solid rgba(28,176,246,.25)" : undefined, fontSize: "0.75rem" }}>
                  <span style={{ fontSize: isMe ? "11px" : "14px", fontWeight: isMe ? 700 : undefined, color: isMe ? "var(--color-text-muted)" : undefined, width: "18px", textAlign: "center" }}>{medal}</span>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: isMe ? "var(--color-brand-blue)" : "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "0.6875rem" }}>{xp}</div>
                  </div>
                  {isMe && <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-brand-blue)", background: "rgba(28,176,246,.15)", padding: "1px 6px", borderRadius: "var(--radius-pill)" }}>YOU</span>}
                </div>
              ))}
            </div>
          </div>

          {/* カレンダー (左下) */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: 0,
              width: "220px",
              background: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-xl)",
              overflow: "hidden",
              zIndex: 4,
              animation: "slideInLeft 0.6s cubic-bezier(0.175,0.885,0.32,1.275) 0.7s both",
            }}
            className="hidden-xs"
          >
            <MockHeader title="📅 4月の学習計画" />
            <div style={{ padding: "10px 14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px", marginBottom: "10px" }}>
                {["月","火","水","木","金","土","日"].map((d) => (
                  <div key={d} style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--color-text-muted)", textAlign: "center", padding: "2px 0" }}>{d}</div>
                ))}
                {["7","8","9","10","11","12","13","14","15","16","17","18","19","20"].map((n) => (
                  <div key={n} style={{ aspectRatio: "1", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", fontWeight: 600, background: n === "15" ? "var(--color-brand-blue)" : "transparent", color: n === "15" ? "#fff" : "var(--color-text-secondary)", position: "relative" }}>
                    {n}
                    {["8","9","10","14","16"].includes(n) && (
                      <span style={{ position: "absolute", bottom: "1px", width: "4px", height: "4px", borderRadius: "50%", background: n === "16" ? "var(--color-error)" : n === "8" ? "var(--color-brand-purple)" : "var(--color-brand-green)" }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(28,176,246,.12)", border: "1px solid rgba(28,176,246,.2)", borderRadius: "8px", padding: "8px", fontSize: "0.65rem", color: "rgba(200,220,240,0.9)" }}>
                <div style={{ fontWeight: 700, color: "var(--color-brand-blue)", marginBottom: "4px" }}>✨ AIが学習プランを生成</div>
                <div>月: 数学 20分</div>
                <div>水: 理科 15分</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ローンチ情報バー */}
      <div style={{ background: "var(--color-bg-secondary)", borderTop: "1px solid var(--color-border)", padding: "20px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "48px", flexWrap: "wrap" }}>
          {[
            { icon: "🚀", value: "2026年夏", desc: "リリース予定" },
            { icon: "📧", value: "先行登録", desc: "受付中" },
            { icon: "🎁", value: "初月無料", desc: "早期登録者限定" },
            { icon: "🎓", value: "小5〜中3", desc: "対応学年" },
          ].map(({ icon, value, desc }) => (
            <div key={desc} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>{icon}</span>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(88,204,2,.4)} 50%{box-shadow:0 0 0 8px rgba(88,204,2,0)} }
        @keyframes float { 0%,100%{transform:translate(-50%,-50%)} 50%{transform:translate(-50%,calc(-50% - 8px))} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInLeft { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
        @media(max-width:1024px){ .hero-grid{grid-template-columns:1fr!important;text-align:center} .hero-visuals-container{max-width:480px;margin:0 auto;height:380px!important} }
        @media(max-width:480px){ .hidden-xs{display:none!important} .hero-visuals-container{height:280px!important} }
      `}</style>
    </section>
  );
}

function MockHeader({ title }: { title: string }) {
  return (
    <div style={{ padding: "10px 16px", background: "var(--color-bg-secondary)", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ display: "flex", gap: "5px" }}>
        {["#FF5F57","#FEBC2E","#28C840"].map((c) => <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
      </div>
      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", flex: 1, textAlign: "center" }}>{title}</div>
    </div>
  );
}

function ChatBubble({ type, text }: { type: "user" | "ai"; text: React.ReactNode }) {
  const isUser = type === "user";
  return (
    <div style={{ maxWidth: "82%", padding: "10px 14px", borderRadius: "var(--radius-lg)", fontSize: "0.8125rem", lineHeight: 1.5, alignSelf: isUser ? "flex-end" : "flex-start", background: isUser ? "var(--color-brand-blue)" : "var(--color-bg-secondary)", color: isUser ? "#fff" : "var(--color-text-primary)" }}>
      {!isUser && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <div style={{ width: "20px", height: "20px", background: "linear-gradient(135deg,#1CB0F6,#9B5DE5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#fff", fontWeight: 700 }}>AI</div>
          <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-brand-blue)" }}>StudyPal AI</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "linear-gradient(135deg,#9B5DE5,#1CB0F6)", color: "#fff", fontSize: "0.625rem", fontWeight: 700, padding: "1px 6px", borderRadius: "var(--radius-pill)" }}>✨ AI</span>
        </div>
      )}
      {text}
    </div>
  );
}
