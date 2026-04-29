"use client";

import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";

type Variant = "primary" | "success" | "ghost" | "ghost-white";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, { bg: string; color: string; border?: string; shadow?: string }> = {
  primary: {
    bg: "var(--color-brand-primary)",
    color: "#fff",
    shadow: "0 4px 15px rgba(160,82,45,0.4)",
  },
  success: {
    bg: "var(--color-brand-green)",
    color: "#fff",
    shadow: "0 4px 15px rgba(88,204,2,0.4)",
  },
  ghost: {
    bg: "transparent",
    color: "var(--color-text-secondary)",
    border: "2px solid var(--color-border)",
  },
  "ghost-white": {
    bg: "transparent",
    color: "#fff",
    border: "2px solid rgba(255,255,255,0.4)",
  },
};

const SIZES: Record<Size, { padding: string; fontSize: string }> = {
  sm: { padding: "8px 18px", fontSize: "0.875rem" },
  md: { padding: "10px 22px", fontSize: "0.9375rem" },
  lg: { padding: "14px 32px", fontSize: "1.0625rem" },
};

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

type AnchorProps = {
  variant?: Variant;
  size?: Size;
  href: string;
  className?: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

function getStyle(variant: Variant, size: Size) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  return {
    background: v.bg,
    color: v.color,
    border: v.border ?? "none",
    boxShadow: v.shadow,
    padding: s.padding,
    fontSize: s.fontSize,
    borderRadius: "var(--radius-pill)",
    fontFamily: "var(--font-ui)",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-2)",
    cursor: "pointer",
    transition: "transform 120ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 120ms ease",
    whiteSpace: "nowrap" as const,
  };
}

export function Button({ variant = "primary", size = "md", children, style, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{ ...getStyle(variant, size), ...style }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; props.onMouseEnter?.(e); }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = ""; props.onMouseLeave?.(e); }}
      onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(1px)"; props.onMouseDown?.(e); }}
      onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; props.onMouseUp?.(e); }}
    >
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "primary", size = "md", children, style, ...props }: AnchorProps) {
  return (
    <a
      {...props}
      style={{ textDecoration: "none", ...getStyle(variant, size), ...style }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; }}
    >
      {children}
    </a>
  );
}
