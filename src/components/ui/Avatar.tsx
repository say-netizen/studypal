type AvatarProps = {
  name?: string;
  src?: string;
  size?: number;
  color?: string;
  avatarType?: "photo" | "emoji" | "default";
  avatarUrl?: string | null;
  avatarEmoji?: string | null;
  avatarColor?: string | null;
};

const GRADIENT_COLORS = [
  "linear-gradient(135deg,#1CB0F6,#9B5DE5)",
  "linear-gradient(135deg,#58CC02,#00C9A7)",
  "linear-gradient(135deg,#FFD700,#FF9600)",
  "linear-gradient(135deg,#FF6BB3,#FF9600)",
  "linear-gradient(135deg,#9B5DE5,#1CB0F6)",
];

function getGradient(name: string) {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
}

export function Avatar({
  name = "?",
  src,
  size = 40,
  color,
  avatarType,
  avatarUrl,
  avatarEmoji,
  avatarColor,
}: AvatarProps) {
  const initial = name[0]?.toUpperCase() ?? "?";

  // 写真アバター
  if (avatarType === "photo" && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }

  // 絵文字アバター
  if (avatarType === "emoji" && avatarEmoji) {
    return (
      <div
        aria-label={name}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          background: avatarColor ?? "#1CB0F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: `${size * 0.5}px`,
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        {avatarEmoji}
      </div>
    );
  }

  // 旧来の src 対応
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }

  // デフォルト: 頭文字 + グラデーション
  const bg = color ?? getGradient(name);
  return (
    <div
      aria-label={name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${size * 0.38}px`,
        fontWeight: 800,
        color: "#fff",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {initial}
    </div>
  );
}
