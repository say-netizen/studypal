"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getTest,
  getTestQuestions,
  answerQuestion,
  addXp,
  type TestDoc,
  type QuestionDoc,
} from "@/lib/firebase/schema";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

type AnswerState = "unanswered" | "correct" | "incorrect";

const SUBJECT_COLORS: Record<string, string> = {
  国語: "#9B5DE5",
  数学: "var(--color-brand-primary)",
  英語: "#58CC02",
  理科: "#00C9A7",
  社会: "#FF9600",
};

function normalizeAnswer(s: string) {
  return s.trim().toLowerCase().replace(/[　 ]/g, "");
}

function XpPopup({ amount, onDone }: { amount: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed top-1/2 left-1/2 pointer-events-none z-50"
      style={{
        transform: "translate(-50%, -50%)",
        animation: "floatUpFade 1.2s ease-out forwards",
        color: "var(--color-xp-gold)",
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        fontSize: "2rem",
        textShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      +{amount} XP ✨
    </div>
  );
}

export default function QuizPage() {
  const { testId } = useParams<{ testId: string }>();
  const { currentUser } = useAuth();
  const router = useRouter();

  const [test, setTest] = useState<(TestDoc & { id: string }) | null>(null);
  const [questions, setQuestions] = useState<(QuestionDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [showExplanation, setShowExplanation] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [cardAnim, setCardAnim] = useState<"" | "correct" | "shake">("");
  const [bestStreak, setBestStreak] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([getTest(testId), getTestQuestions(testId)]).then(([t, qs]) => {
      setTest(t as (TestDoc & { id: string }) | null);
      setQuestions(qs as (QuestionDoc & { id: string })[]);
      setLoading(false);
    });
  }, [currentUser, testId]);

  const currentQ = questions[currentIndex];

  async function handleAnswer(selected?: string) {
    if (answerState !== "unanswered" || !currentQ || !currentUser) return;

    const answer = selected ?? userAnswer;
    const correct =
      currentQ.type === "description"
        ? true // 記述は自己評価
        : normalizeAnswer(answer) === normalizeAnswer(currentQ.answer);

    setAnswerState(correct ? "correct" : "incorrect");
    setShowExplanation(true);

    if (correct) {
      setCardAnim("correct");
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));
      const xp = newStreak >= 3 ? 20 : 10;
      setXpAmount(xp);
      setTotalXp((prev) => prev + xp);
      setShowXpPopup(true);
      await answerQuestion(currentQ.id, true);
      await addXp(currentUser.uid, xp);
    } else {
      setCardAnim("shake");
      setStreak(0);
      await answerQuestion(currentQ.id, false);
    }

    setTimeout(() => setCardAnim(""), 600);
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      const minutes = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
      const subject = encodeURIComponent(test?.subject ?? "");
      router.push(`/tests/${testId}/result?xp=${totalXp}&streak=${bestStreak}&minutes=${minutes}&subject=${subject}`);
      return;
    } else {
      setCurrentIndex((i) => i + 1);
      setUserAnswer("");
      setAnswerState("unanswered");
      setShowExplanation(false);
    }
  }

  if (loading) return <LoadingScreen />;

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center space-y-4">
        <p className="text-4xl">😅</p>
        <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>
          問題がありません
        </p>
        <Link href={`/tests/${testId}`} className="inline-block text-sm font-semibold" style={{ color: "var(--color-brand-blue)" }}>
          テスト詳細へ戻る
        </Link>
      </div>
    );
  }

  const color = SUBJECT_COLORS[test?.subject ?? ""] ?? "var(--color-brand-blue)";
  const progress = (currentIndex / questions.length) * 100;

  return (
    <div className="max-w-xl mx-auto px-4 py-4 flex flex-col min-h-[80vh]">
      <style>{`
        @keyframes floatUpFade {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -120%) scale(1.2); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes correctBounce {
          0% { transform: scale(1); }
          40% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* XPポップアップ */}
      {showXpPopup && (
        <XpPopup amount={xpAmount} onDone={() => setShowXpPopup(false)} />
      )}

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href={`/tests/${testId}`}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
            {currentIndex + 1} / {questions.length} 問
          </p>
          {/* プログレスバー */}
          <div
            className="w-full h-2 rounded-full mt-1 overflow-hidden"
            style={{ background: "var(--color-bg-tertiary)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-600"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${color}, ${color}88)`,
                transition: "width 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </div>
        </div>
        {streak >= 2 && (
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: "rgba(255,150,0,0.15)", color: "var(--color-streak)" }}
          >
            🔥 {streak}連続
          </div>
        )}
      </div>

      {/* 問題カード */}
      <div
        className="flex-1 flex flex-col"
        style={{
          animation:
            cardAnim === "correct"
              ? "correctBounce 0.5s ease"
              : cardAnim === "shake"
              ? "shake 0.4s ease"
              : undefined,
        }}
      >
        {/* 問題タイプバッジ */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: color + "15", color }}
          >
            {currentQ.type === "multiple"
              ? "四択問題"
              : currentQ.type === "fill"
              ? "穴埋め問題"
              : "記述問題"}
          </span>
          {answerState === "correct" && (
            <CheckCircle2 size={18} style={{ color: "var(--color-brand-green)" }} />
          )}
          {answerState === "incorrect" && (
            <XCircle size={18} style={{ color: "var(--color-error)" }} />
          )}
        </div>

        {/* 問題文 */}
        <div
          className="rounded-2xl p-5 mb-5"
          style={{
            background: "var(--color-bg-primary)",
            border: `2px solid ${answerState === "correct" ? "var(--color-brand-green)" : answerState === "incorrect" ? "var(--color-error)" : "var(--color-bg-tertiary)"}`,
            boxShadow:
              answerState === "correct"
                ? "0 4px 15px rgba(88,204,2,0.2)"
                : answerState === "incorrect"
                ? "0 4px 15px rgba(255,75,75,0.15)"
                : "var(--shadow-card)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        >
          <p className="text-lg font-medium leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
            {currentQ.question}
          </p>
        </div>

        {/* 回答エリア */}
        {currentQ.type === "multiple" && currentQ.choices && (
          <div className="space-y-2.5">
            {currentQ.choices.map((choice, i) => {
              const isCorrectChoice = normalizeAnswer(choice) === normalizeAnswer(currentQ.answer);
              const isSelected = normalizeAnswer(userAnswer) === normalizeAnswer(choice);
              let bg = "var(--color-bg-primary)";
              let border = "var(--color-bg-tertiary)";
              let textColor = "var(--color-text-primary)";

              if (answerState !== "unanswered") {
                if (isCorrectChoice) {
                  bg = "rgba(88,204,2,0.1)";
                  border = "var(--color-brand-green)";
                  textColor = "var(--color-brand-green)";
                } else if (isSelected && !isCorrectChoice) {
                  bg = "rgba(255,75,75,0.08)";
                  border = "var(--color-error)";
                  textColor = "var(--color-error)";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (answerState !== "unanswered") return;
                    setUserAnswer(choice);
                    handleAnswer(choice);
                  }}
                  disabled={answerState !== "unanswered"}
                  className="w-full text-left px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-150"
                  style={{
                    background: bg,
                    border: `2px solid ${border}`,
                    color: textColor,
                    transform:
                      answerState === "unanswered"
                        ? undefined
                        : isCorrectChoice
                        ? "none"
                        : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (answerState === "unanswered") {
                      e.currentTarget.style.borderColor = color;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (answerState === "unanswered") {
                      e.currentTarget.style.borderColor = "var(--color-bg-tertiary)";
                      e.currentTarget.style.transform = "";
                    }
                  }}
                >
                  <span
                    className="inline-block w-6 h-6 rounded-full text-xs font-bold text-center leading-6 mr-3 flex-shrink-0"
                    style={{
                      background:
                        answerState !== "unanswered" && isCorrectChoice
                          ? "var(--color-brand-green)"
                          : answerState !== "unanswered" && isSelected
                          ? "var(--color-error)"
                          : "var(--color-bg-tertiary)",
                      color:
                        (answerState !== "unanswered" && isCorrectChoice) ||
                        (answerState !== "unanswered" && isSelected)
                          ? "#fff"
                          : "var(--color-text-muted)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {["A", "B", "C", "D"][i]}
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>
        )}

        {currentQ.type === "fill" && (
          <div className="space-y-3">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && userAnswer.trim()) handleAnswer();
              }}
              placeholder="答えを入力..."
              disabled={answerState !== "unanswered"}
              className="w-full px-4 py-3.5 rounded-xl text-base font-medium transition-all"
              style={{
                background: "var(--color-bg-primary)",
                border: `2px solid ${answerState === "correct" ? "var(--color-brand-green)" : answerState === "incorrect" ? "var(--color-error)" : "var(--color-bg-tertiary)"}`,
                color: "var(--color-text-primary)",
                outline: "none",
              }}
              onFocus={(e) => {
                if (answerState === "unanswered")
                  e.currentTarget.style.borderColor = color;
              }}
              onBlur={(e) => {
                if (answerState === "unanswered")
                  e.currentTarget.style.borderColor = "var(--color-bg-tertiary)";
              }}
            />
            {answerState === "unanswered" && (
              <button
                onClick={() => userAnswer.trim() && handleAnswer()}
                disabled={!userAnswer.trim()}
                className="w-full py-3 rounded-pill font-bold text-white transition-all duration-120 disabled:opacity-40 hover:-translate-y-0.5"
                style={{
                  background: color,
                  boxShadow: `0 4px 12px ${color}40`,
                }}
              >
                答え合わせ
              </button>
            )}
          </div>
        )}

        {currentQ.type === "description" && (
          <div className="space-y-3">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="記述式の答えを入力..."
              rows={4}
              disabled={answerState !== "unanswered"}
              className="w-full px-4 py-3 rounded-xl text-base transition-all resize-none"
              style={{
                background: "var(--color-bg-primary)",
                border: `2px solid ${answerState !== "unanswered" ? color : "var(--color-bg-tertiary)"}`,
                color: "var(--color-text-primary)",
                outline: "none",
              }}
              onFocus={(e) => {
                if (answerState === "unanswered")
                  e.currentTarget.style.borderColor = color;
              }}
              onBlur={(e) => {
                if (answerState === "unanswered")
                  e.currentTarget.style.borderColor = "var(--color-bg-tertiary)";
              }}
            />
            {answerState === "unanswered" && (
              <button
                onClick={() => handleAnswer()}
                className="w-full py-3 rounded-pill font-bold text-white transition-all duration-120 hover:-translate-y-0.5"
                style={{
                  background: color,
                  boxShadow: `0 4px 12px ${color}40`,
                }}
              >
                模範解答を見る
              </button>
            )}
          </div>
        )}

        {/* 解説 */}
        {showExplanation && (
          <div
            className="mt-4 p-4 rounded-xl"
            style={{
              background:
                answerState === "correct"
                  ? "rgba(88,204,2,0.08)"
                  : answerState === "incorrect"
                  ? "rgba(255,75,75,0.06)"
                  : "rgba(255,217,0,0.08)",
              border: `1px solid ${answerState === "correct" ? "rgba(88,204,2,0.25)" : answerState === "incorrect" ? "rgba(255,75,75,0.2)" : "rgba(255,217,0,0.25)"}`,
            }}
          >
            {answerState === "incorrect" && (
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-error)" }}>
                正解: {currentQ.answer}
              </p>
            )}
            {answerState === "correct" && currentQ.type === "description" && (
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-brand-green)" }}>
                模範解答: {currentQ.answer}
              </p>
            )}
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              💡 {currentQ.explanation}
            </p>
          </div>
        )}
      </div>

      {/* 次へボタン */}
      {answerState !== "unanswered" && (
        <div className="pt-4 mt-auto">
          <button
            onClick={handleNext}
            className="w-full py-3.5 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all duration-120 hover:-translate-y-0.5"
            style={{
              background:
                answerState === "correct"
                  ? "var(--color-brand-green)"
                  : "var(--color-brand-blue)",
              boxShadow:
                answerState === "correct"
                  ? "0 4px 15px rgba(88,204,2,0.35)"
                  : "0 4px 12px rgba(28,176,246,0.4)",
            }}
          >
            {currentIndex + 1 >= questions.length ? "結果を見る" : "次の問題"}
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
