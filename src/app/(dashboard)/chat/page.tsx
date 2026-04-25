"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getUser } from "@/lib/firebase/schema";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import {
  Send, ImagePlus, X, Sparkles, Lock, Loader2,
  GraduationCap, BookOpen, CheckCircle2, XCircle, ChevronRight,
  RotateCcw, Trophy,
} from "lucide-react";
import Link from "next/link";

// ── 型定義 ─────────────────────────────────────────────────────────

type Tab = "chat" | "quiz";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
};

type GeneratedQuestion = {
  type: "multiple" | "fill" | "description";
  question: string;
  choices: string[] | null;
  answer: string;
  explanation: string;
};

type AnswerRecord = {
  userAnswer: string;
  correct: boolean | null;
  revealed: boolean;
};

type QuizStep = "form" | "generating" | "quiz" | "result";

const SUBJECTS = ["国語", "数学", "英語", "理科", "社会"];
const SUBJECT_COLORS: Record<string, string> = {
  国語: "#9B5DE5", 数学: "#1CB0F6", 英語: "#58CC02", 理科: "#00C9A7", 社会: "#FF9600",
};
const TYPE_LABELS: Record<string, string> = {
  multiple: "四択", fill: "穴埋め", description: "記述",
};

// ── チャット提案 ─────────────────────────────────────────────────────

const CHAT_HINTS = [
  "この方程式の解き方を教えて",
  "光合成とは何ですか？",
  "英語の受動態を分かりやすく説明して",
  "歴史の年号を覚えるコツは？",
];

// ── メインコンポーネント ──────────────────────────────────────────────

export default function TutorPage() {
  const { currentUser } = useAuth();
  const [plan, setPlan] = useState<string | null>(null);
  const [grade, setGrade] = useState<string>("中2");
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [tab, setTab] = useState<Tab>("chat");

  // チャットタブ
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatImage, setChatImage] = useState<File | null>(null);
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSubject, setChatSubject] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);

  // 予想問題タブ
  const [quizStep, setQuizStep] = useState<QuizStep>("form");
  const [quizSubject, setQuizSubject] = useState("");
  const [quizRange, setQuizRange] = useState("");
  const [quizImage, setQuizImage] = useState<File | null>(null);
  const [quizImagePreview, setQuizImagePreview] = useState<string | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [fillInput, setFillInput] = useState("");
  const [quizError, setQuizError] = useState("");
  const [usageInfo, setUsageInfo] = useState<{ count: number; limit: number } | null>(null);
  const quizFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    getUser(currentUser.uid).then((u) => {
      setPlan(u?.plan ?? "free");
      setGrade(u?.grade ?? "中2");
      setCheckingPlan(false);
    });
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── チャット: 画像ハンドリング ────────────────────────────────────────

  function handleChatImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("画像は10MB以下にしてください"); return; }
    setChatImage(file);
    setChatImagePreview(URL.createObjectURL(file));
  }

  function removeChatImage() {
    setChatImage(null);
    setChatImagePreview(null);
    if (chatFileRef.current) chatFileRef.current.value = "";
  }

  // ── チャット: 送信 ────────────────────────────────────────────────────

  async function handleSend() {
    if ((!input.trim() && !chatImage) || chatLoading || !currentUser) return;

    let uploadedUrl: string | undefined;
    if (chatImage) {
      const path = `chat/${currentUser.uid}/${Date.now()}_${chatImage.name}`;
      const r = storageRef(storage(), path);
      const snap = await uploadBytes(r, chatImage);
      uploadedUrl = await getDownloadURL(snap.ref);
    }

    const userMsg: ChatMessage = {
      role: "user",
      content: input.trim() || "この問題を解説してください。",
      imageUrl: chatImagePreview ?? undefined,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    removeChatImage();
    setChatLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: userMsg.content,
          imageUrl: uploadedUrl,
          subject: chatSubject || undefined,
          // 履歴: 直近8件（テキストのみ）
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: `エラー: ${data.error ?? "不明なエラー"}` }]);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: text }]);
        }
      }
    } finally {
      setChatLoading(false);
    }
  }

  // ── 予想問題: 画像ハンドリング ────────────────────────────────────────

  function handleQuizImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("画像は10MB以下にしてください"); return; }
    setQuizImage(file);
    setQuizImagePreview(URL.createObjectURL(file));
  }

  function removeQuizImage() {
    setQuizImage(null);
    setQuizImagePreview(null);
    if (quizFileRef.current) quizFileRef.current.value = "";
  }

  // ── 予想問題: 生成 ────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!currentUser || !quizSubject || !quizRange.trim()) return;
    setQuizError("");
    setQuizStep("generating");

    let fileUrls: string[] = [];
    if (quizImage) {
      try {
        const path = `quiz/${currentUser.uid}/${Date.now()}_${quizImage.name}`;
        const r = storageRef(storage(), path);
        const snap = await uploadBytes(r, quizImage);
        fileUrls = [await getDownloadURL(snap.ref)];
      } catch {
        // 画像アップロード失敗は無視して続行
      }
    }

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: quizSubject, range: quizRange.trim(), fileUrls }),
      });
      const data = await res.json() as {
        questions?: GeneratedQuestion[];
        error?: string;
        usageCount?: number;
        usageLimit?: number;
        upgradeRequired?: boolean;
      };

      if (!res.ok) {
        setQuizError(data.error ?? "生成に失敗しました");
        setQuizStep("form");
        return;
      }

      if (data.usageCount != null && data.usageLimit != null) {
        setUsageInfo({ count: data.usageCount, limit: data.usageLimit });
      }

      setQuestions(data.questions ?? []);
      setAnswers(Array(data.questions?.length ?? 0).fill(null).map(() => ({
        userAnswer: "",
        correct: null,
        revealed: false,
      })));
      setCurrentQ(0);
      setFillInput("");
      setQuizStep("quiz");
    } catch {
      setQuizError("ネットワークエラーが発生しました");
      setQuizStep("form");
    }
  }

  // ── 予想問題: 回答 ────────────────────────────────────────────────────

  function submitAnswer(userAnswer: string) {
    const q = questions[currentQ];
    let correct: boolean | null = null;

    if (q.type === "multiple" || q.type === "fill") {
      correct = userAnswer.trim() === q.answer.trim() ||
        userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase();
    }
    // description は null (自己採点)

    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = { userAnswer, correct, revealed: true };
      return next;
    });
  }

  function goNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setFillInput("");
    } else {
      setQuizStep("result");
    }
  }

  function resetQuiz() {
    setQuizStep("form");
    setQuizSubject("");
    setQuizRange("");
    removeQuizImage();
    setQuestions([]);
    setAnswers([]);
    setCurrentQ(0);
    setFillInput("");
    setQuizError("");
  }

  // ── ローディング ──────────────────────────────────────────────────────

  if (checkingPlan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--color-brand-blue)" }} />
      </div>
    );
  }

  // ── Freeプラン: アップグレード誘導 ────────────────────────────────────

  if (plan === "free") {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl" style={{ background: "rgba(155,93,229,0.1)" }}>
          🎓
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>AI塾講師</h1>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
            AIが専属の塾の先生として、解説・予想問題で学習をサポートします。
          </p>
        </div>
        <div className="w-full rounded-2xl p-5" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Lock size={18} style={{ color: "var(--color-brand-purple)" }} />
            <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>Proプランの機能です</p>
          </div>
          {[
            "📸 写真を撮って即解説（Vision対応）",
            "💬 会話形式でどんな質問にも答える",
            "📝 テスト直前に予想問題を10問生成",
            "🎯 学年・科目に合わせた解説",
            "✨ Claude Sonnet 最高品質モデル使用",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 mb-2.5">
              <Sparkles size={14} style={{ color: "var(--color-brand-purple)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{f}</p>
            </div>
          ))}
        </div>
        <Link
          href="/settings/billing"
          className="w-full py-3.5 rounded-pill font-bold text-white text-center flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #9B5DE5, #1CB0F6)", boxShadow: "0 4px 15px rgba(155,93,229,0.35)" }}
        >
          <Sparkles size={16} />
          Proプランを開始 — ¥480/月
        </Link>
      </div>
    );
  }

  // ── メイン UI ─────────────────────────────────────────────────────────

  const currentQuestion = questions[currentQ];
  const currentAnswer = answers[currentQ];
  const correctCount = answers.filter((a) => a.correct === true).length;
  const answeredCount = answers.filter((a) => a.revealed).length;

  return (
    <div className="max-w-xl mx-auto px-4 py-4 flex flex-col" style={{ minHeight: "calc(100dvh - 64px)" }}>

      {/* ── ヘッダー ── */}
      <div className="flex items-center gap-3 pb-3 border-b mb-3 flex-shrink-0" style={{ borderColor: "var(--color-bg-tertiary)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(155,93,229,0.12)" }}>
          <GraduationCap size={22} style={{ color: "var(--color-brand-purple)" }} />
        </div>
        <div>
          <h1 className="font-display font-black text-base" style={{ color: "var(--color-text-primary)" }}>AI塾講師</h1>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--color-brand-green)" }} />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Claude Sonnet · {grade}</span>
          </div>
        </div>
        <span
          className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: "linear-gradient(135deg, rgba(155,93,229,0.15), rgba(28,176,246,0.15))", color: "var(--color-brand-purple)" }}
        >
          ✨ AI生成
        </span>
      </div>

      {/* ── タブ ── */}
      <div className="flex gap-1 p-1 rounded-xl mb-3 flex-shrink-0" style={{ background: "var(--color-bg-tertiary)" }}>
        {([
          { key: "chat" as Tab, icon: "💬", label: "質問・解説" },
          { key: "quiz" as Tab, icon: "📝", label: "予想問題" },
        ]).map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              background: tab === key ? "var(--color-bg-primary)" : "transparent",
              color: tab === key ? "var(--color-text-primary)" : "var(--color-text-muted)",
              boxShadow: tab === key ? "var(--shadow-sm)" : "none",
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════
          チャットタブ
      ════════════════════════════════════ */}
      {tab === "chat" && (
        <>
          {/* 科目フィルター（任意） */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto flex-shrink-0 pb-0.5">
            <button
              onClick={() => setChatSubject("")}
              className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
              style={{
                background: !chatSubject ? "var(--color-brand-blue)" : "var(--color-bg-tertiary)",
                color: !chatSubject ? "#fff" : "var(--color-text-muted)",
              }}
            >
              全科目
            </button>
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setChatSubject(chatSubject === s ? "" : s)}
                className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
                style={{
                  background: chatSubject === s ? SUBJECT_COLORS[s] : "var(--color-bg-tertiary)",
                  color: chatSubject === s ? "#fff" : "var(--color-text-muted)",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* メッセージ一覧 */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">🎓</p>
                <p className="font-bold text-base" style={{ color: "var(--color-text-primary)" }}>何でも聞いてね！</p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                  問題の写真を送ったり、テキストで質問できます
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {CHAT_HINTS.map((hint) => (
                    <button
                      key={hint}
                      onClick={() => setInput(hint)}
                      className="px-3 py-1.5 rounded-pill text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: "rgba(28,176,246,0.1)", color: "var(--color-brand-blue)" }}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 self-end" style={{ background: "rgba(155,93,229,0.12)" }}>
                    🎓
                  </div>
                )}
                <div
                  className="max-w-[82%] px-4 py-3 rounded-2xl"
                  style={{
                    background: msg.role === "user" ? "var(--color-brand-blue)" : "var(--color-bg-primary)",
                    border: msg.role === "assistant" ? "1px solid var(--color-bg-tertiary)" : "none",
                    color: msg.role === "user" ? "#fff" : "var(--color-text-primary)",
                    borderRadius: msg.role === "user" ? "1.5rem 1.5rem 0.375rem 1.5rem" : "1.5rem 1.5rem 1.5rem 0.375rem",
                  }}
                >
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="質問画像" className="max-w-full rounded-xl mb-2" style={{ maxHeight: "200px", objectFit: "contain" }} />
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                    {msg.role === "assistant" && chatLoading && i === messages.length - 1 && (
                      <span className="inline-flex gap-0.5 ml-1 align-middle">
                        {[0, 1, 2].map((j) => (
                          <span key={j} className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--color-text-muted)", animation: `bounce 1s ${j * 0.15}s infinite` }} />
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
          <div className="border-t pt-3 flex-shrink-0" style={{ borderColor: "var(--color-bg-tertiary)" }}>
            {chatImagePreview && (
              <div className="mb-2 relative inline-block">
                <img src={chatImagePreview} alt="添付" className="h-16 rounded-xl object-cover" />
                <button onClick={removeChatImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--color-error)", color: "#fff" }}>
                  <X size={11} />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <label className="flex-shrink-0 cursor-pointer">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70" style={{ background: "var(--color-bg-tertiary)" }}>
                  <ImagePlus size={18} style={{ color: "var(--color-text-secondary)" }} />
                </div>
                <input ref={chatFileRef} type="file" accept="image/*" onChange={handleChatImageChange} className="hidden" />
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="質問を入力... (Shift+Enterで改行)"
                rows={1}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm resize-none transition-all"
                style={{ background: "var(--color-bg-primary)", border: "2px solid var(--color-bg-tertiary)", color: "var(--color-text-primary)", outline: "none", maxHeight: "120px" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
                onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }}
              />
              <button
                onClick={handleSend}
                disabled={chatLoading || (!input.trim() && !chatImage)}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:-translate-y-0.5"
                style={{ background: "var(--color-brand-blue)", boxShadow: "0 4px 12px rgba(28,176,246,0.4)" }}
              >
                {chatLoading ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
              </button>
            </div>
            <p className="text-xs mt-1.5 text-center" style={{ color: "var(--color-text-muted)" }}>
              Claude Sonnet 4.6 · 回答は参考程度にご使用ください
            </p>
          </div>
        </>
      )}

      {/* ════════════════════════════════════
          予想問題タブ
      ════════════════════════════════════ */}
      {tab === "quiz" && (
        <div className="flex-1 overflow-y-auto">

          {/* ── フォーム ── */}
          {quizStep === "form" && (
            <div className="space-y-5 pb-6">
              <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
                <div className="flex items-center gap-2">
                  <BookOpen size={16} style={{ color: "var(--color-brand-purple)" }} />
                  <h2 className="font-bold" style={{ color: "var(--color-text-primary)" }}>予想問題を生成する</h2>
                  {usageInfo && usageInfo.limit > 0 && (
                    <span className="ml-auto text-xs" style={{ color: "var(--color-text-muted)" }}>
                      今月 {usageInfo.count}/{usageInfo.limit} 回
                    </span>
                  )}
                </div>

                {/* 科目 */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>科目</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {SUBJECTS.map((s) => {
                      const color = SUBJECT_COLORS[s];
                      const active = quizSubject === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setQuizSubject(s)}
                          className="py-2.5 rounded-xl text-xs font-bold transition-all"
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

                {/* 出題範囲 */}
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>出題範囲</p>
                  <textarea
                    value={quizRange}
                    onChange={(e) => setQuizRange(e.target.value)}
                    placeholder={"例: 連立方程式（代入法・加減法）\n教科書p.50〜p.80"}
                    rows={3}
                    className="w-full rounded-xl px-4 py-3 text-sm resize-none transition-all"
                    style={{ background: "var(--color-bg-secondary)", border: "2px solid var(--color-bg-tertiary)", color: "var(--color-text-primary)", outline: "none" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
                  />
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>詳しく書くほど精度が上がります</p>
                </div>

                {/* 教材アップロード（任意） */}
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                    教材アップロード <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>（任意）</span>
                  </p>
                  {quizImagePreview ? (
                    <div className="relative inline-block">
                      <img src={quizImagePreview} alt="教材" className="h-20 rounded-xl object-cover" />
                      <button onClick={removeQuizImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--color-error)", color: "#fff" }}>
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer border-2 border-dashed transition-all"
                      style={{ borderColor: "var(--color-bg-tertiary)", background: "var(--color-bg-secondary)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-brand-purple)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-bg-tertiary)"; }}
                    >
                      <ImagePlus size={16} style={{ color: "var(--color-brand-purple)" }} />
                      <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>教材・プリントの写真を追加</span>
                      <input ref={quizFileRef} type="file" accept="image/*" onChange={handleQuizImageChange} className="hidden" />
                    </label>
                  )}
                </div>

                {quizError && (
                  <p className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "rgba(255,75,75,0.08)", color: "var(--color-error)" }}>
                    ✗ {quizError}
                  </p>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!quizSubject || !quizRange.trim()}
                  className="w-full py-3.5 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:transform-none"
                  style={{ background: "linear-gradient(135deg, #9B5DE5, #1CB0F6)", boxShadow: "0 4px 15px rgba(155,93,229,0.35)" }}
                >
                  <Sparkles size={16} />
                  予想問題を10問生成する
                </button>
              </div>

              <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                四択3問・穴埋め4問・記述3問を生成します
              </p>
            </div>
          )}

          {/* ── 生成中 ── */}
          {quizStep === "generating" && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "rgba(155,93,229,0.12)" }}>
                🎓
              </div>
              <div className="text-center">
                <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>AIが問題を考えています...</p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>しばらくお待ちください（10〜20秒）</p>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-brand-purple)", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── クイズ ── */}
          {quizStep === "quiz" && currentQuestion && (
            <div className="space-y-4 pb-6">
              {/* プログレス */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg-tertiary)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${((currentQ + 1) / questions.length) * 100}%`, background: "linear-gradient(90deg, #9B5DE5, #1CB0F6)" }}
                  />
                </div>
                <span className="text-xs font-bold flex-shrink-0" style={{ color: "var(--color-text-secondary)" }}>
                  {currentQ + 1} / {questions.length}
                </span>
              </div>

              {/* 問題カード */}
              <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
                {/* タイプバッジ */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: currentQuestion.type === "multiple" ? "rgba(28,176,246,0.12)" : currentQuestion.type === "fill" ? "rgba(88,204,2,0.12)" : "rgba(155,93,229,0.12)",
                      color: currentQuestion.type === "multiple" ? "var(--color-brand-blue)" : currentQuestion.type === "fill" ? "var(--color-brand-green)" : "var(--color-brand-purple)",
                    }}
                  >
                    {TYPE_LABELS[currentQuestion.type]}
                  </span>
                  {quizSubject && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: SUBJECT_COLORS[quizSubject] + "15", color: SUBJECT_COLORS[quizSubject] }}>
                      {quizSubject}
                    </span>
                  )}
                </div>

                {/* 問題文 */}
                <p className="text-base font-semibold leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
                  {currentQuestion.question}
                </p>

                {/* 回答前 */}
                {!currentAnswer?.revealed && (
                  <>
                    {/* 四択 */}
                    {currentQuestion.type === "multiple" && currentQuestion.choices && (
                      <div className="space-y-2">
                        {currentQuestion.choices.map((choice, ci) => (
                          <button
                            key={ci}
                            onClick={() => submitAnswer(choice)}
                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
                            style={{ background: "var(--color-bg-secondary)", border: "2px solid var(--color-bg-tertiary)", color: "var(--color-text-primary)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-brand-blue)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-bg-tertiary)"; }}
                          >
                            <span className="font-black mr-2" style={{ color: "var(--color-brand-blue)" }}>
                              {["A", "B", "C", "D"][ci]}.
                            </span>
                            {choice}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 穴埋め・記述 */}
                    {(currentQuestion.type === "fill" || currentQuestion.type === "description") && (
                      <div className="space-y-3">
                        {currentQuestion.type === "fill" ? (
                          <input
                            type="text"
                            value={fillInput}
                            onChange={(e) => setFillInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && fillInput.trim()) submitAnswer(fillInput); }}
                            placeholder="答えを入力..."
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
                            style={{ background: "var(--color-bg-secondary)", border: "2px solid var(--color-bg-tertiary)", color: "var(--color-text-primary)", outline: "none" }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
                          />
                        ) : (
                          <textarea
                            value={fillInput}
                            onChange={(e) => setFillInput(e.target.value)}
                            placeholder="答えを入力..."
                            rows={3}
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl text-sm font-medium resize-none transition-all"
                            style={{ background: "var(--color-bg-secondary)", border: "2px solid var(--color-bg-tertiary)", color: "var(--color-text-primary)", outline: "none" }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-brand-blue)")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-bg-tertiary)")}
                          />
                        )}
                        <button
                          onClick={() => submitAnswer(fillInput || "(未回答)")}
                          disabled={currentQuestion.type === "fill" && !fillInput.trim()}
                          className="w-full py-3 rounded-pill font-bold text-white transition-all disabled:opacity-40"
                          style={{ background: "var(--color-brand-blue)" }}
                        >
                          答えを確認する →
                        </button>
                        {currentQuestion.type === "description" && (
                          <button
                            onClick={() => submitAnswer("(スキップ)")}
                            className="w-full py-2 rounded-pill text-sm font-semibold transition-all hover:opacity-70"
                            style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-muted)" }}
                          >
                            模範解答を見る
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* 回答後: フィードバック */}
                {currentAnswer?.revealed && (
                  <div className="space-y-3">
                    {/* 正誤表示 */}
                    {currentAnswer.correct !== null && (
                      <div
                        className="flex items-center gap-2 px-4 py-3 rounded-xl"
                        style={{
                          background: currentAnswer.correct ? "rgba(88,204,2,0.08)" : "rgba(255,75,75,0.08)",
                          border: `1px solid ${currentAnswer.correct ? "rgba(88,204,2,0.25)" : "rgba(255,75,75,0.25)"}`,
                        }}
                      >
                        {currentAnswer.correct
                          ? <CheckCircle2 size={18} style={{ color: "var(--color-brand-green)", flexShrink: 0 }} />
                          : <XCircle size={18} style={{ color: "var(--color-error)", flexShrink: 0 }} />}
                        <div>
                          <p className="text-sm font-bold" style={{ color: currentAnswer.correct ? "var(--color-brand-green)" : "var(--color-error)" }}>
                            {currentAnswer.correct ? "正解！" : "不正解"}
                          </p>
                          {!currentAnswer.correct && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                              正解: <strong>{currentQuestion.answer}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 記述: 模範解答 */}
                    {currentAnswer.correct === null && (
                      <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(28,176,246,0.06)", border: "1px solid rgba(28,176,246,0.2)" }}>
                        <p className="text-xs font-bold mb-1" style={{ color: "var(--color-brand-blue)" }}>📋 模範解答</p>
                        <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>{currentQuestion.answer}</p>
                      </div>
                    )}

                    {/* 解説 */}
                    <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(155,93,229,0.06)", border: "1px solid rgba(155,93,229,0.15)" }}>
                      <p className="text-xs font-bold mb-1" style={{ color: "var(--color-brand-purple)" }}>🎓 塾講師の解説</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{currentQuestion.explanation}</p>
                    </div>

                    <button
                      onClick={goNext}
                      className="w-full py-3 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                      style={{ background: currentQ < questions.length - 1 ? "var(--color-brand-blue)" : "var(--color-brand-green)" }}
                    >
                      {currentQ < questions.length - 1
                        ? <><ChevronRight size={16} /> 次の問題</>
                        : <><Trophy size={16} /> 結果を見る</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 結果 ── */}
          {quizStep === "result" && (
            <div className="space-y-5 pb-6">
              {/* スコアカード */}
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "linear-gradient(135deg, rgba(155,93,229,0.08), rgba(28,176,246,0.08))", border: "2px solid rgba(155,93,229,0.2)" }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-brand-purple)" }}>結果発表</p>
                <div
                  className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4"
                  style={{ background: `conic-gradient(var(--color-brand-green) ${(correctCount / questions.filter((_q, i) => answers[i]?.correct !== null).length || 0) * 360}deg, var(--color-bg-tertiary) 0deg)` }}
                >
                  <div className="w-16 h-16 rounded-full flex flex-col items-center justify-center" style={{ background: "var(--color-bg-primary)" }}>
                    <p className="text-2xl font-display font-black leading-none" style={{ color: "var(--color-brand-green)" }}>{correctCount}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>/{answeredCount}</p>
                  </div>
                </div>
                <p className="text-lg font-display font-black" style={{ color: "var(--color-text-primary)" }}>
                  {correctCount >= 8 ? "素晴らしい！🎉" : correctCount >= 6 ? "よくできました！" : correctCount >= 4 ? "もう少し！" : "一緒に復習しよう 💪"}
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                  自動採点 {answeredCount} 問中 <strong style={{ color: "var(--color-brand-green)" }}>{correctCount} 問正解</strong>
                </p>
              </div>

              {/* 問題別結果 */}
              <div className="rounded-2xl p-5" style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}>
                <p className="text-xs font-bold mb-3" style={{ color: "var(--color-text-secondary)" }}>問題別結果</p>
                <div className="space-y-2">
                  {questions.map((q, i) => {
                    const a = answers[i];
                    return (
                      <div key={i} className="flex items-start gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: "var(--color-bg-tertiary)" }}>
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{
                            background: a?.correct === true ? "rgba(88,204,2,0.15)" : a?.correct === false ? "rgba(255,75,75,0.15)" : "rgba(28,176,246,0.1)",
                            color: a?.correct === true ? "var(--color-brand-green)" : a?.correct === false ? "var(--color-error)" : "var(--color-brand-blue)",
                          }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs line-clamp-1" style={{ color: "var(--color-text-primary)" }}>{q.question}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            {a?.correct === null ? "記述 (自己採点)" : a?.correct ? "✓ 正解" : `✗ 正解: ${q.answer}`}
                          </p>
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: "var(--color-text-muted)" }}>{TYPE_LABELS[q.type]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* アクション */}
              <div className="flex gap-3">
                <button
                  onClick={resetQuiz}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-pill font-bold transition-all hover:opacity-80"
                  style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-primary)" }}
                >
                  <RotateCcw size={15} />
                  新しい問題
                </button>
                <button
                  onClick={() => setTab("chat")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-pill font-bold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--color-brand-purple)" }}
                >
                  <GraduationCap size={15} />
                  解説を聞く
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
