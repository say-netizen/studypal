"use client";

import { useRef, useState } from "react";
import { Upload, Camera } from "lucide-react";

const EMOJIS = [
  "🦊","🐺","🦅","🐉","🐰","🐻","🦁","🐯",
  "🦋","🐬","🦄","🐸","🐼","🦉","🐨","🐙",
  "🦈","🦒","🐘","🦩",
];

const BG_COLORS = [
  "#FF6B6B","#4ECDC4","#45B7D1","#96CEB4",
  "#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F",
];

type AvatarType = "photo" | "emoji" | "default";

type Props = {
  currentType?: AvatarType;
  currentUrl?: string | null;
  currentEmoji?: string | null;
  currentColor?: string | null;
  onSave: (data: {
    type: AvatarType;
    file?: File;
    emoji?: string;
    color?: string;
  }) => void | Promise<void>;
  saving?: boolean;
};

export function AvatarPicker({
  currentType = "default",
  currentUrl,
  currentEmoji,
  currentColor,
  onSave,
  saving = false,
}: Props) {
  const [tab, setTab] = useState<"photo" | "emoji">(currentType === "emoji" ? "emoji" : "photo");
  const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji ?? EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(currentColor ?? BG_COLORS[0]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("画像は5MB以下にしてください");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleSave() {
    if (tab === "photo") {
      if (selectedFile) {
        onSave({ type: "photo", file: selectedFile });
      } else if (currentType === "photo") {
        onSave({ type: "photo" });
      } else {
        onSave({ type: "default" });
      }
    } else {
      onSave({ type: "emoji", emoji: selectedEmoji, color: selectedColor });
    }
  }

  return (
    <div className="space-y-4">
      {/* タブ */}
      <div className="flex rounded-xl p-1" style={{ background: "var(--color-bg-tertiary)" }}>
        {(["photo", "emoji"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: tab === t ? "var(--color-bg-primary)" : "transparent",
              color: tab === t ? "var(--color-text-primary)" : "var(--color-text-muted)",
              boxShadow: tab === t ? "var(--shadow-sm)" : "none",
            }}
          >
            {t === "photo" ? "📷 写真" : "😊 絵文字"}
          </button>
        ))}
      </div>

      {tab === "photo" && (
        <div className="space-y-3">
          {/* ドロップゾーン */}
          <div
            className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all"
            style={{
              borderColor: dragOver ? "var(--color-brand-blue)" : "var(--color-border)",
              background: dragOver ? "rgba(28,176,246,0.05)" : "var(--color-bg-secondary)",
            }}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="preview"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(28,176,246,0.1)" }}
                >
                  <Camera size={28} style={{ color: "var(--color-brand-blue)" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  写真をドラッグ＆ドロップ
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  または クリックして選択 (最大5MB, JPG/PNG/WEBP)
                </p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {previewUrl && (
            <button
              onClick={() => { setPreviewUrl(null); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="w-full py-2 rounded-xl text-xs font-medium"
              style={{ color: "var(--color-error)", background: "rgba(255,75,75,0.08)" }}
            >
              写真を削除
            </button>
          )}
        </div>
      )}

      {tab === "emoji" && (
        <div className="space-y-4">
          {/* プレビュー */}
          <div className="flex justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ background: selectedColor }}
            >
              {selectedEmoji}
            </div>
          </div>

          {/* 絵文字グリッド */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>
              アイコンを選ぶ
            </p>
            <div className="grid grid-cols-10 gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setSelectedEmoji(e)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xl transition-all"
                  style={{
                    background: selectedEmoji === e ? "rgba(28,176,246,0.15)" : "var(--color-bg-secondary)",
                    border: selectedEmoji === e ? "2px solid var(--color-brand-blue)" : "2px solid transparent",
                    transform: selectedEmoji === e ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* カラー選択 */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>
              背景色を選ぶ
            </p>
            <div className="flex gap-2 flex-wrap">
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    background: c,
                    outline: selectedColor === c ? `3px solid ${c}` : "none",
                    outlineOffset: "2px",
                    transform: selectedColor === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: "var(--color-brand-blue)", boxShadow: "0 4px 12px rgba(28,176,246,0.4)" }}
      >
        {saving ? (
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
        ) : (
          <Upload size={16} />
        )}
        {saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
