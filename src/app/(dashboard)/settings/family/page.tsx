"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUser } from "@/lib/firebase/schema";
import { ArrowLeft, Copy, Check, Users, Unlink, Loader2 } from "lucide-react";
import Link from "next/link";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

interface LinkedChild {
  uid: string;
  name: string;
  grade: string | null;
}

export default function FamilySettingsPage() {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string>("free");
  const [role, setRole] = useState<"student" | "parent">("student");
  const [parentUid, setParentUid] = useState<string | null>(null);

  // 子ども側: 生成した招待コード
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [codeExpiry, setCodeExpiry] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // 保護者側: コード入力
  const [inputCode, setInputCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      try {
        const user = await getUser(currentUser!.uid);
        if (!user) return;
        setPlan(user.plan ?? "free");
        setRole(user.role ?? "student");
        setParentUid(user.parentUid ?? null);

        // 保護者側: 子どもの情報を取得
        if ((user.childUids ?? []).length > 0) {
          const token = await currentUser!.getIdToken();
          const res = await fetch("/api/parent/children", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const { children } = await res.json() as { children: LinkedChild[] };
            setLinkedChildren(children);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  async function handleGenerateCode() {
    if (!currentUser || generating) return;
    setGenerating(true);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const { code, expiresAt } = await res.json() as { code: string; expiresAt: string };
      setInviteCode(code);
      const exp = new Date(expiresAt);
      setCodeExpiry(
        `${exp.getHours().toString().padStart(2, "0")}:${exp.getMinutes().toString().padStart(2, "0")} まで有効`
      );
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopyCode() {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLinkChild() {
    if (!currentUser || linking || inputCode.length !== 6) return;
    setLinking(true);
    setLinkMsg(null);
    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/invite", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code: inputCode }),
      });
      const data = await res.json() as { error?: string; child?: LinkedChild };
      if (!res.ok) {
        setLinkMsg({ ok: false, text: data.error ?? "連携に失敗しました" });
        return;
      }
      setLinkMsg({ ok: true, text: `${data.child!.name}さんと連携しました！` });
      setLinkedChildren((prev) => [...prev, data.child!]);
      setInputCode("");
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink(childUid: string) {
    if (!currentUser || unlinking) return;
    setUnlinking(childUid);
    try {
      const token = await currentUser.getIdToken();
      await fetch("/api/invite", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ childUid }),
      });
      setLinkedChildren((prev) => prev.filter((c) => c.uid !== childUid));
    } finally {
      setUnlinking(null);
    }
  }

  if (loading) return <LoadingScreen />;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <h1 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          家族連携
        </h1>
      </div>

      {/* ─── 生徒: 保護者を招待するセクション ─── */}
      {role === "student" && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} style={{ color: "var(--color-brand-purple)" }} />
            <h2 className="font-bold" style={{ color: "var(--color-text-primary)" }}>保護者を招待する</h2>
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            6桁の招待コードを発行して、保護者のアプリに入力してもらいます。コードの有効期限は24時間です。
          </p>

          {parentUid ? (
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: "rgba(88,204,2,0.08)", border: "1px solid rgba(88,204,2,0.25)" }}
            >
              <p className="text-sm font-bold" style={{ color: "var(--color-brand-green)" }}>
                ✓ 保護者と連携済み
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                保護者ダッシュボードであなたの学習状況が確認できます。
              </p>
            </div>
          ) : (
            <>
              {inviteCode ? (
                <div className="space-y-3">
                  <div
                    className="rounded-xl p-4 text-center"
                    style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-bg-tertiary)" }}
                  >
                    <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>招待コード</p>
                    <p className="text-4xl font-display font-black tracking-widest" style={{ color: "var(--color-brand-blue)" }}>
                      {inviteCode}
                    </p>
                    {codeExpiry && (
                      <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>{codeExpiry}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-pill text-sm font-bold transition-all hover:opacity-80"
                      style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "コピー済み" : "コピー"}
                    </button>
                    <button
                      onClick={handleGenerateCode}
                      disabled={generating}
                      className="flex-1 py-2.5 rounded-pill text-sm font-bold transition-all hover:opacity-80 disabled:opacity-50"
                      style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)", border: "1px solid var(--color-bg-tertiary)" }}
                    >
                      再発行
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateCode}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-pill font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: "var(--color-brand-purple)" }}
                >
                  {generating ? <Loader2 size={16} className="animate-spin" /> : null}
                  {generating ? "発行中..." : "招待コードを発行"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── 保護者: お子さんのコードを入力するセクション ─── */}
      {role === "parent" && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} style={{ color: "var(--color-brand-blue)" }} />
            <h2 className="font-bold" style={{ color: "var(--color-text-primary)" }}>お子さんのコードを入力</h2>
            {plan !== "family" && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full ml-auto"
                style={{ background: "rgba(155,93,229,0.12)", color: "var(--color-brand-purple)" }}
              >
                Familyプラン
              </span>
            )}
          </div>

          {plan !== "family" ? (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                お子さんの学習状況を確認するには、Familyプランへのアップグレードが必要です。
              </p>
              <Link
                href="/settings/billing"
                className="block w-full py-3 rounded-pill font-bold text-white text-center transition-all hover:opacity-80"
                style={{ background: "linear-gradient(135deg, #9B5DE5, var(--color-brand-primary))" }}
              >
                Familyプランを開始 — ¥780/月
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                お子さんが発行した6桁のコードを入力して連携します。
              </p>

              {/* 連携済みの子どもリスト */}
              {linkedChildren.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>連携中のお子さん</p>
                  {linkedChildren.map((child) => (
                    <div
                      key={child.uid}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-bg-tertiary)" }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{child.name}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{child.grade ?? "学年未設定"}</p>
                      </div>
                      <button
                        onClick={() => handleUnlink(child.uid)}
                        disabled={unlinking === child.uid}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-pill transition-all hover:opacity-70"
                        style={{ color: "var(--color-error)", background: "rgba(255,75,75,0.08)" }}
                      >
                        {unlinking === child.uid ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
                        解除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 新しいコード入力 */}
              <div className="space-y-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full rounded-xl px-4 py-3 text-center text-2xl font-display font-black tracking-widest outline-none transition-all"
                  style={{
                    background: "var(--color-bg-secondary)",
                    border: "2px solid var(--color-bg-tertiary)",
                    color: "var(--color-text-primary)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
                />
                {linkMsg && (
                  <p
                    className="text-xs font-semibold text-center py-2 rounded-lg"
                    style={{
                      background: linkMsg.ok ? "rgba(88,204,2,0.08)" : "rgba(255,75,75,0.08)",
                      color: linkMsg.ok ? "var(--color-brand-green)" : "var(--color-error)",
                    }}
                  >
                    {linkMsg.ok ? "✓" : "✗"} {linkMsg.text}
                  </p>
                )}
                <button
                  onClick={handleLinkChild}
                  disabled={linking || inputCode.length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-pill font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
                  style={{ background: "var(--color-brand-blue)" }}
                >
                  {linking ? <Loader2 size={16} className="animate-spin" /> : null}
                  {linking ? "連携中..." : "連携する"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
