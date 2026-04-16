import { type HTMLAttributes } from "react";

type CardVariant = "default" | "achievement" | "hover";

type CardProps = {
  variant?: CardVariant;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

const VARIANT_STYLES: Record<CardVariant, React.CSSProperties> = {
  default: {
    background: "var(--color-bg-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-xl)",
    padding: "var(--space-6)",
    boxShadow: "var(--shadow-md)",
  },
  achievement: {
    background: "linear-gradient(135deg, rgba(28,176,246,0.1), rgba(155,93,229,0.1))",
    border: "1px solid rgba(28,176,246,0.25)",
    borderRadius: "var(--radius-xl)",
    padding: "var(--space-6)",
    boxShadow: "var(--shadow-brand-blue)",
  },
  hover: {
    background: "var(--color-bg-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-xl)",
    padding: "var(--space-6)",
    boxShadow: "var(--shadow-md)",
    cursor: "pointer",
    transition: "transform 200ms ease, box-shadow 200ms ease",
  },
};

export function Card({ variant = "default", children, style, onMouseEnter, onMouseLeave, ...props }: CardProps) {
  const isHover = variant === "hover";

  return (
    <div
      {...props}
      style={{ ...VARIANT_STYLES[variant], ...style }}
      onMouseEnter={(e) => {
        if (isHover) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "var(--shadow-lg)";
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (isHover) {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
        }
        onMouseLeave?.(e);
      }}
    >
      {children}
    </div>
  );
}
