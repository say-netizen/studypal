"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUser, upsertUser } from "@/lib/firebase/schema";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ParentSettingsPage() {
  const { currentUser } = useAuth();
  const [parentEmail, setParentEmail] = useState("");
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    if (!currentUser) return;
    getUser(currentUser.uid).then((data) => {
      if (data) {
        setParentEmail((data as { parentEmail?: string }).parentEmail ?? "");
        setWeeklyReport((data as { weeklyReport?: boolean }).weeklyReport !== false);
        setUserPlan((data as { plan?: string }).plan ?? "free");
      }
      setLoading(false);
    });
  }, [currentUser]);

  async function handleSave() {
    if (!currentUser) return;
    setSaving(true);
    try {
      await upsertUser(currentUser.uid, { parentEmail: parentEmail.trim() || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleWeeklyReport(next: boolean) {
    if (!currentUser) return;
    setWeeklyReport(next);
    await upsertUser(currentUser.uid, { weeklyReport: next });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--color-brand-blue)" }} />
      </div>
    );
  }

  if (userPlan !== "family") {
    return (
      <div className="max-w-sm mx-auto px-4 py-10 flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">👨‍👩‍👧</div>
        <h2 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          Familyプラン限定
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          保護者連携機能はFamilyプランで利用できます
        </p>
        <Link
          href="/settings/billing"
          className="mt-2 px-6 py-3 rounded-pill font-bold text-white"
          style={{ background: "var(--color-brand-purple)", boxShadow: "0 4px 12px rgba(155,93,229,0.4)" }}
        >
          Familyプランを見る
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <h1 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          保護者設定
        </h1>
      </div>

      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
      >
        <div>
          <label className="text-sm font-semibold mb-1.5 flex items-center gap-2" style={{ color: "var(--color-text-secondary)" }}>
            <Mail size={15} />
            保護者のメールアドレス
          </label>
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            placeholder="parent@example.com"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "var(--color-bg-secondary)",
              border: "2px solid var(--color-bg-tertiary)",
              color: "var(--color-text-primary)",
            }}
          />
          <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
            週次レポートや緊急アラートの送信先
          </p>
        </div>

        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              週次メールレポート
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              毎週日曜日に自主性レポートを送信
            </p>
          </div>
          <button
            onClick={() => handleToggleWeeklyReport(!weeklyReport)}
            className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
            style={{ background: weeklyReport ? "var(--color-brand-green)" : "var(--color-bg-tertiary)" }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: weeklyReport ? "translateX(24px)" : "translateX(0)" }}
            />
          </button>
        </div>

        <div
          className="rounded-xl p-4 text-sm"
          style={{ background: "rgba(28,176,246,0.06)", border: "1px solid rgba(28,176,246,0.2)" }}
        >
          <p className="font-semibold mb-1" style={{ color: "var(--color-brand-blue)" }}>
            📧 レポートに含まれる情報
          </p>
          <ul className="space-y-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <li>• 自主性スコア（予定通りに勉強した率）</li>
            <li>• 自発的な勉強回数・ストリーク</li>
            <li>• テストまでの準備状況</li>
            <li>• 設定した目標一覧</li>
          </ul>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(88,204,2,0.1)" }}>
          <CheckCircle2 size={18} style={{ color: "var(--color-brand-green)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--color-brand-green)" }}>保存しました！</p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: "var(--color-brand-blue)", boxShadow: "0 4px 12px rgba(28,176,246,0.4)" }}
      >
        {saving ? (
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
        ) : (
          <CheckCircle2 size={16} />
        )}
        {saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
