import { Card } from "@/components/ui/Card";

const CHILD_PROBLEMS = [
  { emoji: "📚", title: "教科書を読んでも意味がわからない", desc: "学校の説明が難しすぎて、どこから手をつければいいかわからない。" },
  { emoji: "😴", title: "勉強が続かない、すぐ飽きる", desc: "ゲームやYouTubeに比べて、勉強は楽しくない。やる気が出ない。" },
];

const PARENT_PROBLEMS = [
  { emoji: "📅", title: "部活と勉強の両立ができているか不安", desc: "塾に行く時間もないのに、テストが近づいてどう準備すればいいか。" },
  { emoji: "📊", title: "子どもが何をどれだけ勉強したかわからない", desc: "「勉強してる」と言っても、本当に身についているか確認できない。" },
];

function ProblemCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <Card
      variant="hover"
      style={{
        background: "#fff",
        border: "1px solid #F0EBE3",
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-6)",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "12px" }}>{emoji}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "8px" }}>{title}</div>
      <div style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.65 }}>{desc}</div>
    </Card>
  );
}

export function ProblemSection() {
  return (
    <section
      id="problem"
      style={{ padding: "96px 24px", background: "#FFF9F5" }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-brand-blue)", marginBottom: "16px" }}>
          こんな悩み、ありませんか？
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 900, lineHeight: 1.15, color: "var(--color-text-primary)", marginBottom: "16px", letterSpacing: "-0.02em" }}>
          勉強が続かない理由、<br />全部解決します。
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "48px", textAlign: "left" }} className="problem-grid">
          {/* 子ども */}
          <div>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 700, padding: "4px 12px", borderRadius: "var(--radius-pill)", background: "rgba(28,176,246,.1)", color: "var(--color-brand-blue)", marginBottom: "20px" }}>👦 子ども視点</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {CHILD_PROBLEMS.map((p) => <ProblemCard key={p.title} {...p} />)}
            </div>
          </div>

          {/* 保護者 */}
          <div>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 700, padding: "4px 12px", borderRadius: "var(--radius-pill)", background: "rgba(155,93,229,.1)", color: "var(--color-brand-purple)", marginBottom: "20px" }}>👨‍👩‍👧 保護者視点</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {PARENT_PROBLEMS.map((p) => <ProblemCard key={p.title} {...p} />)}
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "48px", paddingTop: "32px", borderTop: "1px solid #F0EBE3" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
            StudyPal がぜんぶ解決します ↓
          </div>
          <div style={{ fontSize: "1rem", color: "var(--color-text-secondary)", marginTop: "8px" }}>
            AI予想問題 × スマートカレンダー × ランキングの三位一体
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){ .problem-grid{grid-template-columns:1fr!important} }
      `}</style>
    </section>
  );
}
