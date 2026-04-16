"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { createSchedule } from "@/lib/firebase/schema";
import { ArrowLeft, Loader2 } from "lucide-react";

type EventType = "study" | "club" | "event" | "test";

const EVENT_TYPES: { value: EventType; label: string; icon: string; color: string }[] = [
  { value: "study", label: "勉強",  icon: "📖", color: "#58CC02" },
  { value: "club",  label: "部活",  icon: "⚽", color: "#1CB0F6" },
  { value: "event", label: "予定",  icon: "🎉", color: "#FF9600" },
  { value: "test",  label: "テスト", icon: "📝", color: "#FF4B4B" },
];

export default function NewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  const defaultDate = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [type, setType] = useState<EventType>("study");
  const [duration, setDuration] = useState("60");
  const [subject, setSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    if (!title.trim()) { setError("タイトルを入力してください"); return; }
    if (!date) { setError("日付を入力してください"); return; }

    setSaving(true);
    setError("");
    try {
      await createSchedule({
        userId: currentUser.uid,
        title: title.trim(),
        date,
        type,
        duration: parseInt(duration) || 0,
        subject: subject.trim() || null,
      });
      router.push(`/calendar`);
    } catch {
      setError("予定の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/calendar"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <h1 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          予定を追加
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* イベント種別 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            種別 <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {EVENT_TYPES.map((t) => {
              const active = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className="py-3 rounded-xl flex flex-col items-center gap-1 text-xs font-bold transition-all duration-120"
                  style={{
                    background: active ? t.color : t.color + "15",
                    color: active ? "#fff" : t.color,
                    border: `2px solid ${active ? t.color : "transparent"}`,
                    transform: active ? "translateY(-2px)" : undefined,
                  }}
                >
                  <span className="text-lg">{t.icon}</span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* タイトル */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            タイトル <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "study" ? "例: 数学の復習" : type === "club" ? "例: サッカー練習" : type === "test" ? "例: 数学テスト" : "例: 家族でお出かけ"
            }
            className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "var(--color-bg-primary)",
              border: "2px solid var(--color-bg-tertiary)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
          />
        </div>

        {/* 日付 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            日付 <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "var(--color-bg-primary)",
              border: "2px solid var(--color-bg-tertiary)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
          />
        </div>

        {/* 時間（学習・部活のみ） */}
        {(type === "study" || type === "club") && (
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
              時間（分）
            </label>
            <div className="flex gap-2">
              {["30", "60", "90", "120"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background:
                      duration === d
                        ? "var(--color-brand-blue)"
                        : "rgba(28,176,246,0.1)",
                    color:
                      duration === d ? "#fff" : "var(--color-brand-blue)",
                  }}
                >
                  {d}分
                </button>
              ))}
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="0"
                max="480"
                placeholder="カスタム"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm transition-all"
                style={{
                  background: "var(--color-bg-primary)",
                  border: "2px solid var(--color-bg-tertiary)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              />
            </div>
          </div>
        )}

        {/* 科目（勉強のみ） */}
        {type === "study" && (
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
              科目
            </label>
            <div className="flex gap-2 flex-wrap">
              {["国語", "数学", "英語", "理科", "社会"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(subject === s ? "" : s)}
                  className="px-3 py-1.5 rounded-pill text-xs font-semibold transition-all"
                  style={{
                    background: subject === s ? "var(--color-brand-blue)" : "rgba(28,176,246,0.1)",
                    color: subject === s ? "#fff" : "var(--color-brand-blue)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,75,75,0.08)", color: "var(--color-error)" }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all duration-120 disabled:opacity-60 hover:-translate-y-0.5"
          style={{
            background: "var(--color-brand-blue)",
            boxShadow: "0 4px 12px rgba(28,176,246,0.4)",
          }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : null}
          {saving ? "保存中..." : "予定を保存"}
        </button>
      </form>
    </div>
  );
}
