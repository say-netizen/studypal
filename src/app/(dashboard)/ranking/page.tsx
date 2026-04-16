"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Trophy, Medal } from "lucide-react";

type RankEntry = {
  uid: string;
  nickname: string;
  level: number;
  score: number;
  subject?: string | null;
};

type Period = "weekly" | "monthly";
type SubjectFilter = "all" | "国語" | "数学" | "英語" | "理科" | "社会";

const SUBJECTS: SubjectFilter[] = ["all", "国語", "数学", "英語", "理科", "社会"];
const SUBJECT_LABELS: Record<SubjectFilter, string> = {
  all: "総合",
  国語: "国語",
  数学: "数学",
  英語: "英語",
  理科: "理科",
  社会: "社会",
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

export default function RankingPage() {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState<Period>("weekly");
  const [subject, setSubject] = useState<SubjectFilter>("all");
  const [entries, setEntries] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  async function loadRanking() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (subject !== "all") params.set("subject", subject);
      const res = await fetch(`/api/ranking?${params}`);
      const data = await res.json();
      const list: RankEntry[] = data.entries ?? [];
      setEntries(list);
      if (currentUser) {
        const idx = list.findIndex((e) => e.uid === currentUser.uid);
        setMyRank(idx >= 0 ? idx + 1 : null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, subject, currentUser]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Trophy size={24} style={{ color: "var(--color-xp-gold)" }} />
        <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          ランキング
        </h1>
      </div>

      {/* 自分の順位ハイライト */}
      {myRank !== null && !loading && (
        <div
          className="flex items-center gap-4 p-4 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(28,176,246,0.1), rgba(155,93,229,0.1))",
            border: "1px solid rgba(28,176,246,0.25)",
          }}
        >
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
              {entries[myRank - 1]?.score?.toLocaleString() ?? 0}pt
            </p>
          </div>
        </div>
      )}

      {/* タブ: 期間 */}
      <div
        className="flex rounded-xl p-1"
        style={{ background: "var(--color-bg-tertiary)" }}
      >
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
              background:
                subject === s ? "var(--color-brand-blue)" : "rgba(28,176,246,0.1)",
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
            <p className="text-4xl mb-3">🏆</p>
            <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>
              まだランキングデータがありません
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              問題を解いてスコアを獲得しよう！
            </p>
          </div>
        ) : (
          entries.slice(0, 50).map((entry, idx) => {
            const rank = idx + 1;
            const isMe = entry.uid === currentUser?.uid;
            return (
              <div
                key={entry.uid}
                className="flex items-center gap-3 px-4 py-3.5 border-b last:border-b-0 transition-colors"
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

                {/* アバター */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{
                    background:
                      rank === 1
                        ? "var(--color-xp-gold)"
                        : rank === 2
                        ? "#C0C0C0"
                        : rank === 3
                        ? "#CD7F32"
                        : isMe
                        ? "var(--color-brand-blue)"
                        : "var(--color-bg-tertiary)",
                    color:
                      rank <= 3 || isMe
                        ? "#fff"
                        : "var(--color-text-secondary)",
                  }}
                >
                  {entry.nickname[0]?.toUpperCase() ?? "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{
                      color: isMe
                        ? "var(--color-brand-blue)"
                        : "var(--color-text-primary)",
                    }}
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
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Lv.{entry.level}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className="font-black font-display text-base"
                    style={{
                      color:
                        rank === 1
                          ? "var(--color-xp-gold)"
                          : isMe
                          ? "var(--color-brand-blue)"
                          : "var(--color-text-primary)",
                    }}
                  >
                    {entry.score?.toLocaleString() ?? 0}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    pt
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* スコアの説明 */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(28,176,246,0.06)", border: "1px solid rgba(28,176,246,0.15)" }}
      >
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-brand-blue)" }}>
          スコアの計算方法
        </p>
        <div className="space-y-1">
          {[
            { label: "勉強時間", value: "1pt / 分" },
            { label: "問題正解", value: "10pt / 問" },
            { label: "ストリーク", value: "20pt / 日" },
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
