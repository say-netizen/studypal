"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUser } from "@/lib/firebase/schema";

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, currentUser, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAlreadyLoggedIn, setShowAlreadyLoggedIn] = useState(false);

  const redirectedRef = useRef(false);
  const alreadyLoggedInRef = useRef(false); // Effect 2 が同期的に読む用
  const initializedRef = useRef(false);     // 初回 auth 解決済みフラグ

  async function resolveDestination(uid: string): Promise<string> {
    if (explicitRedirect) return explicitRedirect;
    try {
      const user = await getUser(uid);
      return user?.role === "parent" ? "/parent" : "/dashboard";
    } catch {
      return "/dashboard";
    }
  }

  // auth が初めて解決したとき: 既にログイン済みなら「切り替え」画面を表示
  useEffect(() => {
    if (!authLoading && !initializedRef.current) {
      initializedRef.current = true;
      if (currentUser) {
        alreadyLoggedInRef.current = true;
        setShowAlreadyLoggedIn(true);
      }
    }
  }, [authLoading, currentUser]);

  // 新規ログイン後の自動遷移（既存ログイン済みの場合はスキップ）
  useEffect(() => {
    if (!authLoading && currentUser && !redirectedRef.current && !alreadyLoggedInRef.current) {
      redirectedRef.current = true;
      resolveDestination(currentUser.uid).then((dest) => router.replace(dest));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, authLoading]);

  async function handleGoogle() {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle(); // popup が閉じると resolve
      // onAuthStateChanged → currentUser が更新 → 上の Effect が遷移
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? "unknown";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError(`Googleログインに失敗しました。(${code})`);
      }
      setLoading(false);
    }
  }

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      await signInWithEmail(email, password);
    } catch {
      setError("メールアドレスまたはパスワードが正しくありません。");
      setLoading(false);
    }
  }

  function handleSwitchAccount() {
    logout().then(() => {
      alreadyLoggedInRef.current = false;
      initializedRef.current = false;
      redirectedRef.current = false;
      setShowAlreadyLoggedIn(false);
    });
  }

  // 既にログイン済みの場合: 続けるか切り替えるか選ばせる
  if (showAlreadyLoggedIn && currentUser) {
    return (
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <span className="text-3xl">📚</span>
          <p className="text-xl font-display font-black mt-2" style={{ color: "var(--color-brand-green)" }}>StudyPal</p>
        </div>
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <p className="text-sm font-semibold text-center" style={{ color: "var(--color-text-secondary)" }}>
            ログイン中のアカウント
          </p>
          <p className="text-center font-bold" style={{ color: "var(--color-text-primary)" }}>
            {currentUser.displayName ?? currentUser.email}
          </p>
          <button
            onClick={() => router.replace(explicitRedirect ?? "/dashboard")}
            className="w-full py-3 rounded-full font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: "var(--color-brand-blue)", boxShadow: "var(--shadow-btn-blue)" }}
          >
            このアカウントで続ける
          </button>
          <button
            onClick={handleSwitchAccount}
            className="w-full py-3 rounded-full font-semibold transition-all hover:opacity-80"
            style={{ background: "var(--color-bg-secondary)", color: "var(--color-text-secondary)", border: "1px solid var(--color-bg-tertiary)" }}
          >
            別のアカウントに切り替え
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* ロゴ */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="text-3xl">📚</span>
          <span
            className="text-2xl font-display font-black"
            style={{ color: "var(--color-brand-green)" }}
          >
            StudyPal
          </span>
        </div>
        <h1 className="text-xl font-display font-bold" style={{ color: "var(--color-text-primary)" }}>
          おかえりなさい！
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          続きから学習をはじめよう
        </p>
      </div>

      {/* カード */}
      <div
        className="rounded-2xl p-8 shadow-lg"
        style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-bg-tertiary)" }}
      >
        {/* Google ログイン */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-full py-3 px-6 font-semibold transition-all duration-150 hover:-translate-y-0.5 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: "var(--color-bg-primary)",
            border: "2px solid var(--color-bg-tertiary)",
            color: "var(--color-text-primary)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleでログイン
        </button>

        {/* 区切り */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: "var(--color-bg-tertiary)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            またはメールで
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--color-bg-tertiary)" }} />
        </div>

        {/* メールフォーム */}
        <form onSubmit={handleEmail} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@studypal.app"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150"
              style={{
                background: "var(--color-bg-secondary)",
                border: "2px solid var(--color-bg-tertiary)",
                color: "var(--color-text-primary)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-150"
              style={{
                background: "var(--color-bg-secondary)",
                border: "2px solid var(--color-bg-tertiary)",
                color: "var(--color-text-primary)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
            />
          </div>

          {error && (
            <p
              className="text-sm rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,75,75,0.08)",
                color: "var(--color-error)",
                border: "1px solid rgba(255,75,75,0.2)",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-full py-3 px-6 font-bold text-white transition-all duration-150 hover:-translate-y-0.5 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: loading ? "var(--color-text-muted)" : "var(--color-brand-blue)",
              boxShadow: loading ? "none" : "var(--shadow-btn-blue)",
            }}
          >
            {loading ? "ログイン中…" : "ログイン"}
          </button>
        </form>
      </div>

      {/* 登録リンク */}
      <p className="text-center text-sm mt-5" style={{ color: "var(--color-text-secondary)" }}>
        まだアカウントがない？{" "}
        <Link
          href="/register"
          className="font-semibold hover:underline"
          style={{ color: "var(--color-brand-blue)" }}
        >
          無料登録
        </Link>
      </p>
    </div>
  );
}
