"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getUser,
  getStudySessionRange,
  type UserDoc,
  type StudySessionDoc,
} from "@/lib/firebase/schema";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/social/FollowButton";
import { ArrowLeft, Pencil, Flame, Star, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ja } from "date-fns/locale";

const DAYS = 7;

const SUBJECT_COLORS: Record<string, string> = {
  国語: "#FF6BB3",
  数学: "var(--color-brand-primary)",
  英語: "#58CC02",
  理科: "#00C9A7",
  社会: "#FF9600",
  その他: "#9B5DE5",
};

function subjectColor(subject: string) {
  return SUBJECT_COLORS[subject] ?? SUBJECT_COLORS["その他"];
}

export default function ProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState<(UserDoc & { id: string }) | null>(null);
  const [sessions, setSessions] = useState<(StudySessionDoc & { id: string })[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [initialFollowing, setInitialFollowing] = useState(false);
  const [followersAdjust, setFollowersAdjust] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const endDate = format(new Date(), "yyyy-MM-dd");
    const startDate = format(subDays(new Date(), DAYS - 1), "yyyy-MM-dd");

    async function load() {
      try {
        // ユーザー情報を最優先で取得（失敗したら即エラー表示）
        const userData = await getUser(uid);
        if (!userData) { setError(true); return; }
        setUser(userData);

        // フォロー情報とセッションは失敗しても表示を継続
        const [sessionRes, followingRes, followersRes] = await Promise.allSettled([
          getStudySessionRange(uid, startDate, endDate),
          fetch(`/api/follows?uid=${uid}&type=following`).then((r) => r.json()),
          fetch(`/api/follows?uid=${uid}&type=followers`).then((r) => r.json()),
        ]);

        if (sessionRes.status === "fulfilled") {
          setSessions(sessionRes.value as (StudySessionDoc & { id: string })[]);
        }
        if (followingRes.status === "fulfilled") {
          setFollowingCount((followingRes.value.users ?? []).length);
        }
        if (followersRes.status === "fulfilled") {
          setFollowersCount((followersRes.value.users ?? []).length);
        }

        // フォロー状態
        if (currentUser && currentUser.uid !== uid) {
          try {
            const token = await currentUser.getIdToken();
            const res = await fetch(`/api/follows?uid=${currentUser.uid}&type=following`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const following = (data.users ?? []).some((u: { uid: string }) => u.uid === uid);
            setInitialFollowing(following);
          } catch { /* フォロー状態取得失敗は無視 */ }
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid, currentUser]);

  if (loading) return <LoadingScreen />;

  if (error || !user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>ユーザーが見つかりません</p>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-block text-sm font-semibold"
          style={{ color: "var(--color-brand-blue)" }}
        >
          ← 戻る
        </button>
      </div>
    );
  }

  // チャートデータ
  const days = eachDayOfInterval({ start: subDays(new Date(), DAYS - 1), end: new Date() });
  const minutesByDay: Record<string, number> = {};
  for (const s of sessions) {
    minutesByDay[s.date] = (minutesByDay[s.date] ?? 0) + s.actualMinutes;
  }
  const totalWeekMinutes = Object.values(minutesByDay).reduce((a, b) => a + b, 0);
  const maxMinutes = Math.max(...Object.values(minutesByDay), 1);

  const subjectMinutes: Record<string, number> = {};
  for (const s of sessions) {
    if (s.subject) {
      subjectMinutes[s.subject] = (subjectMinutes[s.subject] ?? 0) + s.actualMinutes;
    }
  }
  const topSubjects = Object.entries(subjectMinutes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const isMe = currentUser?.uid === uid;

  const level = user.currentLevel ?? 1;
  const tierLabel =
    level <= 15 ? "Bronze" : level <= 30 ? "Silver" : level <= 50 ? "Gold" :
    level <= 70 ? "Platinum" : level <= 85 ? "Diamond" : "Master";
  const tierColor =
    level <= 15 ? "#CD7F32" : level <= 30 ? "#A8A9AD" : level <= 50 ? "#FFD700" :
    level <= 70 ? "#00C9A7" : level <= 85 ? "var(--color-brand-primary)" : "#9B5DE5";

  return (
    <div className="max-w-md mx-auto" style={{ background: "var(--color-bg-secondary)", minHeight: "100vh" }}>

      {/* ── ヘッダーバー ── */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: "var(--color-bg-primary)", borderBottom: "1px solid var(--color-bg-tertiary)" }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: "var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </button>
        <h1 className="font-display font-black text-base" style={{ color: "var(--color-text-primary)" }}>
          {user.name}
        </h1>
        {isMe ? (
          <Link
            href="/settings/profile"
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "var(--color-bg-tertiary)" }}
          >
            <Pencil size={16} style={{ color: "var(--color-text-secondary)" }} />
          </Link>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* ── プロフィールヘッダー ── */}
      <div className="px-5 pt-6 pb-5" style={{ background: "var(--color-bg-primary)" }}>
        <div className="flex items-center gap-5 mb-4">
          <div className="flex-shrink-0">
            <div
              className="rounded-full p-0.5"
              style={{ background: "linear-gradient(135deg, #58CC02, var(--color-brand-primary), #9B5DE5)" }}
            >
              <div className="rounded-full p-0.5" style={{ background: "var(--color-bg-primary)" }}>
                <Avatar
                  name={user.name}
                  avatarType={user.avatarType}
                  avatarUrl={user.avatarUrl}
                  avatarEmoji={user.avatarEmoji}
                  avatarColor={user.avatarColor}
                  size={80}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <p className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
                {user.currentStreak ?? 0}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>ストリーク</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
                {followingCount}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>フォロー</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
                {followersCount + followersAdjust}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>フォロワー</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-black text-base" style={{ color: "var(--color-text-primary)" }}>
              {user.name}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: tierColor + "22", color: tierColor }}
            >
              Lv.{level} {tierLabel}
            </span>
          </div>
          {user.grade && (
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {user.grade}
            </p>
          )}
        </div>

        {isMe ? (
          <Link
            href="/settings/profile"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
            style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" }}
          >
            <Pencil size={14} />
            プロフィールを編集
          </Link>
        ) : (
          <FollowButton
            targetUid={uid}
            initialFollowing={initialFollowing}
            onToggle={(f) => setFollowersAdjust(f ? 1 : -1)}
          />
        )}
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* XP + 今週勉強時間 */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,217,0,0.15)" }}>
              <Star size={18} style={{ color: "var(--color-xp-gold)" }} />
            </div>
            <div>
              <p className="text-lg font-display font-black" style={{ color: "var(--color-text-primary)" }}>
                {(Number.isFinite(user.totalXp) ? user.totalXp : 0).toLocaleString()}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>累計XP</p>
            </div>
          </div>

          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(28,176,246,0.15)" }}>
              <Clock size={18} style={{ color: "var(--color-brand-blue)" }} />
            </div>
            <div>
              <p className="text-lg font-display font-black" style={{ color: "var(--color-text-primary)" }}>
                {totalWeekMinutes >= 60
                  ? `${Math.floor(totalWeekMinutes / 60)}h${totalWeekMinutes % 60}m`
                  : `${totalWeekMinutes}分`}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>今週の勉強</p>
            </div>
          </div>
        </div>

        {/* 7日間チャート */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
              <Flame size={15} style={{ color: "var(--color-streak)" }} />
              過去7日間
            </h3>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              合計 {totalWeekMinutes}分
            </span>
          </div>
          <div className="flex items-end gap-2 h-24">
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const mins = minutesByDay[dateStr] ?? 0;
              const height = maxMinutes > 0 ? (mins / maxMinutes) * 100 : 0;
              const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
              return (
                <div key={dateStr} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex flex-col justify-end" style={{ height: "72px" }}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: mins > 0 ? `${Math.max(height, 8)}%` : "2px",
                        background: isToday ? "var(--color-brand-blue)" : mins > 0 ? "rgba(28,176,246,0.45)" : "var(--color-bg-tertiary)",
                        borderRadius: "6px 6px 0 0",
                      }}
                    />
                  </div>
                  <p className="text-xs font-medium" style={{ color: isToday ? "var(--color-brand-blue)" : "var(--color-text-muted)" }}>
                    {format(day, "E", { locale: ja })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 科目内訳 */}
        {topSubjects.length > 0 && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
          >
            <h3 className="font-bold text-sm flex items-center gap-2 mb-4" style={{ color: "var(--color-text-primary)" }}>
              <BookOpen size={15} style={{ color: "var(--color-brand-purple)" }} />
              今週の科目
            </h3>
            <div className="space-y-3">
              {topSubjects.map(([subject, mins]) => {
                const pct = totalWeekMinutes > 0 ? (mins / totalWeekMinutes) * 100 : 0;
                const color = subjectColor(subject);
                return (
                  <div key={subject}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{subject}</span>
                      <span style={{ color: "var(--color-text-muted)" }}>{mins}分</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: "var(--color-bg-tertiary)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ストリーク */}
        {(user.currentStreak ?? 0) >= 1 && (
          <div
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{
              background: "linear-gradient(135deg, rgba(255,150,0,0.1), rgba(255,75,75,0.08))",
              border: "1px solid rgba(255,150,0,0.25)",
            }}
          >
            <span className="text-3xl">🔥</span>
            <div>
              <p className="font-display font-black text-lg" style={{ color: "var(--color-streak)" }}>
                {user.currentStreak}日連続
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>学習ストリーク継続中！</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
