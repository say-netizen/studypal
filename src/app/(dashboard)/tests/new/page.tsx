"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { createTest } from "@/lib/firebase/schema";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { Timestamp } from "firebase/firestore";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import Link from "next/link";

const SUBJECTS = ["国語", "数学", "英語", "理科", "社会"];

const SUBJECT_COLORS: Record<string, string> = {
  国語: "#9B5DE5",
  数学: "#1CB0F6",
  英語: "#58CC02",
  理科: "#00C9A7",
  社会: "#FF9600",
};

export default function NewTestPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [subject, setSubject] = useState("");
  const [testDate, setTestDate] = useState("");
  const [range, setRange] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const total = files.length + selected.length;
    if (total > 5) {
      setError("ファイルは最大5つまでアップロードできます");
      return;
    }
    const oversized = selected.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      setError("各ファイルは10MB以下にしてください");
      return;
    }
    setError("");
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadFiles(): Promise<string[]> {
    if (!currentUser || files.length === 0) return [];
    const urls: string[] = [];
    for (const file of files) {
      const path = `tests/${currentUser.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage(), path);
      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, file);
        task.on("state_changed", null, reject, async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          urls.push(url);
          resolve();
        });
      });
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    if (!subject) { setError("科目を選択してください"); return; }
    if (!testDate) { setError("テスト日を入力してください"); return; }
    if (!range.trim()) { setError("出題範囲を入力してください"); return; }

    setUploading(true);
    setError("");
    try {
      const fileUrls = await uploadFiles();
      const docRef = await createTest({
        userId: currentUser.uid,
        subject,
        testDate: Timestamp.fromDate(new Date(testDate)),
        range: range.trim(),
        // @ts-expect-error schema拡張フィールド
        attachments: fileUrls,
      });
      router.push(`/tests/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError("テストの登録に失敗しました。もう一度お試しください。");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/tests"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <h1 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          テストを登録
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 科目選択 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            科目 <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {SUBJECTS.map((s) => {
              const color = SUBJECT_COLORS[s];
              const active = subject === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className="py-2.5 rounded-xl text-sm font-bold transition-all duration-120"
                  style={{
                    background: active ? color : color + "15",
                    color: active ? "#fff" : color,
                    border: `2px solid ${active ? color : "transparent"}`,
                    transform: active ? "translateY(-2px)" : undefined,
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* テスト日 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            テスト日 <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-all"
            style={{
              background: "var(--color-bg-primary)",
              border: "2px solid var(--color-bg-tertiary)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
          />
        </div>

        {/* 出題範囲 */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            出題範囲 <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <textarea
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="例: 教科書 p.50〜p.80、連立方程式、一次関数の基礎"
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-sm transition-all resize-none"
            style={{
              background: "var(--color-bg-primary)",
              border: "2px solid var(--color-bg-tertiary)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            詳しく書くほど精度が上がります
          </p>
        </div>

        {/* ファイルアップロード */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
            教材アップロード <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>（任意・最大5ファイル・10MBまで）</span>
          </label>

          {files.length < 5 && (
            <label
              className="flex flex-col items-center justify-center gap-2 rounded-xl py-6 cursor-pointer transition-all duration-150 border-2 border-dashed"
              style={{
                borderColor: "var(--color-bg-tertiary)",
                background: "var(--color-bg-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-brand-blue)";
                e.currentTarget.style.background = "rgba(28,176,246,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-bg-tertiary)";
                e.currentTarget.style.background = "var(--color-bg-secondary)";
              }}
            >
              <Upload size={20} style={{ color: "var(--color-brand-blue)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                写真・PDF をアップロード
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                JPG / PNG / PDF
              </span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          {files.length > 0 && (
            <div className="mt-2 space-y-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{
                    background: "var(--color-bg-primary)",
                    border: "1px solid var(--color-bg-tertiary)",
                  }}
                >
                  <span className="text-base">
                    {file.type.startsWith("image/") ? "🖼️" : "📄"}
                  </span>
                  <span
                    className="flex-1 text-sm truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {file.name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                    style={{ background: "var(--color-bg-tertiary)" }}
                  >
                    <X size={12} style={{ color: "var(--color-text-secondary)" }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* エラー */}
        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,75,75,0.08)", color: "var(--color-error)" }}
          >
            {error}
          </div>
        )}

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3.5 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all duration-120 disabled:opacity-60"
          style={{
            background: "var(--color-brand-blue)",
            boxShadow: "0 4px 12px rgba(28,176,246,0.4)",
          }}
          onMouseEnter={(e) => {
            if (!uploading) e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              登録中...
            </>
          ) : (
            "テストを登録する"
          )}
        </button>
      </form>
    </div>
  );
}
