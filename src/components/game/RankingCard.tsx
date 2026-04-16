import { Avatar } from "@/components/ui/Avatar";

type RankingEntry = {
  uid: string;
  nickname: string;
  score: number;
  level: number;
  subject?: string | null;
};

type RankingCardProps = {
  entries: RankingEntry[];
  currentUid?: string;
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: "1.25rem" }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: "1.25rem" }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: "1.25rem" }}>🥉</span>;
  return (
    <span
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        background: "var(--color-bg-tertiary)",
        color: "var(--color-text-muted)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.75rem",
        fontWeight: 900,
      }}
    >
      {rank}
    </span>
  );
}

export function RankingCard({ entries, currentUid }: RankingCardProps) {
  return (
    <div
      style={{
        background: "var(--color-bg-primary)",
        border: "1px solid var(--color-bg-tertiary)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 16px" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🏆</p>
          <p style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>まだランキングデータがありません</p>
          <p style={{ fontSize: "0.875rem", marginTop: "4px", color: "var(--color-text-muted)" }}>問題を解いてスコアを獲得しよう！</p>
        </div>
      ) : (
        entries.map((entry, idx) => {
          const rank = idx + 1;
          const isMe = entry.uid === currentUid;
          const avatarColor =
            rank === 1 ? "linear-gradient(135deg,#FFD700,#FFA500)"
            : rank === 2 ? "linear-gradient(135deg,#C0C0C0,#808080)"
            : rank === 3 ? "linear-gradient(135deg,#CD7F32,#A0522D)"
            : isMe ? "linear-gradient(135deg,#1CB0F6,#9B5DE5)"
            : undefined;

          return (
            <div
              key={entry.uid}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderBottom: "1px solid var(--color-bg-tertiary)",
                background: isMe
                  ? "rgba(28,176,246,0.06)"
                  : rank === 1
                  ? "rgba(255,217,0,0.04)"
                  : "transparent",
                transition: "background 150ms",
              }}
            >
              {/* 順位 */}
              <div style={{ width: "32px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <RankBadge rank={rank} />
              </div>

              {/* アバター */}
              <Avatar name={entry.nickname} size={36} color={avatarColor} />

              {/* 名前・レベル */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: isMe ? "var(--color-brand-blue)" : "var(--color-text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.nickname}
                  {isMe && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "0.75rem",
                        padding: "1px 8px",
                        borderRadius: "var(--radius-pill)",
                        background: "rgba(28,176,246,0.15)",
                        color: "var(--color-brand-blue)",
                        fontWeight: 700,
                      }}
                    >
                      あなた
                    </span>
                  )}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Lv.{entry.level}</p>
              </div>

              {/* スコア */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: "1rem",
                    color: rank === 1 ? "var(--color-xp-gold)" : isMe ? "var(--color-brand-blue)" : "var(--color-text-primary)",
                  }}
                >
                  {entry.score.toLocaleString()}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>pt</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
