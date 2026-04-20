"use client";

export const dynamic = "force-dynamic";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

const GRADES = [
  { value: "小学5年生", label: "小5" },
  { value: "小学6年生", label: "小6" },
  { value: "中学1年生", label: "中1" },
  { value: "中学2年生", label: "中2" },
  { value: "中学3年生", label: "中3" },
];

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createUserDoc(uid: string, displayName: string, userEmail: string) {
    await setDoc(doc(db(), "users", uid), {
      name: displayName,
      email: userEmail,
      grade: grade || null,
      plan: "free",
      stripeCustomerId: null,
      totalXp: 0,
      currentLevel: 1,
      currentStreak: 0,
      createdAt: serverTimestamp(),
    });
  }

  async function handleGoogle() {
    if (!grade) {
      setError("学年を選択してください。");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth(), googleProvider);
      const { uid, displayName, email: userEmail } = result.user;
      await createUserDoc(uid, displayName ?? "ゲスト", userEmail ?? "");
      router.push("/dashboard");
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? "unknown";
      console.error("Google register error:", code, e);
      setError(`Googleでの登録に失敗しました。(${code})`);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !grade) return;
    setLoading(true);
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth(), email, password);
      await updateProfile(cred.user, { displayName: name });
      await createUserDoc(cred.user.uid, name, email);
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        setError("このメールアドレスはすでに使用されています。");
      } else if (code === "auth/weak-password") {
        setError("パスワードは6文字以上で設定してください。");
      } else {
        setError("登録に失敗しました。もう一度お試しください。");
      }
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
          アカウントを作成する
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          無料ではじめられます。クレジットカード不要。
        </p>
      </div>

      {/* カード */}
      <div
        className="rounded-2xl p-8 shadow-lg"
        style={{
          background: "var(--color-surface-card)",
          border: "1px solid var(--color-bg-tertiary)",
        }}
      >
        {/* 学年選択 */}
        <div className="mb-5">
          <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
            学年を選んでください
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {GRADES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGrade(g.value)}
                className="rounded-xl py-2 text-xs font-semibold transition-all duration-150"
                style={{
                  background: grade === g.value ? "var(--color-brand-blue)" : "var(--color-bg-secondary)",
                  color: grade === g.value ? "#fff" : "var(--color-text-secondary)",
                  border: grade === g.value
                    ? "2px solid var(--color-brand-blue)"
                    : "2px solid transparent",
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Google 登録 */}
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
          Googleで登録
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
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {[
            { id: "name",         label: "ニックネーム", type: "text",     value: name,     setter: setName,     placeholder: "例: たろう",              autocomplete: "name" },
            { id: "reg-email",    label: "メールアドレス", type: "email",  value: email,    setter: setEmail,    placeholder: "example@studypal.app",     autocomplete: "email" },
            { id: "reg-password", label: "パスワード（6文字以上）", type: "password", value: password, setter: setPassword, placeholder: "••••••••", autocomplete: "new-password" },
          ].map(({ id, label, type, value, setter, placeholder, autocomplete }) => (
            <div key={id}>
              <label
                htmlFor={id}
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {label}
              </label>
              <input
                id={id}
                type={type}
                autoComplete={autocomplete}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                required
                minLength={type === "password" ? 6 : undefined}
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
          ))}

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
            disabled={loading || !name || !email || !password || !grade}
            className="w-full rounded-full py-3 px-6 font-bold text-white transition-all duration-150 hover:-translate-y-0.5 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: loading ? "var(--color-text-muted)" : "var(--color-brand-green)",
              boxShadow: loading ? "none" : "var(--shadow-btn)",
            }}
          >
            {loading ? "登録中…" : "無料で登録する"}
          </button>
        </form>
      </div>

      {/* ログインリンク */}
      <p className="text-center text-sm mt-5" style={{ color: "var(--color-text-secondary)" }}>
        すでにアカウントをお持ちの方は{" "}
        <Link
          href="/login"
          className="font-semibold hover:underline"
          style={{ color: "var(--color-brand-blue)" }}
        >
          ログイン
        </Link>
      </p>
    </div>
  );
}
