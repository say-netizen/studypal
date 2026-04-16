const FEATURES = [
  {
    num: "01",
    tag: "🤖 AI予想問題生成",
    title: "テストの範囲を撮影するだけ。\nAIが予想問題を自動生成。",
    desc: "テストの範囲・教科書・プリントを撮影するだけ。AIがテストに出そうな予想問題を自動生成。繰り返し解いて確実に点数を上げる。",
    points: ["四択・穴埋め・記述の3形式に対応", "写真・PDF・テキスト入力に対応", "解説付きで弱点を確実に克服"],
    screen: <AiScreen />,
    rev: false,
  },
  {
    num: "02",
    tag: "📅 スマートカレンダー",
    title: "テスト日・部活を登録するだけ。\nAIが2週間前から逆算。",
    desc: "テスト日・部活・イベントを登録するだけ。AIが2週間前から逆算して、最適な学習スケジュールを自動提案します。",
    points: ["部活・イベントを除いた空き時間を自動検出", "テストまでの日数から学習量を逆算", "科目バランスを考慮した最適プラン生成"],
    screen: <CalendarScreen />,
    rev: true,
  },
  {
    num: "03",
    tag: "🏆 ランキング",
    title: "勉強した分だけ\nランキングが上がる",
    desc: "勉強した時間・解いた問題数でスコア計算。週間・月間・科目別の全国ランキング。ライバルと競いながら自然と勉強が続く。",
    points: ["問題正解 10pt / 問", "勉強時間 1pt / 分・ストリーク 20pt / 日", "週間・月間・科目別の全国ランキング"],
    screen: <RankingScreen />,
    rev: false,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" style={{ padding: "96px 24px", background: "#0A1628", color: "#F2F2F2" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-brand-blue)", marginBottom: "16px" }}>
            StudyPalでできること
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 900, lineHeight: 1.15, color: "#F2F2F2", letterSpacing: "-0.02em" }}>
            テスト範囲を撮るだけ。<br />AIが全部やってくれる。
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "80px" }}>
          {FEATURES.map(({ num, tag, title, desc, points, screen, rev }) => (
            <div
              key={num}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "48px",
                alignItems: "center",
                direction: rev ? "rtl" : "ltr",
              }}
              className="feature-row-responsive"
            >
              <div style={{ direction: "ltr" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 900, lineHeight: 1, color: "rgba(28,176,246,.15)", marginBottom: "12px", letterSpacing: "-0.03em" }}>{num}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 700, padding: "4px 12px", borderRadius: "var(--radius-pill)", marginBottom: "16px", background: "rgba(28,176,246,.15)", color: "var(--color-brand-blue)" }}>{tag}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 900, color: "#F2F2F2", marginBottom: "20px", lineHeight: 1.25, letterSpacing: "-0.02em", whiteSpace: "pre-line" }}>{title}</h3>
                <p style={{ fontSize: "1rem", color: "#A0A0A8", lineHeight: 1.75, marginBottom: "24px" }}>{desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {points.map((p) => (
                    <div key={p} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.9375rem", color: "#D0D8E4", fontWeight: 500 }}>
                      <span style={{ width: "20px", height: "20px", background: "rgba(88,204,2,.2)", color: "var(--color-brand-green)", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 900, flexShrink: 0 }}>✓</span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ direction: "ltr" }}>
                <div style={{ background: "#162337", border: "1px solid rgba(255,255,255,.1)", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}>
                  <div style={{ background: "#0D1825", borderBottom: "1px solid rgba(255,255,255,.08)", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "5px" }}>
                      {["rgba(255,95,87,.7)","rgba(254,188,46,.7)","rgba(40,200,64,.7)"].map((c) => <span key={c} style={{ display: "block", width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
                    </div>
                  </div>
                  <div style={{ padding: "20px" }}>
                    {screen}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media(max-width:1024px){ .feature-row-responsive{grid-template-columns:1fr!important;direction:ltr!important} }
      `}</style>
    </section>
  );
}

function AiScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ background: "rgba(255,255,255,.06)", border: "1px dashed rgba(255,255,255,.15)", borderRadius: "var(--radius-md)", padding: "16px", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "4px" }}>📷</div>
        <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.4)" }}>数学プリントを撮影しました</div>
      </div>
      <div style={{ background: "rgba(255,255,255,.07)", borderRadius: "var(--radius-lg)", borderBottomLeftRadius: "4px", padding: "10px 14px", fontSize: "0.8125rem", lineHeight: 1.5, color: "#D0D8E4" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <div style={{ width: "20px", height: "20px", background: "linear-gradient(135deg,#1CB0F6,#9B5DE5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#fff", fontWeight: 700 }}>AI</div>
          <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-brand-blue)" }}>StudyPal AI</span>
          <span style={{ background: "linear-gradient(135deg,#9B5DE5,#1CB0F6)", color: "#fff", fontSize: "0.625rem", fontWeight: 700, padding: "1px 6px", borderRadius: "9999px" }}>✨ 生成完了</span>
        </div>
        <strong>10問の予想問題を生成しました！</strong><br />四択 3問 · 穴埋め 4問 · 記述 3問
      </div>
      {[
        { bg: "rgba(88,204,2,.15)", border: "rgba(88,204,2,.3)", color: "#89E219", text: "Q1. x²−5x+6=0 の解は？（四択）" },
        { bg: "rgba(28,176,246,.1)", border: "rgba(28,176,246,.2)", color: "var(--color-brand-blue)", text: "Q2. (x−3)(x+?)=0 を完成せよ（穴埋め）" },
        { bg: "rgba(255,255,255,.06)", border: "rgba(255,255,255,.1)", color: "#A0A0A8", text: "Q3. 解の公式を使って…（記述）" },
      ].map(({ bg, border, color, text }) => (
        <div key={text} style={{ background: bg, border: `1px solid ${border}`, borderRadius: "8px", padding: "8px 12px", fontSize: "0.8rem", color }}>{text}</div>
      ))}
    </div>
  );
}

function CalendarScreen() {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.4)", marginBottom: "10px" }}>4月15日(月) — 4月21日(日)</div>
      <div style={{ background: "rgba(28,176,246,.12)", border: "1px solid rgba(28,176,246,.25)", borderRadius: "var(--radius-lg)", padding: "16px" }}>
        <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-brand-blue)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "4px" }}>✨ AIが空き時間を検出しました</div>
        {[
          { day: "月", subject: "数学：二次方程式", time: "20分" },
          { day: "水", subject: "理科：化学反応式", time: "15分" },
          { day: "木", subject: "英語：不規則動詞", time: "25分" },
          { day: "金", subject: "数学：テスト対策", time: "30分" },
        ].map(({ day, subject, time }) => (
          <div key={day} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.06)", fontSize: "0.8rem", color: "#D0D8E4" }}>
            <span style={{ fontWeight: 700, color: "#A0C4E0", width: "24px" }}>{day}</span>
            <span style={{ flex: 1, marginLeft: "8px" }}>{subject}</span>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.4)" }}>{time}</span>
          </div>
        ))}
        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.4)" }}>週合計</span>
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-brand-green)" }}>1時間30分</span>
        </div>
      </div>
    </div>
  );
}

function RankingScreen() {
  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {["週間", "月間", "科目別"].map((tab, i) => (
          <div key={tab} style={{ flex: 1, background: i === 0 ? "rgba(28,176,246,.15)" : "rgba(255,255,255,.06)", border: `1px solid ${i === 0 ? "rgba(28,176,246,.25)" : "rgba(255,255,255,.1)"}`, borderRadius: "20px", padding: "4px 10px", fontSize: "0.7rem", fontWeight: 700, color: i === 0 ? "var(--color-brand-blue)" : "rgba(255,255,255,.3)", textAlign: "center" }}>{tab}</div>
        ))}
      </div>
      {[
        { medal: "🥇", name: "たろう", xp: "3,840pt" },
        { medal: "🥈", name: "はなこ", xp: "3,210pt" },
        { medal: "🥉", name: "じろう", xp: "2,980pt" },
      ].map(({ medal, name, xp }) => (
        <div key={name} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 0", fontSize: "0.75rem", color: "#D0D8E4" }}>
          <span style={{ width: "16px", fontWeight: 700 }}>{medal}</span>
          <span style={{ flex: 1, fontWeight: 600 }}>{name}</span>
          <span style={{ color: "var(--color-xp-gold)", fontWeight: 700 }}>{xp}</span>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 4px", fontSize: "0.75rem", background: "rgba(28,176,246,.08)", borderRadius: "6px" }}>
        <span style={{ width: "16px", fontWeight: 700, color: "var(--color-brand-blue)" }}>12</span>
        <span style={{ flex: 1, fontWeight: 600, color: "var(--color-brand-blue)" }}>あなた</span>
        <span style={{ color: "var(--color-xp-gold)", fontWeight: 700 }}>1,240pt</span>
      </div>
      <div style={{ marginTop: "12px", background: "rgba(255,150,0,.1)", border: "1px solid rgba(255,150,0,.25)", borderRadius: "10px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "1.1rem" }}>🔥</span>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-streak)" }}>7日連続ストリーク！ +140pt</span>
      </div>
    </div>
  );
}
