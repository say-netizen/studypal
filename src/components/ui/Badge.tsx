import { type HTMLAttributes } from "react";

type BadgeStatus = "in-progress" | "completed" | "locked" | "new" | "ai";

const STATUS_STYLES: Record<BadgeStatus, { bg: string; color: string; border: string }> = {
  "in-progress": {
    bg: "rgba(28,176,246,0.15)",
    color: "var(--color-brand-blue)",
    border: "1px solid rgba(28,176,246,0.3)",
  },
  completed: {
    bg: "rgba(88,204,2,0.15)",
    color: "var(--color-brand-green)",
    border: "1px solid rgba(88,204,2,0.3)",
  },
  locked: {
    bg: "rgba(156,163,175,0.15)",
    color: "var(--color-text-muted)",
    border: "1px solid rgba(156,163,175,0.3)",
  },
  new: {
    bg: "rgba(255,150,0,0.15)",
    color: "var(--color-warning)",
    border: "1px solid rgba(255,150,0,0.3)",
  },
  ai: {
    bg: "linear-gradient(135deg,#9B5DE5,#1CB0F6)",
    color: "#fff",
    border: "none",
  },
};

type BadgeProps = {
  status?: BadgeStatus;
  icon?: React.ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

export function Badge({ status = "in-progress", icon, children, style, ...props }: BadgeProps) {
  const s = STATUS_STYLES[status];
  return (
    <span
      {...props}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: s.bg,
        color: s.color,
        border: s.border,
        borderRadius: "var(--radius-pill)",
        padding: "2px 10px",
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}
