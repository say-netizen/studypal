"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Trophy, Medal, Users } from "lucide-react";
import { FollowButton } from "@/components/social/FollowButton";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { format } from "date-fns";

type RankEntry = {
  uid: string;
  nickname: string;
  level: number;
  score: number;
  subject?: string | null;
  scheduledPts?: number;
  freePts?: number;
  streakPts?: number;
  testPts?: number;
};

type FollowingUser = {
  uid: string;
  name: string;
  currentStreak?: number;
  lastStudyDate?: string | null;
  avatarType?: "photo" | "emoji" | "default";
  avatarUrl?: string | null;
  avatarEmoji?: string | null;
  avatarColor?: string | null;
};

type Period = "weekly" | "monthly";
type SubjectFilter = "all" | "国語" | "数学" | "英語" | "理科" | "社会";
type ListMode = "all" | "following";

const SUBJECTS: SubjectFilter[] = ["all", "国語", "数学", "英語", "理科", "社会"];
const SUBJECT_LABELS: Record<SubjectFilter, string> = {
  all: "総合", 国語: "国語", 数学: "数学", 英語: "英語", 理科: "理科", 社会: "社会",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return (
    <span
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
      style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-muted)" }}
    >
      {rank}
    </span>
  );
}

function ScoreBreakdown({ entry }: { entry: RankEntry }) {
  const items = [
    { icon: "📅", label: "予定通り勉強", pts: entry.scheduledPts ?? 0 },
    { icon: "⚡", label: "ストリーク", pts: entry.streakPts ?? 0 },
    { icon: "📝", label: "テスト登録", pts: entry.testPts ?? 0 },
    { icon: "📖", label: "自由学習", pts: entry.freePts ?? 0 },
  ].filter((i) => i.pts > 0);

  if (items.length === 0) return null;

  return (
    <div
      className="mt-3 p-3 rounded-xl space-y-1"
      style={{ background: "rgba(28,176,246,0.06)", border: "1px solid rgba(28,176,246,0.12)" }}
    >
      <p className="text-xs font-bold mb-2" style={{ color: "var(--color-brand-blue)" }}>
        スコア内訳
      </p>
      {items.map((item) => (
        <div key={item.label} className="flex justify-between text-xs">
          <span style={{ color: "var(--color-text-secondary)" }}>
            {item.icon} {item.label}
          </span>
          <span className="font-semibold" style={{ color: "var(--color-brand-blue)" }}>
            {item.pts.toLocaleString()}pt
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RankingPage() {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState<Period>("weekly");
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [listMode, setListMode] = useState<ListMode>("all");
  const [entries, setEntries] = useState<RankEntry[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [showMyBreakdown, setShowMyBreakdown] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const loadFollowing = useCallback(async () => {
    if (!currentUser) return;
    const res = await fetch(`/api/follows?uid=${currentUser.uid}&type=following`);
    const data = await res.json();
    const users: FollowingUser[] = data.users ?? [];
    setFollowingIds(new Set(users.map((u) => u.uid)));
    setFollowingUsers(users);
  }, [currentUser]);

  const loadRanking = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (subject !== "all") params.set("subject", subject);
      const res = await fetch(`/api/ranking?${params}`);
      const data = await res.json();
      let list: RankEntry[] = data.entries ?? [];
      if (listMode === "following") {
        list = list.filter((e) => followingIds.has(e.uid) || e.uid === currentUser?.uid);
      }
      setEntries(list);
      if (currentUser) {
        const idx = list.findIndex((e) => e.uid === currentUser.uid);
        setMyRank(idx >= 0 ? idx + 1 : null);
      }
    } finally {
      setLoading(false);
    }
  }, [period, subject, listMode, followingIds, currentUser]);

  useEffect(() => {
    loadFollowing();
  }, [loadFollowing]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  const myEntry = entries.find((e) => e.uid === currentUser?.uid);

  // 今日勉強したフォロー中ユーザー
  const studyingToday = followingUsers.filter((u) => u.lastStudyDate === today);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Trophy size={24} style={{ color: "var(--color-xp-gold)" }} />
        <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          ランキング
        </h1>
      </div>

      {/* 今日勉強中のフォロー */}
      {studyingToday.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: "var(--color-bg-primary)",
            border: "1px solid var(--color-bg-tertiary)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <p className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: "var(--color-brand-green)" }}>
            <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--color-brand-green)" }} />
            今日勉強したフォロー中 {studyingToday.length}人
          </p>
          <div className="flex gap-4 overflow-x-auto pb-1">
            {studyingToday.map((u) => (
              <Link
                key={u.uid}
                href={`/profile/${u.uid}`}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              >
                <div className="relative">
                  <div
                    className="rounded-full p-0.5"
                    style={{ background: "linear-gradient(135deg, #58CC02, var(--color-brand-primary))" }}
                  >
                    <div
                      className="rounded-full p-0.5"
                      style={{ background: "var(--color-bg-primary)" }}
                    >
                      <Avatar
                        name={u.name}
                        avatarType={u.avatarType}
                        avatarUrl={u.avatarUrl}
                        avatarEmoji={u.avatarEmoji}
                        avatarColor={u.avatarColor}
                        size={48}
                      />
                    </div>
                  </div>
                  {(u.currentStreak ?? 0) >= 3 && (
                    <span className="absolute -bottom-1 -right-1 text-sm">🔥</span>
                  )}
                </div>
                <p
                  className="text-xs font-semibold text-center max-w-[56px] truncate group-hover:opacity-70 transition-opacity"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {u.name}
                </p>
                {(u.currentStreak ?? 0) >= 1 && (
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {u.currentStreak}日
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 自分の順位ハイライト */}
      {myRank !== null && !loading && myEntry && (
        <div
          className="p-4 rounded-2xl cursor-pointer"
          style={{
            background: "linear-gradient(135deg, rgba(28,176,246,0.1), rgba(155,93,229,0.1))",
            border: "1px solid rgba(28,176,246,0.25)",
          }}
          onClick={() => setShowMyBreakdown((v) => !v)}
        >
          <div className="flex items-center gap-4">
            <Medal size={20} style={{ color: "var(--color-brand-blue)" }} />
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>
                あなたの順位
              </p>
              <p className="text-2xl font-display font-black" style={{ color: "var(--color-brand-blue)" }}>
                {myRank}位
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>スコア</p>
              <p className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>
                {myEntry.score?.toLocaleString() ?? 0}pt
              </p>
            </div>
          </div>
          {showMyBreakdown && <ScoreBreakdown entry={myEntry} />}
          <p className="text-xs mt-2 text-center" style={{ color: "var(--color-text-muted)" }}>
            {showMyBreakdown ? "▲ 閉じる" : "▼ スコア内訳を見る"}
          </p>
        </div>
      )}

      {/* タブ: 表示モード */}
      <div className="flex rounded-xl p-1" style={{ background: "var(--color-bg-tertiary)" }}>
        {([["all", "全体"], ["following", "フォロー中"]] as [ListMode, string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setListMode(m)}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5"
            style={{
              background: listMode === m ? "var(--color-bg-primary)" : "transparent",
              color: listMode === m ? "var(--color-text-primary)" : "var(--color-text-muted)",
              boxShadow: listMode === m ? "var(--shadow-sm)" : "none",
            }}
          >
            {m === "following" && <Users size={13} />}
            {label}
          </button>
        ))}
      </div>

      {/* タブ: 期間 */}
      <div className="flex rounded-xl p-1" style={{ background: "var(--color-bg-tertiary)" }}>
        {(["weekly", "monthly"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: period === p ? "var(--color-bg-primary)" : "transparent",
              color: period === p ? "var(--color-text-primary)" : "var(--color-text-muted)",
              boxShadow: period === p ? "var(--shadow-sm)" : "none",
            }}
          >
            {p === "weekly" ? "週間" : "月間"}
          </button>
        ))}
      </div>

      {/* タブ: 科目 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-all"
            style={{
              background: subject === s ? "var(--color-brand-blue)" : "rgba(28,176,246,0.1)",
              color: subject === s ? "#fff" : "var(--color-brand-blue)",
            }}
          >
            {SUBJECT_LABELS[s]}
          </button>
        ))}
      </div>

      {/* ランキングリスト */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-bg-primary)",
          border: "1px solid var(--color-bg-tertiary)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-6 h-6 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "var(--color-brand-blue)" }}
            />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">{listMode === "following" ? "👥" : "🏆"}</p>
            <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>
              {listMode === "following" ? "フォロー中のユーザーがいません" : "まだランキングデータがありません"}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              {listMode === "following" ? "友達をフォローしよう！" : "勉強してスコアを獲得しよう！"}
            </p>
          </div>
        ) : (
          entries.slice(0, 50).map((entry, idx) => {
            const rank = idx + 1;
            const isMe = entry.uid === currentUser?.uid;
            const isFollowingUser = followingIds.has(entry.uid);
            return (
              <div
                key={entry.uid}
                className="flex items-center gap-3 px-4 py-3.5 border-b last:border-b-0"
                style={{
                  borderColor: "var(--color-bg-tertiary)",
                  background: isMe
                    ? "rgba(28,176,246,0.06)"
                    : rank === 1
                    ? "rgba(255,217,0,0.04)"
                    : "transparent",
                }}
              >
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  <RankBadge rank={rank} />
                </div>

                <Link href={`/profile/${entry.uid}`} className="flex-shrink-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      background: rank === 1 ? "var(--color-xp-gold)"
                        : rank === 2 ? "#C0C0C0"
                        : rank === 3 ? "#CD7F32"
                        : isMe ? "var(--color-brand-blue)"
                        : "var(--color-bg-tertiary)",
                    }}
                  >
                    <span style={{ color: rank <= 3 || isMe ? "#fff" : "var(--color-text-secondary)" }}>
                      {entry.nickname[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${entry.uid}`}>
                    <p
                      className="font-semibold text-sm truncate hover:underline"
                      style={{ color: isMe ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}
                    >
                      {entry.nickname}
                      {isMe && (
                        <span
                          className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(28,176,246,0.15)", color: "var(--color-brand-blue)" }}
                        >
                          あなた
                        </span>
                      )}
                    </p>
                  </Link>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Lv.{entry.level}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {!isMe && (
                    <FollowButton
                      targetUid={entry.uid}
                      initialFollowing={isFollowingUser}
                      size="sm"
                      onToggle={(f) => {
                        setFollowingIds((prev) => {
                          const next = new Set(prev);
                          if (f) { next.add(entry.uid); } else { next.delete(entry.uid); }
                          return next;
                        });
                      }}
                    />
                  )}
                  <div className="text-right">
                    <p
                      className="font-black font-display text-base"
                      style={{
                        color: rank === 1 ? "var(--color-xp-gold)"
                          : isMe ? "var(--color-brand-blue)"
                          : "var(--color-text-primary)",
                      }}
                    >
                      {entry.score?.toLocaleString() ?? 0}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>pt</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* スコアの計算方法 */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(28,176,246,0.06)", border: "1px solid rgba(28,176,246,0.15)" }}
      >
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-brand-blue)" }}>
          スコアの計算方法
        </p>
        <div className="space-y-1">
          {[
            { label: "📅 予定通り勉強", value: "10pt / 分" },
            { label: "📖 自由学習", value: "5pt / 分" },
            { label: "⚡ ストリーク継続", value: "20pt / 日" },
            { label: "📝 テスト登録", value: "5pt / 件" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-xs">
              <span style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
              <span className="font-semibold" style={{ color: "var(--color-brand-blue)" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
