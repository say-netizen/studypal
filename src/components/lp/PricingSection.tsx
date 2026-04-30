"use client";

type Plan = {
  id: "free" | "pro" | "family";
  name: string;
  price: string;
  period: string;
  features: { text: string; on: boolean }[];
  ctaLabel: string;
  ctaVariant: "ghost" | "primary" | "success";
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "FREE",
    price: "¥0",
    period: "ずっと無料",
    features: [
      { text: "AI予想問題生成 月3回", on: true },
      { text: "基本カレンダー", on: true },
      { text: "ランキング閲覧", on: true },
      { text: "スマートカレンダー（自動計画）", on: false },
      { text: "保護者ダッシュボード", on: false },
    ],
    ctaLabel: "無料で始める",
    ctaVariant: "ghost",
  },
  {
    id: "pro",
    name: "PRO",
    price: "¥480",
    period: "年払い ¥4,320 (2ヶ月分お得)",
    features: [
      { text: "AI予想問題生成 無制限", on: true },
      { text: "スマートカレンダー（自動計画）", on: true },
      { text: "全国ランキング（週・月・科目別）", on: true },
      { text: "保護者ダッシュボード", on: false },
      { text: "週次学習レポート", on: false },
    ],
    ctaLabel: "Proを始める",
    ctaVariant: "primary",
    featured: true,
  },
  {
    id: "family",
    name: "FAMILY",
    price: "¥780",
    period: "子ども複数アカウント対応",
    features: [
      { text: "Pro全機能", on: true },
      { text: "保護者ダッシュボード", on: true },
      { text: "週次学習レポート", on: true },
      { text: "子ども複数アカウント", on: true },
    ],
    ctaLabel: "Familyを始める",
    ctaVariant: "success",
  },
];

const CTA_STYLES = {
  ghost: { background: "var(--color-bg-secondary)", color: "var(--color-text-primary)", border: "2px solid var(--color-border)" },
  primary: { background: "var(--color-brand-blue)", color: "#fff", boxShadow: "var(--shadow-brand-blue)" },
  success: { background: "var(--color-brand-purple)", color: "#fff", boxShadow: "var(--shadow-brand-purple)" },
};

export function PricingSection() {
  return (
    <section id="pricing" style={{ padding: "96px 24px", background: "var(--color-bg-secondary)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-brand-blue)", marginBottom: "16px" }}>
          料金プラン
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 900, lineHeight: 1.15, color: "var(--color-text-primary)", marginBottom: "8px", letterSpacing: "-0.02em" }}>
          まずは無料から始めよう
        </h2>
        <p style={{ fontSize: "1.0625rem", color: "var(--color-text-secondary)", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto" }}>
          いつでもアップグレード・解約できます
        </p>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "24px", marginTop: "48px", maxWidth: "960px", marginLeft: "auto", marginRight: "auto" }}
          className="pricing-grid-responsive"
        >
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: "var(--color-bg-primary)",
                border: plan.featured ? "2px solid var(--color-brand-blue)" : "2px solid var(--color-border)",
                borderRadius: "var(--radius-xl)",
                padding: "32px",
                position: "relative",
                transform: plan.featured ? "scale(1.04)" : "none",
                boxShadow: plan.featured ? "var(--shadow-brand-blue)" : "none",
                transition: "transform 200ms, box-shadow 200ms",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = plan.featured ? "scale(1.04) translateY(-4px)" : "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = plan.featured ? "scale(1.04)" : "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = plan.featured ? "var(--shadow-brand-blue)" : "none"; }}
            >
              {plan.featured && (
                <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,var(--color-brand-primary),#9B5DE5)", color: "#fff", fontSize: "0.8125rem", fontWeight: 700, padding: "4px 16px", borderRadius: "var(--radius-pill)", whiteSpace: "nowrap" }}>
                  🏆 一番人気
                </div>
              )}

              <div style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "12px" }}>{plan.name}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "2.75rem", fontWeight: 900, color: "var(--color-text-primary)", lineHeight: 1, marginBottom: "4px" }}>
                {plan.price}
                {plan.id !== "free" && <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-muted)" }}>/月</span>}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "24px" }}>{plan.period}</div>
              <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "24px" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {plan.features.map(({ text, on }) => (
                  <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "0.9375rem", color: on ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                    <span style={{ width: "20px", height: "20px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.625rem", fontWeight: 900, flexShrink: 0, marginTop: "1px", background: on ? "rgba(88,204,2,.15)" : "var(--color-bg-tertiary)", color: on ? "var(--color-brand-green)" : "var(--color-text-muted)" }}>
                      {on ? "✓" : "–"}
                    </span>
                    {text}
                  </div>
                ))}
              </div>

              <a
                href="#cta"
                style={{ width: "100%", textAlign: "center", display: "block", padding: "14px", borderRadius: "var(--radius-pill)", fontWeight: 700, fontSize: "1rem", transition: "transform 120ms, box-shadow 120ms", textDecoration: "none", ...CTA_STYLES[plan.ctaVariant] }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; }}
              >
                {plan.ctaLabel}
              </a>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media(max-width:1024px){ .pricing-grid-responsive{grid-template-columns:1fr!important;max-width:400px!important} .pricing-grid-responsive > div[style*="scale(1.04)"]{transform:scale(1)!important} }
      `}</style>
    </section>
  );
}
