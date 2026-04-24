"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUser, upsertUser } from "@/lib/firebase/schema";
import { storage, auth } from "@/lib/firebase/client";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { Avatar } from "@/components/ui/Avatar";
import { GRADES, GRADE_STAGES } from "@/lib/gamification/grades";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfileSettingsPage() {
  const { currentUser } = useAuth();
  const [name, setName] = useState<string>("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [grade, setGrade] = useState<string>("");
  const [gradeSaving, setGradeSaving] = useState(false);
  const [gradeSaved, setGradeSaved] = useState(false);

  const [userData, setUserData] = useState<{
    name: string;
    grade?: string | null;
    avatarType?: "photo" | "emoji" | "default";
    avatarUrl?: string | null;
    avatarEmoji?: string | null;
    avatarColor?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    getUser(currentUser.uid).then((u) => {
      if (u) {
        setUserData(u);
        setName(u.name ?? "");
        setGrade(u.grade ?? "");
      }
      setLoading(false);
    });
  }, [currentUser]);

  async function handleSave(data: {
    type: "photo" | "emoji" | "default";
    file?: File;
    emoji?: string;
    color?: string;
  }) {
    if (!currentUser) return;
    setSaving(true);
    try {
      let avatarUrl: string | null = userData?.avatarUrl ?? null;

      if (data.type === "photo" && data.file) {
        // Firebase Storage にアップロード
        const storageRef = ref(storage(), `avatars/${currentUser.uid}/profile.jpg`);
        // 画像をcanvasでリサイズ
        const resized = await resizeImage(data.file, 256);
        await uploadBytes(storageRef, resized, { contentType: "image/jpeg" });
        avatarUrl = await getDownloadURL(storageRef);
      }

      const update: Record<string, unknown> = { avatarType: data.type };
      if (data.type === "photo") {
        update.avatarUrl = avatarUrl;
        update.avatarEmoji = null;
        update.avatarColor = null;
      } else if (data.type === "emoji") {
        update.avatarEmoji = data.emoji ?? null;
        update.avatarColor = data.color ?? null;
        update.avatarUrl = null;
      } else {
        update.avatarUrl = null;
        update.avatarEmoji = null;
        update.avatarColor = null;
      }

      await upsertUser(currentUser.uid, update as Parameters<typeof upsertUser>[1]);
      setUserData((prev) => prev ? { ...prev, ...update } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleNameSave() {
    if (!currentUser || !name.trim() || nameSaving) return;
    setNameSaving(true);
    try {
      await upsertUser(currentUser.uid, { name: name.trim() });
      await updateProfile(auth().currentUser!, { displayName: name.trim() });
      setUserData((prev) => prev ? { ...prev, name: name.trim() } : prev);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } finally {
      setNameSaving(false);
    }
  }

  async function handleGradeSave() {
    if (!currentUser || !grade || gradeSaving) return;
    setGradeSaving(true);
    try {
      await upsertUser(currentUser.uid, { grade });
      setGradeSaved(true);
      setTimeout(() => setGradeSaved(false), 2000);
    } finally {
      setGradeSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--color-brand-blue)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <h1 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          プロフィール設定
        </h1>
      </div>

      {/* 現在のアバタープレビュー */}
      <div className="flex flex-col items-center gap-3 py-4">
        <Avatar
          name={userData?.name ?? currentUser?.displayName ?? "?"}
          avatarType={userData?.avatarType}
          avatarUrl={userData?.avatarUrl}
          avatarEmoji={userData?.avatarEmoji}
          avatarColor={userData?.avatarColor}
          size={80}
        />
        <p className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>
          {userData?.name ?? currentUser?.displayName ?? "ユーザー"}
        </p>
      </div>

      {/* 保存成功通知 */}
      {saved && (
        <div
          className="p-3 rounded-xl text-center text-sm font-semibold"
          style={{ background: "rgba(88,204,2,0.1)", color: "var(--color-brand-green)" }}
        >
          ✓ 保存しました！
        </div>
      )}

      {/* 名前変更 */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>ニックネーム</h2>
        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          ランキングやプロフィールに表示される名前です
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          placeholder="ニックネームを入力"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all mb-3"
          style={{
            background: "var(--color-bg-secondary)",
            border: "2px solid var(--color-bg-tertiary)",
            color: "var(--color-text-primary)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
        />
        <button
          onClick={handleNameSave}
          disabled={nameSaving || !name.trim() || name.trim() === userData?.name}
          className="w-full py-2.5 rounded-pill text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: "var(--color-brand-blue)" }}
        >
          {nameSaving ? "保存中..." : nameSaved ? "✓ 保存しました" : "名前を保存"}
        </button>
      </div>

      {/* 学年変更 */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>学年</h2>
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
          学年によってレベルアップに必要なXPが変わります
        </p>
        {GRADE_STAGES.map((stage) => (
          <div key={stage} className="mb-2">
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>{stage}</p>
            <div className="flex gap-1.5">
              {GRADES.filter((g) => g.stage === stage).map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGrade(g.value)}
                  className="flex-1 rounded-xl py-2 text-xs font-semibold transition-all"
                  style={{
                    background: grade === g.value ? "var(--color-brand-blue)" : "var(--color-bg-secondary)",
                    color: grade === g.value ? "#fff" : "var(--color-text-secondary)",
                    border: grade === g.value ? "2px solid var(--color-brand-blue)" : "2px solid transparent",
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={handleGradeSave}
          disabled={gradeSaving || !grade || grade === userData?.grade}
          className="mt-3 w-full py-2.5 rounded-pill text-sm font-bold text-white transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: "var(--color-brand-blue)" }}
        >
          {gradeSaving ? "保存中..." : gradeSaved ? "✓ 保存しました" : "学年を保存"}
        </button>
      </div>

      {/* AvatarPicker */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
          アイコンを変更
        </h2>
        <AvatarPicker
          currentType={userData?.avatarType}
          currentUrl={userData?.avatarUrl}
          currentEmoji={userData?.avatarEmoji}
          currentColor={userData?.avatarColor}
          onSave={handleSave}
          saving={saving}
        />
      </div>
    </div>
  );
}

async function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = maxSize;
      canvas.height = maxSize;
      const ctx = canvas.getContext("2d")!;
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85);
    };
    img.src = url;
  });
}
