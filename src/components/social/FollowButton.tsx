"use client";

import { useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

type Props = {
  targetUid: string;
  initialFollowing?: boolean;
  size?: "sm" | "md";
  onToggle?: (following: boolean) => void;
};

export function FollowButton({ targetUid, initialFollowing = false, size = "md", onToggle }: Props) {
  const { currentUser } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (!currentUser || currentUser.uid === targetUid) return null;

  async function toggle() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      if (following) {
        await fetch("/api/follows", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ followingId: targetUid }),
        });
        setFollowing(false);
        onToggle?.(false);
      } else {
        await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ followingId: targetUid }),
        });
        setFollowing(true);
        onToggle?.(true);
      }
    } finally {
      setLoading(false);
    }
  }

  const isSmall = size === "sm";

  if (following) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className="flex items-center gap-1 rounded-pill font-semibold transition-all hover:opacity-80 disabled:opacity-50"
        style={{
          padding: isSmall ? "4px 10px" : "6px 14px",
          fontSize: isSmall ? "0.7rem" : "0.8rem",
          background: "rgba(88,204,2,0.12)",
          color: "var(--color-brand-green)",
          border: "1px solid rgba(88,204,2,0.3)",
        }}
      >
        {loading ? <Loader2 size={isSmall ? 11 : 13} className="animate-spin" /> : <UserCheck size={isSmall ? 11 : 13} />}
        フォロー中
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-1 rounded-pill font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50"
      style={{
        padding: isSmall ? "4px 10px" : "6px 14px",
        fontSize: isSmall ? "0.7rem" : "0.8rem",
        background: "var(--color-brand-blue)",
        color: "#fff",
        boxShadow: "0 2px 8px rgba(28,176,246,0.35)",
      }}
    >
      {loading ? <Loader2 size={isSmall ? 11 : 13} className="animate-spin" /> : <UserPlus size={isSmall ? 11 : 13} />}
      フォロー
    </button>
  );
}
