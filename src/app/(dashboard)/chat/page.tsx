"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUser } from "@/lib/firebase/schema";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import {
  Send,
  ImagePlus,
  X,
  Sparkles,
  Lock,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
};

export default function ChatPage() {
  const { currentUser } = useAuth();
  const [plan, setPlan] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    getUser(currentUser.uid).then((u) => {
      setPlan(u?.plan ?? "free");
      setCheckingPlan(false);
    });
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("画像は10MB以下にしてください");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend() {
    if ((!input.trim() && !imageFile) || loading || !currentUser) return;

    let uploadedImageUrl: string | undefined;

    // 画像アップロード
    if (imageFile) {
      const path = `chat/${currentUser.uid}/${Date.now()}_${imageFile.name}`;
      const r = storageRef(storage(), path);
      const snap = await uploadBytes(r, imageFile);
      uploadedImageUrl = await getDownloadURL(snap.ref);
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim() || "この問題を解説してください。",
      imageUrl: imagePreview ?? undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    removeImage();
    setLoading(true);

    // アシスタントのプレースホルダー追加
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          imageUrl: uploadedImageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: `エラー: ${data.error ?? "不明なエラー"}` },
        ]);
        return;
      }

      // ストリーミング読み取り
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });
          setMessages((prev) => [
            ...prev.slice(0, -1),
            { role: "assistant", content: assistantText },
          ]);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingPlan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-brand-blue)" }}
        />
      </div>
    );
  }

  // Pro以外はアップグレード誘導
  if (plan === "free") {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 flex flex-col items-center gap-6">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
          style={{ background: "rgba(155,93,229,0.1)" }}
        >
          🤖
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
            AI解説チャット
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
            分からない問題の写真を撮って質問するだけで、AIが丁寧に解説します。
          </p>
        </div>

        <div
          className="w-full rounded-2xl p-5"
          style={{
            background: "var(--color-bg-primary)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Lock size={18} style={{ color: "var(--color-brand-purple)" }} />
            <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>
              Proプランの機能です
            </p>
          </div>
          {[
            "写真撮影→AIが即解説",
            "テキストでも質問可能",
            "Claude Sonnet 最高品質モデル使用",
            "無制限で利用可能",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 mb-2">
              <Sparkles size={14} style={{ color: "var(--color-brand-purple)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {f}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/settings/billing"
          className="w-full py-3.5 rounded-pill font-bold text-white text-center flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #9B5DE5, #1CB0F6)",
            boxShadow: "0 4px 15px rgba(155,93,229,0.35)",
          }}
        >
          <Sparkles size={16} />
          Proプランを開始 — ¥480/月
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-64px)] md:h-screen">
      {/* ヘッダー */}
      <div
        className="flex items-center gap-3 pb-4 border-b mb-4"
        style={{ borderColor: "var(--color-bg-tertiary)" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: "rgba(155,93,229,0.1)" }}
        >
          🤖
        </div>
        <div>
          <h1 className="font-display font-black" style={{ color: "var(--color-text-primary)" }}>
            AI解説チャット
          </h1>
          <div className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--color-brand-green)" }}
            />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Claude Sonnet オンライン
            </span>
          </div>
        </div>
        <span
          className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            background: "linear-gradient(135deg, rgba(155,93,229,0.15), rgba(28,176,246,0.15))",
            color: "var(--color-brand-purple)",
          }}
        >
          ✨ AI生成
        </span>
      </div>

      {/* チャット履歴 */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>
              何でも聞いてね！
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              問題の写真を送ったりテキストで質問できます
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[
                "この方程式の解き方を教えて",
                "光合成とは何ですか？",
                "英語の受動態を説明して",
              ].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="px-3 py-1.5 rounded-pill text-xs font-medium transition-all hover:opacity-80"
                  style={{
                    background: "rgba(28,176,246,0.1)",
                    color: "var(--color-brand-blue)",
                  }}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
          >
            {msg.role === "assistant" && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: "rgba(155,93,229,0.1)" }}
              >
                🤖
              </div>
            )}
            <div
              className="max-w-[80%] px-4 py-3 rounded-2xl"
              style={{
                background:
                  msg.role === "user"
                    ? "var(--color-brand-blue)"
                    : "var(--color-bg-primary)",
                border:
                  msg.role === "assistant"
                    ? "1px solid var(--color-bg-tertiary)"
                    : "none",
                color: msg.role === "user" ? "#fff" : "var(--color-text-primary)",
                borderRadius:
                  msg.role === "user"
                    ? "1.5rem 1.5rem 0.375rem 1.5rem"
                    : "1.5rem 1.5rem 1.5rem 0.375rem",
              }}
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="質問画像"
                  className="max-w-full rounded-xl mb-2"
                  style={{ maxHeight: "200px", objectFit: "contain" }}
                />
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
                {msg.role === "assistant" && loading && i === messages.length - 1 && (
                  <span className="inline-flex gap-0.5 ml-1 align-middle">
                    {[0, 1, 2].map((j) => (
                      <span
                        key={j}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: "var(--color-text-muted)",
                          animation: `bounce 1s ${j * 0.15}s infinite`,
                        }}
                      />
                    ))}
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div
        className="border-t pt-4"
        style={{ borderColor: "var(--color-bg-tertiary)" }}
      >
        {/* 画像プレビュー */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img
              src={imagePreview}
              alt="添付画像"
              className="h-20 rounded-xl object-cover"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "var(--color-error)", color: "#fff" }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* 画像添付 */}
          <label className="flex-shrink-0 cursor-pointer">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ background: "var(--color-bg-tertiary)" }}
            >
              <ImagePlus size={18} style={{ color: "var(--color-text-secondary)" }} />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          {/* テキスト入力 */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="質問を入力... (Shift+Enterで改行)"
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm resize-none transition-all"
            style={{
              background: "var(--color-bg-primary)",
              border: "2px solid var(--color-bg-tertiary)",
              color: "var(--color-text-primary)",
              outline: "none",
              maxHeight: "120px",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />

          {/* 送信 */}
          <button
            onClick={handleSend}
            disabled={loading || (!input.trim() && !imageFile)}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:-translate-y-0.5"
            style={{
              background: "var(--color-brand-blue)",
              boxShadow: "0 4px 12px rgba(28,176,246,0.4)",
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-white" />
            ) : (
              <Send size={16} className="text-white" />
            )}
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: "var(--color-text-muted)" }}>
          Claude Sonnet 4.6 powered · 回答は参考程度にご使用ください
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
