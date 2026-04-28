"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUser, type UserDoc } from "@/lib/firebase/schema";
import { Check, Sparkles, Users, Loader2, Crown, ChevronRight, UserCircle, LogOut, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "¥0",
    period: "/月",
    icon: "📚",
    color: "#6B7280",
    features: [
      "AI予想問題生成: 月3回まで",
      "カレンダー基本機能: 無制限",
      "ランキング閲覧: 無制限",
    ],
    cta: "現在のプラン",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "¥480",
    period: "/月",
    icon: "⭐",
    color: "#1CB0F6",
    popular: true,
    features: [
      "AI予想問題生成: 無制限",
      "AI解説チャット: 無制限",
      "写真撮影→質問機能",
      "全国ランキング詳細・科目別",
    ],
    cta: "Proにアップグレード",
  },
  {
    id: "family",
    name: "Family",
    price: "¥780",
    period: "/月",
    icon: "👨‍👩‍👧",
    color: "#9B5DE5",
    features: [
      "Pro全機能",
      "子ども複数アカウント2人まで",
      "週次学習レポート",
    ],
    cta: "Familyにアップグレード",
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

export default function BillingPage() {
  const { currentUser, logout } = useAuth();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";
  const router = useRouter();

  const [userData, setUserData] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    getUser(currentUser.uid)
      .then((u) => setUserData(u))
      .finally(() => setLoading(false));
  }, [currentUser]);

  async function handleUpgrade(plan: PlanId) {
    if (!currentUser || plan === "free") return;
    setCheckoutLoading(plan);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`エラー: ${data.error ?? "不明なエラー"}`);
      }
    } catch (e) {
      alert(`チェックアウトの開始に失敗しました: ${e}`);
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleDeleteAccount() {
    if (!currentUser) return;
    setDeleteLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`退会に失敗しました: ${data.error ?? "不明なエラー"}`);
        return;
      }
      await logout();
      router.replace("/");
    } catch (e) {
      alert(`退会処理中にエラーが発生しました: ${e}`);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const currentPlan = (userData?.plan ?? "free") as PlanId;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          プランと課金
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          現在のプラン: {PLANS.find((p) => p.id === currentPlan)?.name ?? "Free"}
        </p>
      </div>

      {/* アップグレード成功通知 */}
      {upgraded && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: "rgba(88,204,2,0.1)", border: "1px solid rgba(88,204,2,0.3)" }}
        >
          <Crown size={20} style={{ color: "var(--color-brand-green)" }} />
          <p className="font-semibold text-sm" style={{ color: "var(--color-brand-green)" }}>
            アップグレード完了！新機能をお楽しみください 🎉
          </p>
        </div>
      )}

      {/* プランカード */}
      <div className="space-y-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isLoading = checkoutLoading === plan.id;
          return (
            <div
              key={plan.id}
              className="rounded-2xl p-5 relative transition-all"
              style={{
                background: "var(--color-bg-primary)",
                border: `2px solid ${isCurrent ? plan.color : "var(--color-bg-tertiary)"}`,
                boxShadow: isCurrent ? `0 4px 20px ${plan.color}25` : "var(--shadow-card)",
              }}
            >
              {/* 人気バッジ */}
              {"popular" in plan && plan.popular && !isCurrent && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-black px-4 py-1 rounded-pill text-white"
                  style={{ background: "var(--color-brand-blue)" }}
                >
                  人気No.1
                </span>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{plan.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className="font-display font-black text-lg"
                        style={{ color: plan.color }}
                      >
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: plan.color + "15",
                            color: plan.color,
                          }}
                        >
                          現在のプラン
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
                      {plan.price}
                      <span className="text-sm font-normal" style={{ color: "var(--color-text-muted)" }}>
                        {plan.period}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 機能リスト */}
              <ul className="space-y-2 mb-5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check
                      size={15}
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: plan.color }}
                    />
                    <span style={{ color: "var(--color-text-secondary)" }}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {!isCurrent && plan.id !== "free" && (
                <button
                  onClick={() => handleUpgrade(plan.id as PlanId)}
                  disabled={!!checkoutLoading}
                  className="w-full py-3 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all duration-120 disabled:opacity-60 hover:-translate-y-0.5"
                  style={{
                    background: plan.color,
                    boxShadow: `0 4px 12px ${plan.color}40`,
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : plan.id === "pro" ? (
                    <Sparkles size={16} />
                  ) : (
                    <Users size={16} />
                  )}
                  {isLoading ? "処理中..." : plan.cta}
                </button>
              )}
              {isCurrent && currentPlan !== "free" && (
                <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                  解約はStripeポータルから行えます
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 注意書き */}
      <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
        料金はすべて税込。いつでも解約可能。支払いはStripeで安全に処理されます。
      </p>

      {/* その他の設定 */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
        {[
          { href: currentUser ? `/profile/${currentUser.uid}` : "#", icon: UserCircle, label: "マイプロフィール", desc: "ランキングや他のユーザーに表示される画面" },
          { href: "/settings/profile", icon: UserCircle, label: "プロフィール設定", desc: "アイコン・学年・ロールを変更" },
          { href: "/settings/family", icon: Users, label: "家族連携", desc: "保護者と子どもを紐付け" },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0 transition-all hover:opacity-80"
            style={{ borderColor: "var(--color-bg-tertiary)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-bg-secondary)" }}>
              <Icon size={18} style={{ color: "var(--color-text-secondary)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{label}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
          </Link>
        ))}
      </div>

      {/* ログアウト */}
      <button
        onClick={async () => { await logout(); router.push("/login"); }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all hover:opacity-80"
        style={{ background: "rgba(255,75,75,0.07)", color: "var(--color-error)", border: "1px solid rgba(255,75,75,0.15)" }}
      >
        <LogOut size={16} />
        ログアウト
      </button>

      {/* 退会 */}
      <div id="delete" className="text-center">
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-1.5 text-xs py-2 transition-all hover:opacity-60"
          style={{ color: "var(--color-text-muted)" }}
        >
          <AlertTriangle size={12} />
          退会する
        </button>
      </div>

      {/* 退会確認モーダル */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowDeleteModal(false); setDeleteConfirmText(""); } }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-6 space-y-4"
            style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,75,75,0.1)" }}>
                <AlertTriangle size={20} style={{ color: "var(--color-error)" }} />
              </div>
              <div>
                <h2 className="font-display font-black text-base" style={{ color: "var(--color-text-primary)" }}>
                  退会の確認
                </h2>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  この操作は取り消せません
                </p>
              </div>
            </div>

            <div className="rounded-2xl p-4 space-y-1.5 text-sm" style={{ background: "rgba(255,75,75,0.05)", border: "1px solid rgba(255,75,75,0.15)" }}>
              <p style={{ color: "var(--color-error)" }} className="font-semibold text-xs">退会すると以下が完全に削除されます</p>
              {["テスト・問題データ", "学習セッション・スケジュール・目標", "ランキング記録", "フォロー関係", "アカウント情報"].map((item) => (
                <p key={item} className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  <span style={{ color: "var(--color-error)" }}>✕</span> {item}
                </p>
              ))}
            </div>

            <div>
              <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
                確認のため <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>「退会する」</span> と入力してください
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="退会する"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  background: "var(--color-bg-secondary)",
                  border: "2px solid var(--color-bg-tertiary)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="flex-1 py-3 rounded-pill text-sm font-bold transition-all hover:opacity-80"
                style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)" }}
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "退会する" || deleteLoading}
                className="flex-1 py-3 rounded-pill text-sm font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: "var(--color-error)" }}
              >
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {deleteLoading ? "処理中..." : "退会する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
