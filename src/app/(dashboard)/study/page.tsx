"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getSchedulesByDate,
  createStudySession,
  recordStudySession,
  addXp,
  type ScheduleDoc,
} from "@/lib/firebase/schema";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Play, Pause, Square, Timer, BookOpen, AlarmClock } from "lucide-react";

const SUBJECTS = ["国語", "数学", "英語", "理科", "社会", "その他"];
const COUNTDOWN_PRESETS = [15, 30, 45, 60, 90];

const SUBJECT_COLORS: Record<string, string> = {
  国語: "#9B5DE5",
  数学: "var(--color-brand-primary)",
  英語: "#58CC02",
  理科: "#00C9A7",
  社会: "#FF9600",
  その他: "#9CA3AF",
};

type Phase = "idle" | "running" | "paused" | "done";
type TimerMode = "stopwatch" | "countdown";

function getEncouragement(actual: number, planned: number) {
  if (planned === 0) {
    if (actual >= 60) return { emoji: "🔥", title: "すごい集中力！", msg: `${actual}分も頑張れた！この調子で続けよう` };
    if (actual >= 30) return { emoji: "⭐", title: "よくやった！", msg: `${actual}分がんばったね。積み重ねが力になるよ` };
    return { emoji: "📚", title: "いいスタート！", msg: `${actual}分できた！一歩一歩進んでいこう` };
  }
  const ratio = actual / planned;
  if (ratio >= 1.0) return { emoji: "🏆", title: "計画達成！完璧！", msg: `目標${planned}分をクリア！自分を褒めていいよ` };
  if (ratio >= 0.8) return { emoji: "🎉", title: "もう少しだった！", msg: `目標まであと${planned - actual}分。${actual}分も頑張ったのは本物だよ` };
  if (ratio >= 0.5) return { emoji: "💪", title: "よくやった！", msg: `${actual}分集中できた。継続することが一番大事！` };
  return { emoji: "🌱", title: "また明日！", msg: `${actual}分できた！今日やったことは無駄にならないよ` };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function StudyPage() {
  const { currentUser } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "M月d日（E）", { locale: ja });

  const [todaySchedules, setTodaySchedules] = useState<(ScheduleDoc & { id: string })[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<(ScheduleDoc & { id: string }) | null>(null);
  const [subject, setSubject] = useState("数学");
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0); // 秒
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ actual: number; planned: number; subject: string } | null>(null);
  const [timerMode, setTimerMode] = useState<TimerMode>("stopwatch");
  const [countdownMinutes, setCountdownMinutes] = useState(30);
  const countdownTotalRef = useRef<number>(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const savedElapsedRef = useRef<number>(0);
  const notifiedRef = useRef<boolean>(false);

  // 今日の勉強スケジュールを取得
  useEffect(() => {
    if (!currentUser) return;
    getSchedulesByDate(currentUser.uid, today).then((data) => {
      const studyOnly = (data as (ScheduleDoc & { id: string })[]).filter((s) => s.type === "study");
      setTodaySchedules(studyOnly);
    });
  }, [currentUser, today]);

  const tick = useCallback(() => {
    const newElapsed = savedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
    setElapsed(newElapsed);
    if (countdownTotalRef.current > 0 && newElapsed >= countdownTotalRef.current) {
      setElapsed(countdownTotalRef.current);
      // バックグラウンドでも通知
      if (!notifiedRef.current && typeof Notification !== "undefined" && Notification.permission === "granted") {
        notifiedRef.current = true;
        new Notification("⏱️ 勉強時間終了！", {
          body: `${Math.round(countdownTotalRef.current / 60)}分の集中、お疲れ様でした！`,
          icon: "/icons/icon-192x192.png",
        });
      }
    }
  }, []);

  // Page Visibility API: バックグラウンドでもタイマー継続
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && intervalRef.current !== null) {
        // フォアグラウンドに戻ったら表示を即時更新
        tick();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [tick]);

  function startTimer() {
    if (timerMode === "countdown" && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    notifiedRef.current = false;
    startTimeRef.current = Date.now();
    savedElapsedRef.current = 0;
    countdownTotalRef.current = timerMode === "countdown" ? countdownMinutes * 60 : 0;
    setPhase("running");
    intervalRef.current = setInterval(tick, 1000);
  }

  function pauseTimer() {
    savedElapsedRef.current = elapsed;
    setPhase("paused");
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }

  function resumeTimer() {
    startTimeRef.current = Date.now();
    setPhase("running");
    intervalRef.current = setInterval(tick, 1000);
  }

  async function stopTimer() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setPhase("done");

    const finalElapsed = savedElapsedRef.current + (startTimeRef.current > 0 ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0);
    const actualMinutes = Math.max(1, Math.round(finalElapsed / 60));
    const plannedMinutes = timerMode === "countdown"
      ? countdownMinutes
      : (selectedSchedule?.duration ?? 0);
    const finalSubject = selectedSchedule?.subject ?? subject;
    const isScheduled = selectedSchedule !== null;
    // 予定通り: 10pt/分, 予定外: 5pt/分
    const xpGained = actualMinutes * (isScheduled ? 10 : 5);

    setSaving(true);
    try {
      if (currentUser) {
        await createStudySession({
          userId: currentUser.uid,
          subject: finalSubject,
          plannedMinutes,
          actualMinutes,
          scheduleId: selectedSchedule?.id ?? null,
          date: today,
        });
        const newStreak = await recordStudySession(currentUser.uid);
        await addXp(currentUser.uid, xpGained);

        // ランキング更新（新スコア形式）
        const token = await currentUser.getIdToken();
        await fetch("/api/ranking", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            scheduledMinutes: isScheduled ? actualMinutes : 0,
            freeMinutes: isScheduled ? 0 : actualMinutes,
            streakDays: newStreak > 0 ? 1 : 0,
            testRegistrations: 0,
            subject: finalSubject,
          }),
        });
      }
    } finally {
      setSaving(false);
    }

    setResult({ actual: actualMinutes, planned: plannedMinutes, subject: finalSubject });
  }

  function reset() {
    setPhase("idle");
    setElapsed(0);
    setResult(null);
    setSelectedSchedule(null);
    countdownTotalRef.current = 0;
    notifiedRef.current = false;
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // カウントダウン完了で自動終了
  useEffect(() => {
    if (phase === "running" && countdownTotalRef.current > 0 && elapsed >= countdownTotalRef.current) {
      stopTimer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, phase]);

  const activeSubject = selectedSchedule?.subject ?? subject;
  const color = SUBJECT_COLORS[activeSubject] ?? "var(--color-brand-blue)";
  const plannedSec = timerMode === "countdown"
    ? countdownMinutes * 60
    : (selectedSchedule?.duration ?? 0) * 60;
  const progressPct = plannedSec > 0 ? Math.min((elapsed / plannedSec) * 100, 100) : null;
  const countdownRemaining = timerMode === "countdown" ? Math.max(0, plannedSec - elapsed) : null;
  const displayTime = countdownRemaining !== null ? countdownRemaining : elapsed;

  // ── 完了画面 ──
  if (phase === "done" && result) {
    const enc = getEncouragement(result.actual, result.planned);
    return (
      <div className="max-w-sm mx-auto px-4 py-10 flex flex-col items-center gap-6">
        <style>{`
          @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.5); }
            60% { transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div style={{ animation: "bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards", fontSize: "4rem" }}>
          {enc.emoji}
        </div>
        <h2 className="text-2xl font-display font-black text-center" style={{ color: "var(--color-text-primary)" }}>
          {enc.title}
        </h2>
        <p className="text-sm text-center leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {enc.msg}
        </p>

        {/* 実績カード */}
        <div className="w-full rounded-2xl p-5 space-y-3" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>科目</span>
            <span className="text-sm font-bold px-2.5 py-0.5 rounded-full" style={{ background: (SUBJECT_COLORS[result.subject] ?? "#9CA3AF") + "18", color: SUBJECT_COLORS[result.subject] ?? "#9CA3AF" }}>
              {result.subject}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>実際の勉強時間</span>
            <span className="text-xl font-display font-black" style={{ color }}>
              {result.actual}分
            </span>
          </div>
          {result.planned > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>目標時間</span>
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                {result.planned}分
              </span>
            </div>
          )}
          {result.planned > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                <span>達成率</span>
                <span>{Math.round((result.actual / result.planned) * 100)}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-tertiary)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((result.actual / result.planned) * 100, 100)}%`,
                    background: result.actual >= result.planned
                      ? "linear-gradient(90deg, #58CC02, #89E219)"
                      : "linear-gradient(90deg, var(--color-brand-primary), #00C9A7)",
                    transition: "width 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: "var(--color-bg-tertiary)" }}>
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>獲得XP</span>
            <span className="text-sm font-bold" style={{ color: "var(--color-xp-gold)" }}>
              +{result.actual * 10} XP ✨
            </span>
          </div>
        </div>

        <button
          onClick={reset}
          className="w-full py-3 rounded-pill font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ background: "var(--color-brand-blue)", boxShadow: "0 4px 12px rgba(28,176,246,0.4)" }}
        >
          もう一度始める
        </button>
      </div>
    );
  }

  // ── メイン画面 ──
  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          勉強タイマー ⏱️
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{todayLabel}</p>
      </div>

      {/* 今日の勉強予定 */}
      {todaySchedules.length > 0 && phase === "idle" && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            今日の勉強予定
          </p>
          {todaySchedules.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSchedule(selectedSchedule?.id === s.id ? null : s)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{
                background: selectedSchedule?.id === s.id ? (SUBJECT_COLORS[s.subject ?? ""] ?? "#9CA3AF") + "18" : "var(--color-bg-primary)",
                border: `2px solid ${selectedSchedule?.id === s.id ? (SUBJECT_COLORS[s.subject ?? ""] ?? "#9CA3AF") : "var(--color-bg-tertiary)"}`,
              }}
            >
              <BookOpen size={16} style={{ color: SUBJECT_COLORS[s.subject ?? ""] ?? "#9CA3AF", flexShrink: 0 }} />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.title}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {s.subject} · 目標{s.duration}分
                </p>
              </div>
              {selectedSchedule?.id === s.id && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: SUBJECT_COLORS[s.subject ?? ""] ?? "#9CA3AF" }}>
                  選択中
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 科目選択（予定未選択の場合） */}
      {phase === "idle" && !selectedSchedule && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            科目を選ぶ
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className="py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: subject === s ? (SUBJECT_COLORS[s] ?? "#9CA3AF") + "18" : "var(--color-bg-primary)",
                  border: `2px solid ${subject === s ? (SUBJECT_COLORS[s] ?? "#9CA3AF") : "var(--color-bg-tertiary)"}`,
                  color: subject === s ? (SUBJECT_COLORS[s] ?? "#9CA3AF") : "var(--color-text-secondary)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* タイマーモード選択 */}
      {phase === "idle" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["stopwatch", "countdown"] as TimerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setTimerMode(mode)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: timerMode === mode ? "rgba(28,176,246,0.12)" : "var(--color-bg-primary)",
                  border: `2px solid ${timerMode === mode ? "var(--color-brand-blue)" : "var(--color-bg-tertiary)"}`,
                  color: timerMode === mode ? "var(--color-brand-blue)" : "var(--color-text-secondary)",
                }}
              >
                {mode === "stopwatch" ? <Timer size={15} /> : <AlarmClock size={15} />}
                {mode === "stopwatch" ? "ストップウォッチ" : "カウントダウン"}
              </button>
            ))}
          </div>

          {timerMode === "countdown" && (
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                集中時間を選ぶ
              </p>
              <div className="flex flex-wrap gap-2">
                {COUNTDOWN_PRESETS.map((min) => (
                  <button
                    key={min}
                    onClick={() => setCountdownMinutes(min)}
                    className="px-4 py-2 rounded-pill text-sm font-bold transition-all"
                    style={{
                      background: countdownMinutes === min ? color : "var(--color-bg-secondary)",
                      color: countdownMinutes === min ? "#fff" : "var(--color-text-secondary)",
                      border: `1px solid ${countdownMinutes === min ? "transparent" : "var(--color-bg-tertiary)"}`,
                    }}
                  >
                    {min}分
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={countdownMinutes}
                onChange={(e) => setCountdownMinutes(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: color }}
              />
              <p className="text-center font-display font-black text-2xl" style={{ color }}>
                {countdownMinutes}分集中モード ⏱️
              </p>
            </div>
          )}
        </div>
      )}

      {/* タイマー本体 */}
      <div className="flex flex-col items-center gap-6 py-4">
        {/* 円形プログレス */}
        <div className="relative" style={{ width: 200, height: 200 }}>
          <svg width={200} height={200} viewBox="0 0 200 200">
            {/* 背景トラック */}
            <circle cx="100" cy="100" r="88" fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="10" />
            {/* プログレス（目標あり） */}
            {progressPct !== null && (
              <circle
                cx="100" cy="100" r="88"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - progressPct / 100)}
                transform="rotate(-90 100 100)"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            )}
            {/* 目標なしは回転インジケータ */}
            {progressPct === null && phase === "running" && (
              <circle
                cx="100" cy="100" r="88"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 88 * 0.25} ${2 * Math.PI * 88 * 0.75}`}
                style={{ transformOrigin: "100px 100px", animation: "spinRing 1.5s linear infinite" }}
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-mono font-black"
              style={{
                fontSize: displayTime >= 3600 ? "1.75rem" : "2.5rem",
                color: phase === "idle" ? "var(--color-text-muted)" : color,
                letterSpacing: "-0.02em",
              }}
            >
              {formatTime(displayTime)}
            </span>
            {timerMode === "countdown" && phase !== "idle" && (
              <span className="text-xs font-semibold mt-1" style={{ color: "var(--color-text-muted)" }}>
                残り時間
              </span>
            )}
            {timerMode === "stopwatch" && progressPct !== null && (
              <span className="text-xs font-semibold mt-1" style={{ color: "var(--color-text-muted)" }}>
                目標 {selectedSchedule!.duration}分
              </span>
            )}
            {phase === "running" && (
              <span className="text-xs mt-1 font-medium" style={{ color }}>
                集中中 🔥
              </span>
            )}
            {phase === "paused" && (
              <span className="text-xs mt-1 font-medium" style={{ color: "var(--color-warning)" }}>
                一時停止中
              </span>
            )}
          </div>
        </div>

        {/* コントロールボタン */}
        <div className="flex items-center gap-4">
          {phase === "idle" && (
            <button
              onClick={startTimer}
              className="flex items-center gap-2 px-8 py-3.5 rounded-pill font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: color, boxShadow: `0 4px 15px ${color}50` }}
            >
              <Play size={18} />
              スタート
            </button>
          )}

          {phase === "running" && (
            <>
              <button
                onClick={pauseTimer}
                className="flex items-center gap-2 px-6 py-3 rounded-pill font-bold transition-all hover:-translate-y-0.5"
                style={{ background: "var(--color-bg-primary)", border: "2px solid var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
              >
                <Pause size={18} />
                一時停止
              </button>
              <button
                onClick={stopTimer}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-pill font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: "var(--color-error)", boxShadow: "0 4px 12px rgba(255,75,75,0.35)" }}
              >
                <Square size={18} />
                終了
              </button>
            </>
          )}

          {phase === "paused" && (
            <>
              <button
                onClick={resumeTimer}
                className="flex items-center gap-2 px-6 py-3 rounded-pill font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: color, boxShadow: `0 4px 12px ${color}40` }}
              >
                <Play size={18} />
                再開
              </button>
              <button
                onClick={stopTimer}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-pill font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: "var(--color-error)" }}
              >
                <Square size={18} />
                終了
              </button>
            </>
          )}
        </div>

        {/* 科目バッジ（タイマー起動後） */}
        {phase !== "idle" && (
          <span
            className="text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-2"
            style={{ background: color + "18", color }}
          >
            <Timer size={14} />
            {activeSubject}
          </span>
        )}
      </div>
    </div>
  );
}
