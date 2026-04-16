"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { getScheduleRange, deleteSchedule, type ScheduleDoc } from "@/lib/firebase/schema";
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
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

type EventType = ScheduleDoc["type"];

const TYPE_COLORS: Record<EventType, string> = {
  test:  "#FF4B4B",
  club:  "#1CB0F6",
  study: "#58CC02",
  event: "#FF9600",
};

const TYPE_LABELS: Record<EventType, string> = {
  test:  "テスト",
  club:  "部活",
  study: "勉強",
  event: "予定",
};

const TYPE_ICONS: Record<EventType, string> = {
  test:  "📝",
  club:  "⚽",
  study: "📖",
  event: "🎉",
};

export default function CalendarPage() {
  const { currentUser } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<(ScheduleDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  async function loadSchedules() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const startStr = format(monthStart, "yyyy-MM-dd");
      const endStr = format(monthEnd, "yyyy-MM-dd");
      const data = await getScheduleRange(currentUser.uid, startStr, endStr);
      setSchedules(data as (ScheduleDoc & { id: string })[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, currentMonth]);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // 月の最初の曜日に合わせてパディング（0=日曜）
  const startPad = getDay(monthStart);
  const calDays: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...days,
  ];

  const schedulesByDate = useMemo(() => {
    const map: Record<string, (ScheduleDoc & { id: string })[]> = {};
    for (const s of schedules) {
      map[s.date] = map[s.date] ? [...map[s.date], s] : [s];
    }
    return map;
  }, [schedules]);

  const selectedDaySchedules = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return schedulesByDate[key] ?? [];
  }, [selectedDay, schedulesByDate]);

  async function handleDelete(id: string) {
    await deleteSchedule(id);
    await loadSchedules();
  }

  const today = new Date();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          カレンダー
        </h1>
        <Link
          href="/calendar/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-pill text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: "var(--color-brand-blue)",
            boxShadow: "0 4px 12px rgba(28,176,246,0.4)",
          }}
        >
          <Plus size={16} />
          予定を追加
        </Link>
      </div>

      {/* カレンダー本体 */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-bg-primary)",
          border: "1px solid var(--color-bg-tertiary)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* 月ナビ */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-bg-tertiary)" }}>
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "var(--color-bg-secondary)" }}
          >
            <ChevronLeft size={16} style={{ color: "var(--color-text-secondary)" }} />
          </button>
          <h2 className="font-display font-bold" style={{ color: "var(--color-text-primary)" }}>
            {format(currentMonth, "yyyy年M月", { locale: ja })}
          </h2>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "var(--color-bg-secondary)" }}
          >
            <ChevronRight size={16} style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--color-bg-tertiary)" }}>
          {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-bold"
              style={{
                color: i === 0 ? "var(--color-error)" : i === 6 ? "var(--color-brand-blue)" : "var(--color-text-muted)",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-6 h-6 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "var(--color-brand-blue)" }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calDays.map((day, idx) => {
              if (!day) {
                return <div key={`pad-${idx}`} className="aspect-square p-1" />;
              }
              const dateStr = format(day, "yyyy-MM-dd");
              const daySchedules = schedulesByDate[dateStr] ?? [];
              const isToday = isSameDay(day, today);
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dayOfWeek = getDay(day);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className="aspect-square p-1 flex flex-col items-center transition-all"
                  style={{
                    opacity: isCurrentMonth ? 1 : 0.3,
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-0.5"
                    style={{
                      background: isToday
                        ? "var(--color-brand-blue)"
                        : isSelected
                        ? "rgba(28,176,246,0.15)"
                        : "transparent",
                      color: isToday
                        ? "#fff"
                        : isSelected
                        ? "var(--color-brand-blue)"
                        : dayOfWeek === 0
                        ? "var(--color-error)"
                        : dayOfWeek === 6
                        ? "var(--color-brand-blue)"
                        : "var(--color-text-primary)",
                    }}
                  >
                    {format(day, "d")}
                  </span>
                  {/* イベントドット（最大3つ） */}
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {daySchedules.slice(0, 3).map((s, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: TYPE_COLORS[s.type] }}
                      />
                    ))}
                    {daySchedules.length > 3 && (
                      <span
                        className="text-[8px] font-bold"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        +{daySchedules.length - 3}
                      </span>
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
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* 選択日のイベント */}
      {selectedDay && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: "var(--color-bg-primary)",
            border: "1px solid var(--color-bg-tertiary)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-display font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {format(selectedDay, "M月d日（E）", { locale: ja })}
            </h3>
            <Link
              href={`/calendar/new?date=${format(selectedDay, "yyyy-MM-dd")}`}
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--color-brand-blue)" }}
            >
              <Plus size={14} />
              追加
            </Link>
          </div>

          {selectedDaySchedules.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>
              この日の予定はありません
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDaySchedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: TYPE_COLORS[s.type] + "0D",
                    border: `1px solid ${TYPE_COLORS[s.type]}30`,
                  }}
                >
                  <span className="text-xl">{TYPE_ICONS[s.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                      {s.title}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {TYPE_LABELS[s.type]}
                      {s.duration > 0 ? ` · ${s.duration}分` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ background: "var(--color-bg-tertiary)" }}
                  >
                    <Trash2 size={13} style={{ color: "var(--color-text-muted)" }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
