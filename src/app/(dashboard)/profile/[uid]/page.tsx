"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getUser,
  getStudySessionRange,
  getFollowing,
  getFollowers,
  isFollowing,
  type UserDoc,
  type StudySessionDoc,
} from "@/lib/firebase/schema";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/social/FollowButton";
import { ArrowLeft, Users, Flame, Star, Clock } from "lucide-react";
import Link from "next/link";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ja } from "date-fns/locale";

const DAYS = 7;

export default function ProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const { currentUser } = useAuth();

  const [user, setUser] = useState<(UserDoc & { id: string }) | null>(null);
  const [sessions, setSessions] = useState<(StudySessionDoc & { id: string })[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [initialFollowing, setInitialFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const endDate = format(new Date(), "yyyy-MM-dd");
    const startDate = format(subDays(new Date(), DAYS - 1), "yyyy-MM-dd");

    async function load() {
      try {
        const [userData, sessionData, followingList, followerList] = await Promise.all([
          getUser(uid),
          getStudySessionRange(uid, startDate, endDate),
          getFollowing(uid),
          getFollowers(uid),
        ]);
        setUser(userData);
        setSessions(sessionData as (StudySessionDoc & { id: string })[]);
        setFollowingCount(followingList.length);
        setFollowersCount(followerList.length);

        if (currentUser && currentUser.uid !== uid) {
          const following = await isFollowing(currentUser.uid, uid);
          setInitialFollowing(following);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [uid, currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--color-brand-blue)" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p style={{ color: "var(--color-text-muted)" }}>ユーザーが見つかりません</p>
        <Link href="/ranking" className="mt-4 inline-block text-sm font-semibold" style={{ color: "var(--color-brand-blue)" }}>
          ランキングに戻る
        </Link>
      </div>
    );
  }

  // 週間勉強時間グラフデータ
  const days = eachDayOfInterval({ start: subDays(new Date(), DAYS - 1), end: new Date() });
  const minutesByDay: Record<string, number> = {};
  for (const s of sessions) {
    minutesByDay[s.date] = (minutesByDay[s.date] ?? 0) + s.actualMinutes;
  }
  const maxMinutes = Math.max(...Object.values(minutesByDay), 1);

  const isMe = currentUser?.uid === uid;

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link
          href="/ranking"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <h1 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          プロフィール
        </h1>
      </div>

      {/* プロフィールカード */}
      <div
        className="rounded-2xl p-6 flex flex-col items-center gap-4"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
      >
        <Avatar
          name={user.name}
          avatarType={user.avatarType}
          avatarUrl={user.avatarUrl}
          avatarEmoji={user.avatarEmoji}
          avatarColor={user.avatarColor}
          size={72}
        />
        <div className="text-center">
          <h2 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
            {user.name}
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {user.grade ?? ""} · Lv.{user.currentLevel}
          </p>
        </div>

        {/* フォロー/フォロワー数 */}
        <div className="flex gap-8">
          <div className="text-center">
            <p className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
              {followingCount}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>フォロー中</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
              {followersCount}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>フォロワー</p>
          </div>
        </div>

        {/* フォローボタン or 設定リンク */}
        {isMe ? (
          <Link
            href="/settings/profile"
            className="px-6 py-2.5 rounded-pill text-sm font-bold transition-all hover:opacity-80"
            style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" }}
          >
            プロフィールを編集
          </Link>
        ) : (
          <FollowButton targetUid={uid} initialFollowing={initialFollowing} />
        )}
      </div>

      {/* ステータスカード */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Star size={16} />, label: "累計XP", value: user.totalXp.toLocaleString(), color: "var(--color-xp-gold)" },
          { icon: <Flame size={16} />, label: "ストリーク", value: `${user.currentStreak}日`, color: "var(--color-streak)" },
          { icon: <Clock size={16} />, label: "今週勉強", value: `${Object.values(minutesByDay).reduce((a, b) => a + b, 0)}分`, color: "var(--color-brand-blue)" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl p-3 text-center"
            style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
          >
            <div className="flex items-center justify-center mb-1" style={{ color: item.color }}>
              {item.icon}
            </div>
            <p className="text-base font-display font-black" style={{ color: "var(--color-text-primary)" }}>
              {item.value}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* 週間勉強時間グラフ */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} style={{ color: "var(--color-brand-blue)" }} />
          <h3 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>
            過去7日間の勉強時間
          </h3>
        </div>
        <div className="flex items-end gap-1.5 h-24">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const mins = minutesByDay[dateStr] ?? 0;
            const height = maxMinutes > 0 ? (mins / maxMinutes) * 100 : 0;
            const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
            return (
              <div key={dateStr} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${Math.max(height, mins > 0 ? 4 : 0)}%`,
                      background: isToday ? "var(--color-brand-blue)" : "rgba(28,176,246,0.4)",
                      minHeight: mins > 0 ? "4px" : "0",
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: isToday ? "var(--color-brand-blue)" : "var(--color-text-muted)" }}>
                  {format(day, "E", { locale: ja })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
