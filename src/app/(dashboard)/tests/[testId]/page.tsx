"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getTest,
  getTestQuestions,
  getUser,
  type TestDoc,
  type QuestionDoc,
} from "@/lib/firebase/schema";
import { differenceInDays, format } from "date-fns";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ja } from "date-fns/locale";
import {
  ArrowLeft,
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  AlertCircle,
  Lock,
  PenLine,
} from "lucide-react";

const SUBJECT_COLORS: Record<string, string> = {
  国語: "#9B5DE5",
  数学: "#1CB0F6",
  英語: "#58CC02",
  理科: "#00C9A7",
  社会: "#FF9600",
};

const SUBJECT_ICONS: Record<string, string> = {
  国語: "📖",
  数学: "📐",
  英語: "🌍",
  理科: "🔬",
  社会: "🗺️",
};

const TYPE_LABELS: Record<string, string> = {
  multiple: "四択",
  fill: "穴埋め",
  description: "記述",
};

type GenerateStatus = "idle" | "loading" | "success" | "error" | "limit";

export default function TestDetailPage() {
  const { testId } = useParams<{ testId: string }>();
  const { currentUser } = useAuth();

  const [test, setTest] = useState<(TestDoc & { id: string }) | null>(null);
  const [questions, setQuestions] = useState<(QuestionDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "family">("free");
  const [genStatus, setGenStatus] = useState<GenerateStatus>("idle");
  const [genError, setGenError] = useState("");
  const [usageInfo, setUsageInfo] = useState<{
    count: number;
    limit: number;
  } | null>(null);

  async function loadData() {
    if (!currentUser) return;
    try {
      const [testData, qList, userData] = await Promise.all([
        getTest(testId),
        getTestQuestions(testId),
        getUser(currentUser.uid),
      ]);
      setTest(testData as (TestDoc & { id: string }) | null);
      setQuestions(qList as (QuestionDoc & { id: string })[]);
      setUserPlan(userData?.plan ?? "free");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, testId]);

  async function handleGenerateQuestions() {
    if (!currentUser || !test) return;
    setGenStatus("loading");
    setGenError("");
    try {
      const token = await currentUser.getIdToken();
      // @ts-expect-error schema拡張フィールド
      const attachments: string[] = test.attachments ?? [];
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          testId: test.id,
          subject: test.subject,
          range: test.range,
          fileUrls: attachments,
        }),
      });

      const data = await res.json();

      if (res.status === 403) {
        setGenStatus("limit");
        setUsageInfo({ count: data.usageCount, limit: data.usageLimit });
        return;
      }
      if (!res.ok) {
        setGenStatus("error");
        setGenError(data.error ?? "問題生成に失敗しました");
        return;
      }

      setUsageInfo({ count: data.usageCount, limit: data.usageLimit });
      setGenStatus("success");
      // 問題を再取得
      await loadData();
    } catch {
      setGenStatus("error");
      setGenError("ネットワークエラーが発生しました");
    }
  }

  if (loading) return <LoadingScreen />;

  if (!test) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p style={{ color: "var(--color-text-muted)" }}>テストが見つかりません</p>
        <Link href="/tests" className="mt-4 inline-block text-sm font-semibold" style={{ color: "var(--color-brand-blue)" }}>
          テスト一覧へ戻る
        </Link>
      </div>
    );
  }

  const color = SUBJECT_COLORS[test.subject] ?? "var(--color-brand-blue)";
  const icon = SUBJECT_ICONS[test.subject] ?? "📝";
  const days = differenceInDays(test.testDate.toDate(), new Date());

  const typeCount = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] ?? 0) + 1;
    return acc;
  }, {});

  const answeredCount = questions.filter((q) => q.isCorrect !== null).length;
  const correctCount = questions.filter((q) => q.isCorrect === true).length;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link
          href="/tests"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <h1 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          テスト詳細
        </h1>
      </div>

      {/* テスト情報カード */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--color-bg-primary)",
          border: "1px solid var(--color-bg-tertiary)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: color + "15" }}
          >
            {icon}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-black" style={{ color }}>
              {test.subject}
            </h2>
            <p className="text-sm flex items-center gap-1.5 mt-1" style={{ color: "var(--color-text-muted)" }}>
              <Clock size={13} />
              {format(test.testDate.toDate(), "yyyy年M月d日（E）", { locale: ja })}
            </p>
            {days >= 0 && (
              <span
                className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full"
                style={{
                  background: (days <= 7 ? "var(--color-error)" : color) + "18",
                  color: days <= 7 ? "var(--color-error)" : color,
                }}
              >
                あと{days}日
              </span>
            )}
          </div>
        </div>

        {test.range && (
          <div
            className="mt-4 pt-4 border-t"
            style={{ borderColor: "var(--color-bg-tertiary)" }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>
              出題範囲
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
              {test.range}
            </p>
          </div>
        )}

        {/* テスト結果入力ボタン */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--color-bg-tertiary)" }}>
          {test.actualScore != null ? (
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>テスト結果</p>
              <p className="text-lg font-display font-black" style={{ color: color }}>
                {test.actualScore} / {test.maxScore ?? 100}点
              </p>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>結果未入力</p>
          )}
          <Link
            href={`/tests/${testId}/score`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-bold transition-all hover:opacity-80"
            style={{ background: color + "15", color }}
          >
            <PenLine size={13} />
            結果を入力
          </Link>
        </div>
      </div>

      {/* 問題生成セクション */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--color-bg-primary)",
          border: "1px solid var(--color-bg-tertiary)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="font-display font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Sparkles size={18} style={{ color: "var(--color-brand-purple)" }} />
            AI予想問題
          </h3>
          {usageInfo && usageInfo.limit > 0 && (
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              今月 {usageInfo.count}/{usageInfo.limit} 回
            </span>
          )}
        </div>

        {/* Freeプランは Pro限定ゲート */}
        {userPlan === "free" ? (
          <div className="text-center py-5">
            <Lock size={36} className="mx-auto mb-3" style={{ color: "var(--color-brand-purple)" }} />
            <p className="text-sm font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
              Pro限定機能です
            </p>
            <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
              AI予想問題の生成はProプラン以上でご利用いただけます
            </p>
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-pill font-bold text-white transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #9B5DE5, #1CB0F6)",
                boxShadow: "0 4px 15px rgba(155,93,229,0.35)",
              }}
            >
              <Sparkles size={15} />
              Proにアップグレード
            </Link>
          </div>
        ) : questions.length === 0 ? (
          <>
            {genStatus === "limit" ? (
              <div className="text-center py-4">
                <Lock size={32} className="mx-auto mb-2" style={{ color: "var(--color-warning)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  今月の生成回数上限に達しました
                </p>
                <p className="text-xs mt-1 mb-3" style={{ color: "var(--color-text-muted)" }}>
                  Proプランなら無制限に使えます
                </p>
                <Link
                  href="/settings/billing"
                  className="inline-block px-5 py-2 rounded-pill text-sm font-bold text-white"
                  style={{ background: "var(--color-brand-purple)" }}
                >
                  Proにアップグレード
                </Link>
              </div>
            ) : genStatus === "error" ? (
              <div>
                <div
                  className="flex items-center gap-2 p-3 rounded-xl mb-3 text-sm"
                  style={{ background: "rgba(255,75,75,0.08)", color: "var(--color-error)" }}
                >
                  <AlertCircle size={16} />
                  {genError}
                </div>
                <button
                  onClick={handleGenerateQuestions}
                  className="w-full py-3 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: "var(--color-brand-purple)" }}
                >
                  <Sparkles size={16} />
                  再試行
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
                  出題範囲をもとにAIが予想問題を10問生成します。
                </p>
                <button
                  onClick={handleGenerateQuestions}
                  disabled={genStatus === "loading"}
                  className="w-full py-3 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all duration-120 disabled:opacity-70 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #9B5DE5, #1CB0F6)",
                    boxShadow: "0 4px 15px rgba(155,93,229,0.35)",
                  }}
                >
                  {genStatus === "loading" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      問題を生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      AI予想問題を生成する
                    </>
                  )}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {/* 問題一覧サマリー */}
            <div className="flex gap-3 mb-4">
              {Object.entries(typeCount).map(([type, count]) => (
                <div
                  key={type}
                  className="flex-1 text-center py-2 rounded-xl"
                  style={{ background: "var(--color-bg-secondary)" }}
                >
                  <p className="text-lg font-black font-display" style={{ color }}>
                    {count}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {TYPE_LABELS[type] ?? type}
                  </p>
                </div>
              ))}
            </div>

            {answeredCount > 0 && (
              <div
                className="flex items-center gap-3 p-3 rounded-xl mb-4"
                style={{ background: "rgba(88,204,2,0.08)" }}
              >
                <CheckCircle2 size={18} style={{ color: "var(--color-brand-green)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--color-brand-green)" }}>
                  {correctCount}/{answeredCount}問 正解
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Link
                href={`/tests/${testId}/quiz`}
                className="flex-1 py-3 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all duration-120 hover:-translate-y-0.5"
                style={{
                  background: "var(--color-brand-blue)",
                  boxShadow: "0 4px 12px rgba(28,176,246,0.4)",
                }}
              >
                <Play size={16} />
                問題を解く
              </Link>
              <button
                onClick={handleGenerateQuestions}
                disabled={genStatus === "loading"}
                className="px-4 py-3 rounded-pill font-bold flex items-center gap-2 transition-all duration-120 hover:-translate-y-0.5 disabled:opacity-60"
                style={{
                  background: "rgba(155,93,229,0.1)",
                  color: "var(--color-brand-purple)",
                }}
              >
                {genStatus === "loading" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                再生成
              </button>
            </div>

            {usageInfo && usageInfo.limit > 0 && (
              <p className="text-center text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
                今月 {usageInfo.count}/{usageInfo.limit} 回使用済み
              </p>
            )}
          </>
        )}
      </div>

      {/* 問題一覧 */}
      {questions.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: "var(--color-bg-primary)",
            border: "1px solid var(--color-bg-tertiary)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h3
            className="font-display font-bold mb-3 flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <FileText size={16} style={{ color: "var(--color-brand-blue)" }} />
            問題一覧 ({questions.length}問)
          </h3>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className="flex items-start gap-3 py-2.5 border-b last:border-b-0"
                style={{ borderColor: "var(--color-bg-tertiary)" }}
              >
                <span
                  className="flex-shrink-0 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      q.isCorrect === true
                        ? "rgba(88,204,2,0.15)"
                        : q.isCorrect === false
                        ? "rgba(255,75,75,0.15)"
                        : "var(--color-bg-tertiary)",
                    color:
                      q.isCorrect === true
                        ? "var(--color-brand-green)"
                        : q.isCorrect === false
                        ? "var(--color-error)"
                        : "var(--color-text-muted)",
                  }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm line-clamp-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {q.question}
                  </p>
                </div>
                <span
                  className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "var(--color-bg-tertiary)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {TYPE_LABELS[q.type]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
