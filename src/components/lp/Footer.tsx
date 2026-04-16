const LINK_GROUPS = [
  {
    title: "プロダクト",
    links: [
      { href: "#features", label: "機能" },
      { href: "#pricing", label: "料金" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    title: "サポート",
    links: [
      { href: "#", label: "ヘルプセンター" },
      { href: "#", label: "お問い合わせ" },
      { href: "#", label: "保護者向け情報" },
    ],
  },
  {
    title: "法的情報",
    links: [
      { href: "#", label: "利用規約" },
      { href: "#", label: "プライバシーポリシー" },
      { href: "#", label: "特定商取引法" },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: "#0A0A0B", padding: "64px 24px 40px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* 上段 */}
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "48px", marginBottom: "48px", flexWrap: "wrap" }}
          className="footer-top-responsive"
        >
          {/* ブランド */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.25rem", color: "#fff", marginBottom: "12px" }}>
              <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg,#1CB0F6,#9B5DE5)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>📚</div>
              StudyPal
            </div>
            <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,.4)", maxWidth: "200px", lineHeight: 1.6 }}>
              定期テスト対策は、これ一本。<br />小学5年生から中学3年生まで。
            </div>
          </div>

          {/* リンク群 */}
          <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
            {LINK_GROUPS.map(({ title, links }) => (
              <div key={title}>
                <div style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,.3)", marginBottom: "16px" }}>{title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {links.map(({ href, label }) => (
                    <a
                      key={label}
                      href={href}
                      style={{ fontSize: "0.9rem", color: "rgba(255,255,255,.5)", textDecoration: "none", transition: "color 150ms" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#fff")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,.5)")}
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 下段 */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", paddingTop: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.25)" }}>© 2026 StudyPal. All rights reserved.</div>
          <div style={{ display: "flex", gap: "12px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "4px 12px", borderRadius: "var(--radius-pill)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.4)", border: "1px solid rgba(255,255,255,.08)" }}>🚀 2026年夏リリース予定</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "4px 12px", borderRadius: "var(--radius-pill)", background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.4)", border: "1px solid rgba(255,255,255,.08)" }}>子ども安心アプリ</span>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){ .footer-top-responsive{flex-direction:column;gap:32px} }
      `}</style>
    </footer>
  );
}
