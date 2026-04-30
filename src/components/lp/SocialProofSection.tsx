import { Card } from "@/components/ui/Card";

const REVIEWS = [
  {
    text: "「ランキング1位を目指してたら、気づいたら数学が好きになってた！毎日やりたいって思う初めての勉強アプリ」",
    name: "たろう",
    role: "小学6年生 / 数学・理科が苦手",
    initial: "た",
    bg: "linear-gradient(135deg,#FFD700,#FF9600)",
  },
  {
    text: "「子どもが自分からスマホを開いて勉強するようになりました。週次レポートで学習状況も確認できて安心です」",
    name: "みかこさん（保護者）",
    role: "中学1年生のお母さん",
    initial: "み",
    bg: "linear-gradient(135deg,#9B5DE5,var(--color-brand-primary))",
  },
  {
    text: "「部活が忙しくてもAIが隙間時間を見つけてくれる。テスト1週間前から自動で計画を立て直してくれて助かった！」",
    name: "はなこ",
    role: "中学2年生 / 運動部所属",
    initial: "は",
    bg: "linear-gradient(135deg,#58CC02,#00C9A7)",
  },
];

export function SocialProofSection() {
  return (
    <section id="social-proof" style={{ padding: "96px 24px", background: "#FFF0E8" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-brand-blue)", marginBottom: "16px" }}>
          利用者の声
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 900, lineHeight: 1.15, color: "var(--color-text-primary)", marginBottom: "8px", letterSpacing: "-0.02em" }}>
          ユーザーの声
        </h2>
        <p style={{ fontSize: "1.0625rem", color: "var(--color-text-secondary)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto" }}>
          全国の小中学生と保護者から届いた声
        </p>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px", marginTop: "48px", textAlign: "left" }}
          className="proof-grid-responsive"
        >
          {REVIEWS.map(({ text, name, role, initial, bg }) => (
            <Card key={name} variant="hover" style={{ background: "#fff", borderRadius: "var(--radius-xl)", padding: "24px", boxShadow: "var(--shadow-md)" }}>
              <div style={{ color: "var(--color-xp-gold)", fontSize: "1rem", letterSpacing: "2px", marginBottom: "16px" }}>★★★★★</div>
              <p style={{ fontSize: "0.9375rem", color: "var(--color-text-primary)", lineHeight: 1.7, marginBottom: "20px" }}>{text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.125rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>{initial}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>{name}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <style>{`
        @media(max-width:1024px){ .proof-grid-responsive{grid-template-columns:1fr!important} }
      `}</style>
    </section>
  );
}
