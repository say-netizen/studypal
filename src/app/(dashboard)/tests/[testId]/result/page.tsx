"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getTest,
  getTestQuestions,
  type TestDoc,
  type QuestionDoc,
} from "@/lib/firebase/schema";
import {
  ArrowLeft,
  Trophy,
  Star,
  ChevronDown,
  ChevronUp,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

const SUBJECT_COLORS: Record<string, string> = {
  国語: "#9B5DE5",
  数学: "#1CB0F6",
  英語: "#58CC02",
  理科: "#00C9A7",
  社会: "#FF9600",
};

const TYPE_LABELS: Record<string, string> = {
  multiple: "四択",
  fill: "穴埋め",
  description: "記述",
};

function ScoreRing({
  score,
  color,
}: {
  score: number;
  color: string;
}) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" aria-label={`正解率 ${score}%`}>
      <circle cx="64" cy="64" r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="10" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      />
      <text
        x="64"
        y="60"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: "26px",
          fill: color,
        }}
      >
        {score}
      </text>
      <text
        x="64"
        y="80"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 600,
          fontSize: "12px",
          fill: "var(--color-text-muted)",
        }}
      >
        %
      </text>
    </svg>
  );
}

function QuestionCard({
  q,
  index,
  isWrong,
}: {
  q: QuestionDoc & { id: string };
  index: number;
  isWrong: boolean;
}) {
  const [open, setOpen] = useState(isWrong);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "var(--color-bg-primary)",
        border: `1.5px solid ${
          q.isCorrect === true
            ? "rgba(88,204,2,0.3)"
            : q.isCorrect === false
            ? "rgba(255,75,75,0.25)"
            : "var(--color-bg-tertiary)"
        }`,
      }}
    >
      {/* 問題ヘッダー */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background:
              q.isCorrect === true
                ? "rgba(88,204,2,0.15)"
                : q.isCorrect === false
                ? "rgba(255,75,75,0.12)"
                : "var(--color-bg-tertiary)",
            color:
              q.isCorrect === true
                ? "var(--color-brand-green)"
                : q.isCorrect === false
                ? "var(--color-error)"
                : "var(--color-text-muted)",
          }}
        >
          {index + 1}
        </span>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium line-clamp-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            {q.question}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: "var(--color-bg-tertiary)",
              color: "var(--color-text-muted)",
            }}
          >
            {TYPE_LABELS[q.type]}
          </span>
          {q.isCorrect === true ? (
            <CheckCircle2 size={16} style={{ color: "var(--color-brand-green)" }} />
          ) : q.isCorrect === false ? (
            <XCircle size={16} style={{ color: "var(--color-error)" }} />
          ) : null}
          {open ? (
            <ChevronUp size={16} style={{ color: "var(--color-text-muted)" }} />
          ) : (
            <ChevronDown size={16} style={{ color: "var(--color-text-muted)" }} />
          )}
        </div>
      </button>

      {/* 解説 */}
      {open && (
        <div
          className="px-4 pb-4 space-y-3 border-t"
          style={{ borderColor: "var(--color-bg-tertiary)" }}
        >
          {/* 正解表示 */}
          <div className="pt-3">
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>
              正解
            </p>
            <p className="text-sm font-bold" style={{ color: "var(--color-brand-green)" }}>
              {q.answer}
            </p>
          </div>

          {/* 選択肢（四択の場合） */}
          {q.type === "multiple" && q.choices && (
            <div className="space-y-1.5">
              {q.choices.map((c, i) => {
                const isCorrectChoice =
                  c.trim().toLowerCase() === q.answer.trim().toLowerCase();
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: isCorrectChoice
                        ? "rgba(88,204,2,0.08)"
                        : "var(--color-bg-secondary)",
                      color: isCorrectChoice
                        ? "var(--color-brand-green)"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isCorrectChoice
                          ? "var(--color-brand-green)"
                          : "var(--color-bg-tertiary)",
                        color: isCorrectChoice ? "#fff" : "var(--color-text-muted)",
                      }}
                    >
                      {["A", "B", "C", "D"][i]}
                    </span>
                    {c}
                  </div>
                );
              })}
            </div>
          )}

          {/* 解説テキスト */}
          <div
            className="p-3 rounded-xl"
            style={{
              background: "rgba(255,217,0,0.07)",
              border: "1px solid rgba(255,217,0,0.2)",
            }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-warning)" }}>
              💡 解説
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {q.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResultPage() {
  const { testId } = useParams<{ testId: string }>();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  const xpEarned = Number(searchParams.get("xp") ?? 0);
  const [test, setTest] = useState<(TestDoc & { id: string }) | null>(null);
  const [questions, setQuestions] = useState<(QuestionDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([getTest(testId), getTestQuestions(testId)]).then(([t, qs]) => {
      setTest(t as (TestDoc & { id: string }) | null);
      setQuestions(qs as (QuestionDoc & { id: string })[]);
      setLoading(false);
    });
  }, [currentUser, testId]);

  const answered = questions.filter((q) => q.isCorrect !== null);
  const correct = questions.filter((q) => q.isCorrect === true);
  const wrong = questions.filter((q) => q.isCorrect === false);
  const score = answered.length > 0 ? Math.round((correct.length / answered.length) * 100) : 0;

  const color =
    SUBJECT_COLORS[test?.subject ?? ""] ?? "var(--color-brand-blue)";

  const scoreLabel =
    score === 100
      ? "パーフェクト！"
      : score >= 80
      ? "すばらしい！"
      : score >= 60
      ? "よくできました"
      : score >= 40
      ? "もう少し！"
      : "復習しよう";

  const scoreEmoji =
    score === 100 ? "🏆" : score >= 80 ? "🎉" : score >= 60 ? "😊" : "📚";

  const displayQuestions = showOnlyWrong ? wrong : questions;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-brand-blue)" }} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      <style>{`
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link
          href={`/tests/${testId}`}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{
            background: "var(--color-bg-primary)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
          aria-label="テスト詳細へ戻る"
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <h1
          className="text-xl font-display font-black"
          style={{ color: "var(--color-text-primary)" }}
        >
          結果レポート
        </h1>
      </div>

      {/* スコアカード */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--color-bg-primary)",
          border: "1px solid var(--color-bg-tertiary)",
          boxShadow: "var(--shadow-card)",
          animation: "fadeSlideUp 0.5s ease forwards",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          {/* 絵文字アニメーション */}
          <div
            className="text-5xl"
            style={{ animation: "bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
            aria-hidden="true"
          >
            {scoreEmoji}
          </div>

          <h2
            className="text-xl font-display font-black text-center"
            style={{ color: "var(--color-text-primary)" }}
          >
            {scoreLabel}
          </h2>

          {/* スコアリング */}
          <ScoreRing score={score} color={color} />

          {/* 統計グリッド */}
          <div className="grid grid-cols-3 gap-3 w-full mt-2">
            {[
              {
                label: "正解",
                value: correct.length,
                color: "var(--color-brand-green)",
                bg: "rgba(88,204,2,0.08)",
              },
              {
                label: "不正解",
                value: wrong.length,
                color: "var(--color-error)",
                bg: "rgba(255,75,75,0.08)",
              },
              {
                label: "問題数",
                value: answered.length,
                color: "var(--color-brand-blue)",
                bg: "rgba(28,176,246,0.08)",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center py-3 rounded-xl"
                style={{ background: stat.bg }}
              >
                <p
                  className="text-2xl font-display font-black"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* 獲得XP */}
          {xpEarned > 0 && (
            <div
              className="flex items-center gap-2 w-full justify-center py-3 rounded-xl"
              style={{ background: "rgba(255,217,0,0.1)" }}
            >
              <Star size={18} style={{ color: "var(--color-xp-gold)" }} />
              <p className="font-bold" style={{ color: "var(--color-xp-gold)" }}>
                獲得XP: +{xpEarned} XP
              </p>
            </div>
          )}
        </div>
      </div>

      {/* アクションボタン群 */}
      <div className="grid grid-cols-2 gap-3">
        {/* もう一度チャレンジ */}
        <Link
          href={`/tests/${testId}/quiz`}
          className="flex items-center justify-center gap-2 py-3 rounded-pill font-bold transition-all hover:-translate-y-0.5"
          style={{
            background: "rgba(28,176,246,0.1)",
            color: "var(--color-brand-blue)",
          }}
        >
          <RefreshCw size={15} />
          もう一度
        </Link>

        {/* ランキングへ */}
        <Link
          href="/ranking"
          className="flex items-center justify-center gap-2 py-3 rounded-pill font-bold text-white transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #FFD900, #FF9600)",
            boxShadow: "0 4px 12px rgba(255,150,0,0.35)",
          }}
        >
          <Trophy size={15} />
          ランキング
        </Link>

        {/* 間違えた問題を復習 */}
        {wrong.length > 0 && (
          <button
            onClick={() => setShowOnlyWrong((v) => !v)}
            className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-pill font-bold transition-all hover:-translate-y-0.5"
            style={{
              background: showOnlyWrong
                ? "rgba(255,75,75,0.12)"
                : "var(--color-bg-primary)",
              color: "var(--color-error)",
              border: "1.5px solid rgba(255,75,75,0.3)",
            }}
          >
            <BarChart2 size={15} />
            {showOnlyWrong
              ? `全問を表示 (${questions.length}問)`
              : `間違えた問題を復習 (${wrong.length}問)`}
          </button>
        )}
      </div>

      {/* 全問解説 */}
      <div>
        <h3
          className="font-display font-bold mb-3 flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          <BarChart2 size={16} style={{ color: "var(--color-brand-blue)" }} />
          {showOnlyWrong ? `要復習の問題 (${wrong.length}問)` : `全問解説 (${questions.length}問)`}
        </h3>

        {displayQuestions.length === 0 ? (
          <div
            className="text-center py-8 rounded-2xl"
            style={{
              background: "var(--color-bg-primary)",
              border: "1px solid var(--color-bg-tertiary)",
            }}
          >
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-sm font-semibold" style={{ color: "var(--color-brand-green)" }}>
              間違えた問題はありません！
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                q={q}
                index={questions.indexOf(q)}
                isWrong={q.isCorrect === false}
              />
            ))}
          </div>
        )}
      </div>

      {/* テストへ戻るリンク */}
      <Link
        href={`/tests/${testId}`}
        className="block text-center py-3 rounded-pill font-bold transition-all hover:-translate-y-0.5"
        style={{
          background: "var(--color-brand-blue)",
          color: "#fff",
          boxShadow: "0 4px 12px rgba(28,176,246,0.4)",
        }}
      >
        テスト詳細へ戻る
      </Link>
    </div>
  );
}
