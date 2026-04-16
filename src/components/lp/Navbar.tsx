"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "68px",
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    borderBottom: "1px solid var(--color-border)",
    zIndex: 1000,
    boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.08)" : "none",
    transition: "box-shadow 200ms",
  };

  return (
    <>
      <nav style={navStyle} role="navigation" aria-label="メインナビゲーション">
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 24px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "32px",
          }}
        >
          {/* ロゴ */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "1.375rem",
              color: "var(--color-text-primary)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                background: "linear-gradient(135deg,#1CB0F6,#9B5DE5)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              📚
            </div>
            StudyPal
          </Link>

          {/* デスクトップリンク */}
          <ul
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
            className="hidden md:flex"
          >
            {[
              { href: "#features", label: "機能" },
              { href: "#pricing", label: "料金" },
              { href: "#faq", label: "FAQ" },
            ].map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    textDecoration: "none",
                    transition: "color 150ms, background 150ms",
                    display: "block",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-primary)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-bg-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-secondary)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "";
                  }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* CTAボタン群 */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/login"
              className="hidden md:block"
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                padding: "8px 12px",
                borderRadius: "var(--radius-pill)",
                textDecoration: "none",
                transition: "color 150ms",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--color-brand-blue)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-secondary)")}
            >
              ログイン
            </Link>
            <ButtonLink href="#cta" variant="primary" size="sm" className="hidden md:inline-flex">
              先行登録する
            </ButtonLink>

            {/* ハンバーガー */}
            <button
              className="md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={menuOpen}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                padding: "8px",
                borderRadius: "var(--radius-md)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display: "block",
                    width: "24px",
                    height: "2px",
                    background: "var(--color-text-primary)",
                    borderRadius: "2px",
                    transition: "transform 200ms, opacity 200ms",
                    transform:
                      menuOpen && i === 0
                        ? "translateY(7px) rotate(45deg)"
                        : menuOpen && i === 2
                        ? "translateY(-7px) rotate(-45deg)"
                        : "none",
                    opacity: menuOpen && i === 1 ? 0 : 1,
                  }}
                />
              ))}
            </button>
          </div>
        </div>
      </nav>

      {/* モバイルメニュー */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: "68px",
            left: 0,
            right: 0,
            background: "var(--color-bg-primary)",
            borderBottom: "1px solid var(--color-border)",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            zIndex: 999,
          }}
        >
          {["#features", "#pricing", "#faq"].map((href, i) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
              }}
            >
              {["機能", "料金", "FAQ"][i]}
            </a>
          ))}
          <ButtonLink
            href="#cta"
            variant="success"
            size="md"
            style={{ justifyContent: "center", marginTop: "8px" }}
            onClick={() => setMenuOpen(false)}
          >
            先行登録する →
          </ButtonLink>
        </div>
      )}
    </>
  );
}
