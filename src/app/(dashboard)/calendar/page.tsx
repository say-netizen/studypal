"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getScheduleRange,
  getStudySessionRange,
  deleteSchedule,
  createSchedule,
  type ScheduleDoc,
  type StudySessionDoc,
} from "@/lib/firebase/schema";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { ja } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Trash2, X, Sparkles } from "lucide-react";

type EventType = ScheduleDoc["type"];

const TYPE_COLORS: Record<EventType, string> = {
  test:  "#FF4B4B",
  club:  "var(--color-brand-primary)",
  study: "#58CC02",
  event: "#FF9600",
};
const TYPE_LABELS: Record<EventType, string> = {
  test: "テスト", club: "部活", study: "勉強", event: "予定",
};

// 時間文字列 "HH:MM" → その日の分オフセット
function timeToMinutes(t: string | null): number {
  if (!t) return 8 * 60; // デフォルト8:00
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

const HOUR_START = 6;
const HOUR_END = 23;
const PX_PER_MIN = 1.2;

// ── 時間軸の1イベント ──────────────────────
function TimelineEvent({
  s,
  onDelete,
}: {
  s: ScheduleDoc & { id: string };
  onDelete: (id: string) => void;
}) {
  const color = TYPE_COLORS[s.type];
  const startMin = timeToMinutes(s.startTime ?? null) - HOUR_START * 60;
  const height = Math.max(s.duration * PX_PER_MIN, 28);
  const top = startMin * PX_PER_MIN;

  return (
    <div
      className="absolute left-14 right-2 rounded-lg px-2 py-1 overflow-hidden"
      style={{
        top,
        height,
        background: color + "22",
        border: `1.5px solid ${color}66`,
        minHeight: 28,
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold truncate" style={{ color }}>
            {s.startTime && <span className="mr-1 opacity-70">{s.startTime}</span>}
            {s.title}
          </p>
          {height >= 40 && s.duration > 0 && (
            <p className="text-[10px]" style={{ color }}>
              {TYPE_LABELS[s.type]} · {s.duration}分
            </p>
          )}
        </div>
        <button
          onClick={() => onDelete(s.id)}
          className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center opacity-60 hover:opacity-100"
          style={{ background: color + "30" }}
        >
          <Trash2 size={9} style={{ color }} />
        </button>
      </div>
    </div>
  );
}

// ── 時間軸ビュー ──────────────────────────
function DayTimeline({
  day,
  schedules,
  sessions,
  onDelete,
  onClose,
}: {
  day: Date;
  schedules: (ScheduleDoc & { id: string })[];
  sessions: (StudySessionDoc & { id: string })[];
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const totalHeight = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN;
  const actualMins = sessions.reduce((sum, s) => sum + s.actualMinutes, 0);

  useEffect(() => {
    // 8時付近にスクロール
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - HOUR_START) * 60 * PX_PER_MIN - 30;
    }
  }, []);

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "var(--color-bg-primary)",
        border: "1px solid var(--color-bg-tertiary)",
        boxShadow: "var(--shadow-card)",
        maxHeight: "70vh",
      }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-bg-tertiary)" }}
      >
        <div>
          <h3 className="font-display font-bold" style={{ color: "var(--color-text-primary)" }}>
            {format(day, "M月d日（E）", { locale: ja })}
          </h3>
          {actualMins > 0 && (
            <p className="text-xs font-semibold" style={{ color: "var(--color-brand-green)" }}>
              ✓ 実績 {actualMins}分
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar/new?date=${format(day, "yyyy-MM-dd")}`}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-pill"
            style={{ background: "var(--color-brand-blue)", color: "#fff" }}
          >
            <Plus size={12} />
            追加
          </Link>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70"
            style={{ background: "var(--color-bg-tertiary)" }}
          >
            <X size={14} style={{ color: "var(--color-text-muted)" }} />
          </button>
        </div>
      </div>

      {/* 時間軸 */}
      <div ref={scrollRef} className="overflow-y-auto flex-1">
        <div className="relative" style={{ height: totalHeight }}>
          {/* 時間ラベル + 横線 */}
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 flex items-start"
              style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN }}
            >
              <span
                className="w-12 text-right pr-2 text-[10px] flex-shrink-0 -mt-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                {h}:00
              </span>
              <div
                className="flex-1 border-t"
                style={{ borderColor: "var(--color-bg-tertiary)" }}
              />
            </div>
          ))}

          {/* イベント */}
          {schedules.map((s) => (
            <TimelineEvent key={s.id} s={s} onDelete={onDelete} />
          ))}

          {/* 実績セッション（薄い緑の帯） */}
          {sessions.map((s) => {
            const startMin = timeToMinutes(null) - HOUR_START * 60;
            const height = s.actualMinutes * PX_PER_MIN;
            return (
              <div
                key={s.id}
                className="absolute right-2 w-2 rounded-full opacity-40"
                style={{
                  top: startMin * PX_PER_MIN,
                  height: Math.max(height, 8),
                  background: "var(--color-brand-green)",
                  left: "auto",
                }}
              />
            );
          })}

          {/* 現在時刻ライン */}
          <NowLine />
        </div>
      </div>
    </div>
  );
}

function NowLine() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < HOUR_START || h >= HOUR_END) return null;
  const top = ((h - HOUR_START) * 60 + m) * PX_PER_MIN;
  return (
    <div
      className="absolute left-12 right-0 flex items-center pointer-events-none"
      style={{ top }}
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--color-error)" }} />
      <div className="flex-1 border-t-2" style={{ borderColor: "var(--color-error)" }} />
    </div>
  );
}

type AiPlanItem = { date: string; focus: string; minutes: number };
type AiResult = { dailyMinutes: number; plan: AiPlanItem[]; advice: string };

// ── AI逆算計画モーダル ─────────────────────
function AiPlanModal({
  onClose,
  schedules,
  uid,
  token,
  onSaved,
}: {
  onClose: () => void;
  schedules: (ScheduleDoc & { id: string })[];
  uid: string;
  token: string;
  onSaved: () => void;
}) {
  const [testDate, setTestDate] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!testDate || !subject) { setError("テスト日と科目を入力してください"); return; }
    setError("");
    setLoading(true);
    try {
      const today = new Date();
      const test = new Date(testDate);
      const daysUntilTest = Math.max(1, Math.ceil((test.getTime() - today.getTime()) / 86400000));

      // 部活スケジュールを空き時間情報としてAPIへ渡す
      const freeSlots = schedules
        .filter((s) => s.type === "club" || s.type === "event")
        .filter((s) => s.date >= format(today, "yyyy-MM-dd") && s.date <= testDate)
        .map((s) => ({ date: s.date, title: s.title, startTime: s.startTime, duration: s.duration }));

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ testDate, subject, daysUntilTest, freeSlots }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "生成に失敗しました"); return; }
      setResult(data);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function saveAll() {
    if (!result) return;
    setSaving(true);
    try {
      await Promise.all(
        result.plan.map((item) =>
          createSchedule({
            userId: uid,
            date: item.date,
            title: `[AI] ${item.focus}`,
            subject,
            type: "study",
            duration: item.minutes,
            startTime: null,
          })
        )
      );
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "var(--color-bg-primary)", boxShadow: "var(--shadow-card-hover)", maxHeight: "90vh" }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-bg-tertiary)" }}>
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: "var(--color-brand-primary)" }} />
            <h2 className="font-display font-bold text-base" style={{ color: "var(--color-text-primary)" }}>AI逆算計画を生成</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70" style={{ background: "var(--color-bg-tertiary)" }}>
            <X size={14} style={{ color: "var(--color-text-muted)" }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {!result ? (
            <>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>テスト日</label>
                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                    className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
                    style={{ borderColor: "var(--color-bg-tertiary)", color: "var(--color-text-primary)", background: "var(--color-bg-secondary)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>科目</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="例: 数学、英語、理科"
                    className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
                    style={{ borderColor: "var(--color-bg-tertiary)", color: "var(--color-text-primary)", background: "var(--color-bg-secondary)" }}
                  />
                </div>
              </div>
              {error && <p className="text-xs font-semibold" style={{ color: "var(--color-error)" }}>{error}</p>}
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                カレンダーの部活・予定を読み取り、空き時間に勉強計画を自動配置します。
              </p>
            </>
          ) : (
            <>
              <div className="rounded-xl p-3" style={{ background: "var(--color-brand-primary)" + "15", border: "1px solid " + "var(--color-brand-primary)" + "30" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--color-brand-primary)" }}>AIアドバイス</p>
                <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>{result.advice}</p>
              </div>
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                1日の推奨学習時間: {result.dailyMinutes}分 · {result.plan.length}日分の計画
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {result.plan.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--color-bg-secondary)" }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{item.date}</p>
                      <p className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{item.focus}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-pill" style={{ background: "#58CC0220", color: "#58CC02" }}>{item.minutes}分</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* フッター */}
        <div className="px-5 py-4 border-t flex gap-2" style={{ borderColor: "var(--color-bg-tertiary)" }}>
          {!result ? (
            <button
              onClick={generate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-pill text-sm font-bold text-white transition-all"
              style={{ background: loading ? "var(--color-bg-tertiary)" : "var(--color-brand-primary)", color: loading ? "var(--color-text-muted)" : "#fff" }}
            >
              {loading ? (
                <><div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-text-muted)" }} />生成中…</>
              ) : (
                <><Sparkles size={14} />計画を生成</>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => setResult(null)}
                className="px-4 py-2.5 rounded-pill text-sm font-bold border transition-all"
                style={{ borderColor: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
              >
                やり直す
              </button>
              <button
                onClick={saveAll}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-pill text-sm font-bold text-white"
                style={{ background: saving ? "var(--color-bg-tertiary)" : "#58CC02", color: saving ? "var(--color-text-muted)" : "#fff" }}
              >
                {saving ? "保存中…" : `${result.plan.length}件をカレンダーに追加`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── メインページ ──────────────────────────
export default function CalendarPage() {
  const { currentUser } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<(ScheduleDoc & { id: string })[]>([]);
  const [sessions, setSessions] = useState<(StudySessionDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [userToken, setUserToken] = useState("");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  async function loadData() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const startStr = format(monthStart, "yyyy-MM-dd");
      const endStr = format(monthEnd, "yyyy-MM-dd");
      const [sched, sess] = await Promise.all([
        getScheduleRange(currentUser.uid, startStr, endStr).catch(() => []),
        getStudySessionRange(currentUser.uid, startStr, endStr).catch(() => []),
      ]);
      setSchedules(sched as (ScheduleDoc & { id: string })[]);
      setSessions(sess as (StudySessionDoc & { id: string })[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [currentUser, currentMonth]);

  useEffect(() => {
    if (!currentUser) return;
    currentUser.getIdToken().then(setUserToken).catch(() => {});
  }, [currentUser]);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const calDays: (Date | null)[] = [...Array(startPad).fill(null), ...days];

  const schedulesByDate = useMemo(() => {
    const map: Record<string, (ScheduleDoc & { id: string })[]> = {};
    for (const s of schedules) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    // 時刻順にソート
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => timeToMinutes(a.startTime ?? null) - timeToMinutes(b.startTime ?? null));
    }
    return map;
  }, [schedules]);

  const actualMinutesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessions) map[s.date] = (map[s.date] ?? 0) + s.actualMinutes;
    return map;
  }, [sessions]);

  const selectedSchedules = useMemo(() => {
    if (!selectedDay) return [];
    return schedulesByDate[format(selectedDay, "yyyy-MM-dd")] ?? [];
  }, [selectedDay, schedulesByDate]);

  const selectedSessions = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return sessions.filter((s) => s.date === key);
  }, [selectedDay, sessions]);

  async function handleDelete(id: string) {
    await deleteSchedule(id);
    await loadData();
  }

  const today = new Date();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          カレンダー
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-pill text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{ background: "var(--color-brand-primary)" + "18", color: "var(--color-brand-primary)", border: "1px solid " + "var(--color-brand-primary)" + "40" }}
          >
            <Sparkles size={14} />
            AI計画
          </button>
          <Link
            href="/calendar/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-pill text-sm font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: "var(--color-brand-primary)", boxShadow: "var(--shadow-btn-brown)" }}
          >
            <Plus size={16} />
            予定を追加
          </Link>
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
      >
        {/* 月ナビ */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--color-bg-tertiary)" }}>
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70"
            style={{ background: "var(--color-bg-secondary)" }}
          >
            <ChevronLeft size={16} style={{ color: "var(--color-text-secondary)" }} />
          </button>
          <h2 className="font-display font-bold" style={{ color: "var(--color-text-primary)" }}>
            {format(currentMonth, "yyyy年M月", { locale: ja })}
          </h2>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70"
            style={{ background: "var(--color-bg-secondary)" }}
          >
            <ChevronRight size={16} style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>

        {/* 曜日 */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--color-bg-tertiary)" }}>
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
            <div key={d} className="py-2 text-center text-xs font-bold"
              style={{ color: i === 0 ? "var(--color-error)" : i === 6 ? "var(--color-brand-blue)" : "var(--color-text-muted)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--color-brand-blue)" }} />
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y" style={{ borderColor: "var(--color-bg-tertiary)" }}>
            {calDays.map((day, idx) => {
              if (!day) return <div key={`pad-${idx}`} className="min-h-[72px]" />;
              const dateStr = format(day, "yyyy-MM-dd");
              const daySchedules = schedulesByDate[dateStr] ?? [];
              const actualMins = actualMinutesByDate[dateStr] ?? 0;
              const isToday = isSameDay(day, today);
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dow = getDay(day);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className="min-h-[72px] p-1 flex flex-col items-start text-left transition-all hover:bg-blue-50"
                  style={{
                    opacity: isCurrentMonth ? 1 : 0.3,
                    background: isSelected ? "rgba(28,176,246,0.08)" : undefined,
                  }}
                >
                  {/* 日付数字 */}
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-0.5 flex-shrink-0"
                    style={{
                      background: isToday ? "var(--color-brand-blue)" : "transparent",
                      color: isToday ? "#fff" : dow === 0 ? "var(--color-error)" : dow === 6 ? "var(--color-brand-blue)" : "var(--color-text-primary)",
                    }}
                  >
                    {format(day, "d")}
                  </span>

                  {/* イベントピル（最大2件表示） */}
                  <div className="w-full space-y-0.5">
                    {daySchedules.slice(0, 2).map((s) => (
                      <div
                        key={s.id}
                        className="w-full rounded text-[9px] font-semibold px-1 py-0.5 truncate leading-tight"
                        style={{ background: TYPE_COLORS[s.type] + "22", color: TYPE_COLORS[s.type] }}
                      >
                        {s.startTime ? `${s.startTime} ` : ""}{s.title}
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <div className="text-[9px] font-bold pl-1" style={{ color: "var(--color-text-muted)" }}>
                        +{daySchedules.length - 2}件
                      </div>
                    )}
                    {/* 実績バッジ */}
                    {actualMins > 0 && (
                      <div className="text-[9px] font-bold pl-1" style={{ color: "var(--color-brand-green)" }}>
                        ✓{actualMins}m
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 凡例 */}
      <div className="flex gap-4 flex-wrap">
        {(Object.entries(TYPE_LABELS) as [EventType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS[type] }} />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* 時間軸デイビュー */}
      {selectedDay && (
        <DayTimeline
          day={selectedDay}
          schedules={selectedSchedules}
          sessions={selectedSessions}
          onDelete={async (id) => { await handleDelete(id); }}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* AI逆算計画モーダル */}
      {showAiModal && currentUser && (
        <AiPlanModal
          onClose={() => setShowAiModal(false)}
          schedules={schedules}
          uid={currentUser.uid}
          token={userToken}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
