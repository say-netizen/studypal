"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { createSchedule, createRecurringSchedules } from "@/lib/firebase/schema";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

type EventType = "study" | "club" | "event" | "test";

const EVENT_TYPES: { value: EventType; label: string; icon: string; color: string }[] = [
  { value: "study", label: "勉強",   icon: "📖", color: "#58CC02" },
  { value: "club",  label: "部活",   icon: "⚽", color: "var(--color-brand-primary)" },
  { value: "event", label: "予定",   icon: "🎉", color: "#FF9600" },
  { value: "test",  label: "テスト", icon: "📝", color: "#FF4B4B" },
];

const SUBJECTS = ["国語", "数学", "英語", "理科", "社会"];

const DURATION_PRESETS = ["30", "45", "60", "90", "120"];

const REPEAT_OPTIONS = [
  { value: "none",   label: "繰り返しなし" },
  { value: "weekly", label: "毎週（繰り返す）" },
];

export default function NewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  const defaultDate = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const [title, setTitle]       = useState("");
  const [date, setDate]         = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [type, setType]         = useState<EventType>("study");
  const [duration, setDuration] = useState("60");
  const [subject, setSubject]   = useState("");
  const [repeat, setRepeat]     = useState<"none" | "weekly">("none");
  const [repeatWeeks, setRepeatWeeks] = useState("4");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const activeColor = EVENT_TYPES.find((t) => t.value === type)?.color ?? "var(--color-brand-primary)";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    if (!title.trim()) { setError("タイトルを入力してください"); return; }
    if (!date) { setError("日付を入力してください"); return; }

    setSaving(true);
    setError("");
    try {
      const base = {
        userId: currentUser.uid,
        title: title.trim(),
        startTime: startTime || null,
        type,
        duration: parseInt(duration) || 0,
        subject: subject.trim() || null,
      };

      if (repeat === "weekly") {
        await createRecurringSchedules(base, date, parseInt(repeatWeeks) || 4);
      } else {
        await createSchedule({ ...base, date });
      }

      router.push("/calendar");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "unknown";
      const msg = (err as { message?: string }).message ?? "";
      console.error("Schedule save error:", code, err);
      setError(`保存失敗: ${code} — ${msg}`);
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

        {/* 種別 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
            種別
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
                    boxShadow: active ? `0 4px 10px ${t.color}40` : undefined,
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
        <Field label="タイトル" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "study" ? "例: 数学の復習"
              : type === "club"  ? "例: サッカー練習"
              : type === "test"  ? "例: 数学テスト"
              : "例: 家族でお出かけ"
            }
            required
            className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = activeColor)}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
          />
        </Field>

        {/* 日付 + 開始時刻 */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="日付" required>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = activeColor)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
            />
          </Field>
          <Field label="開始時刻">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = activeColor)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
            />
          </Field>
        </div>

        {/* 時間（学習・部活のみ） */}
        {(type === "study" || type === "club") && (
          <Field label="時間（分）">
            <div className="flex gap-2 flex-wrap">
              {DURATION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: duration === d ? activeColor : activeColor + "18",
                    color: duration === d ? "#fff" : activeColor,
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
                placeholder="分数を入力"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
              />
            </div>
          </Field>
        )}

        {/* 科目（勉強のみ） */}
        {type === "study" && (
          <Field label="科目">
            <div className="flex gap-2 flex-wrap">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(subject === s ? "" : s)}
                  className="px-3 py-1.5 rounded-pill text-xs font-semibold transition-all"
                  style={{
                    background: subject === s ? activeColor : activeColor + "18",
                    color: subject === s ? "#fff" : activeColor,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
        )}

        {/* 繰り返し（学校の時間割など） */}
        <Field label="繰り返し">
          <div className="flex gap-2">
            {REPEAT_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRepeat(r.value as "none" | "weekly")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: repeat === r.value ? activeColor : activeColor + "18",
                  color: repeat === r.value ? "#fff" : activeColor,
                }}
              >
                {r.value === "weekly" && <RefreshCw size={13} />}
                {r.label}
              </button>
            ))}
          </div>

          {repeat === "weekly" && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                何週間続ける？
              </span>
              <div className="flex gap-1.5">
                {["4", "8", "12", "24"].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setRepeatWeeks(w)}
                    className="px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: repeatWeeks === w ? activeColor : "var(--color-bg-tertiary)",
                      color: repeatWeeks === w ? "#fff" : "var(--color-text-secondary)",
                    }}
                  >
                    {w}週
                  </button>
                ))}
              </div>
            </div>
          )}

          {repeat === "weekly" && (
            <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              📅 {date} から毎週同じ曜日に {repeatWeeks} 回分作成されます
            </p>
          )}
        </Field>

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,75,75,0.08)", color: "var(--color-error)", border: "1px solid rgba(255,75,75,0.2)" }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover:-translate-y-0.5"
          style={{
            background: activeColor,
            boxShadow: `0 4px 12px ${activeColor}50`,
          }}
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          {saving
            ? "保存中..."
            : repeat === "weekly"
            ? `毎週${repeatWeeks}回分を保存`
            : "予定を保存"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-primary)",
  border: "2px solid var(--color-bg-tertiary)",
  color: "var(--color-text-primary)",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
        {label}
        {required && <span style={{ color: "var(--color-error)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
