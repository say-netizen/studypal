"use client";

export const dynamic = "force-dynamic";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      router.push(redirect);
    } catch {
      setError("Googleログインに失敗しました。もう一度お試しください。");
    } finally {
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
      router.push(redirect);
    } catch {
      setError("メールアドレスまたはパスワードが正しくありません。");
    } finally {
      setLoading(false);
    }
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
          {/* Google SVG */}
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
