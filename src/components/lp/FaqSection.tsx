"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "無料プランはどこまで使えますか？",
    a: "無料プランでは、AI予想問題生成が月3回・基本カレンダー・ランキング閲覧が利用できます。AI問題生成の無制限利用・スマートカレンダー（自動計画）・保護者ダッシュボードを利用するにはProまたはFamilyプランへのアップグレードが必要です。クレジットカードなしで今すぐ始められます。",
  },
  {
    q: "何年生から何年生まで対応していますか？",
    a: "小学5年生〜中学3年生を主な対象としています。AIが学年を自動で判別し、学年に合ったやさしい言葉で解説します。小学5・6年生にも対応しているのはStudyPalのみで、中高生向けの競合サービスとの大きな差別化ポイントです。",
  },
  {
    q: "保護者の管理機能について教えてください",
    a: "Familyプランでは、保護者専用ダッシュボードから「今週何時間勉強したか」「どの科目を学んだか」「ランキング順位の推移」などが確認できます。毎週月曜日に週次レポートがメールで届き、学習の継続をサポートします。",
  },
  {
    q: "どんな科目や教材に対応していますか？",
    a: "数学・英語・理科・社会・国語の5教科に対応しています。教科書・プリント・テスト問題の写真を撮影するだけでAIが内容を解析。どの出版社・教材でも対応可能です。PDFのアップロードにも対応しています。",
  },
  {
    q: "解約はいつでもできますか？",
    a: "はい、いつでも解約できます。解約後は次の更新日まで有料プランの機能が利用でき、期間終了後は自動的に無料プランに移行します。違約金や解約手数料は一切ありません。",
  },
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" style={{ padding: "96px 24px", background: "#0A1628" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-brand-blue)", marginBottom: "16px" }}>
          よくある質問
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem,3.5vw,2.75rem)", fontWeight: 900, lineHeight: 1.15, color: "#F2F2F2", letterSpacing: "-0.02em" }}>
          FAQ
        </h2>

        <div style={{ maxWidth: "760px", margin: "48px auto 0", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
          {FAQS.map(({ q, a }, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  background: "rgba(255,255,255,.04)",
                  border: `1px solid ${isOpen ? "rgba(28,176,246,.35)" : "rgba(255,255,255,.08)"}`,
                  borderRadius: "var(--radius-xl)",
                  overflow: "hidden",
                  transition: "border-color 200ms",
                }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "20px 24px",
                    cursor: "pointer",
                    userSelect: "none",
                    gap: "16px",
                    background: "none",
                    border: "none",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "#F2F2F2", lineHeight: 1.5 }}>{q}</span>
                  <span style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: isOpen ? "rgba(28,176,246,.2)" : "rgba(255,255,255,.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 200ms, transform 200ms",
                    transform: isOpen ? "rotate(45deg)" : "none",
                    fontSize: "1.125rem",
                    color: isOpen ? "var(--color-brand-blue)" : "rgba(255,255,255,.5)",
                    fontWeight: 300,
                  }}>+</span>
                </button>
                <div style={{ maxHeight: isOpen ? "300px" : 0, overflow: "hidden", transition: "max-height 350ms cubic-bezier(0,0,.2,1)" }}>
                  <div style={{ padding: "0 24px 20px", fontSize: "0.9375rem", color: "#A0A0A8", lineHeight: 1.75, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                    {a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
