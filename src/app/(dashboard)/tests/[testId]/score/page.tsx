"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { getTest, getUserTests, recordTestScore, type TestDoc } from "@/lib/firebase/schema";
import { ArrowLeft, CheckCircle2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const SUBJECT_COLORS: Record<string, string> = {
  国語: "#9B5DE5", 数学: "#1CB0F6", 英語: "#58CC02", 理科: "#00C9A7", 社会: "#FF9600",
};

export default function TestScorePage() {
  const { testId } = useParams<{ testId: string }>();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [test, setTest] = useState<(TestDoc & { id: string }) | null>(null);
  const [prevTest, setPrevTest] = useState<(TestDoc & { id: string }) | null>(null);
  const [actualScore, setActualScore] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      const [testData, allTests] = await Promise.all([
        getTest(testId),
        getUserTests(currentUser!.uid, 20),
      ]);
      const t = testData as (TestDoc & { id: string }) | null;
      setTest(t);
      if (t?.actualScore != null) {
        setActualScore(String(t.actualScore));
        setMaxScore(String(t.maxScore ?? 100));
      }

      // 同科目の前回テストを探す
      const sameSubject = (allTests as (TestDoc & { id: string })[])
        .filter((x) => x.subject === t?.subject && x.id !== testId && x.actualScore != null)
        .sort((a, b) => b.testDate.toDate().getTime() - a.testDate.toDate().getTime());
      if (sameSubject.length > 0) setPrevTest(sameSubject[0]);

      setLoading(false);
    }
    load();
  }, [currentUser, testId]);

  async function handleSave() {
    const score = Number(actualScore);
    const max = Number(maxScore);
    if (isNaN(score) || score < 0 || score > max) {
      alert("有効な点数を入力してください");
      return;
    }
    setSaving(true);
    try {
      await recordTestScore(testId, score, max);
      setSaved(true);
      setTimeout(() => router.push(`/tests/${testId}`), 1200);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen />;

  if (!test) {
    return (
      <div className="max-w-sm mx-auto px-4 py-10 text-center">
        <p style={{ color: "var(--color-text-muted)" }}>テストが見つかりません</p>
      </div>
    );
  }

  const color = SUBJECT_COLORS[test.subject] ?? "var(--color-brand-blue)";
  const pct = actualScore && maxScore ? Math.round((Number(actualScore) / Number(maxScore)) * 100) : null;
  const prevPct = prevTest?.actualScore != null && prevTest?.maxScore
    ? Math.round((prevTest.actualScore / prevTest.maxScore) * 100)
    : null;
  const diff = pct !== null && prevPct !== null ? pct - prevPct : null;

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href={`/tests/${testId}`}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
        >
          <ArrowLeft size={18} style={{ color: "var(--color-text-secondary)" }} />
        </Link>
        <h1 className="text-xl font-display font-black" style={{ color: "var(--color-text-primary)" }}>
          テスト結果を入力
        </h1>
      </div>

      {/* テスト情報 */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)" }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: color + "15" }}>
          {test.subject === "国語" ? "📖" : test.subject === "数学" ? "📐" : test.subject === "英語" ? "🌍" : test.subject === "理科" ? "🔬" : "🗺️"}
        </div>
        <div>
          <p className="font-bold" style={{ color }}>
            {test.subject}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {format(test.testDate.toDate(), "yyyy年M月d日（E）", { locale: ja })}
          </p>
        </div>
      </div>

      {/* 点数入力 */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "var(--color-bg-primary)", border: "1px solid var(--color-bg-tertiary)", boxShadow: "var(--shadow-card)" }}
      >
        <div>
          <label className="text-sm font-semibold mb-2 block" style={{ color: "var(--color-text-secondary)" }}>
            得点
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={actualScore}
              onChange={(e) => setActualScore(e.target.value)}
              placeholder="80"
              min="0"
              max={maxScore}
              className="flex-1 text-3xl font-display font-black text-center py-3 rounded-2xl outline-none"
              style={{
                background: "var(--color-bg-secondary)",
                border: `2px solid ${color}40`,
                color: "var(--color-text-primary)",
              }}
            />
            <span className="text-2xl font-bold" style={{ color: "var(--color-text-muted)" }}>/</span>
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              min="1"
              className="w-20 text-xl font-display font-bold text-center py-3 rounded-2xl outline-none"
              style={{
                background: "var(--color-bg-secondary)",
                border: "2px solid var(--color-bg-tertiary)",
                color: "var(--color-text-muted)",
              }}
            />
          </div>
        </div>

        {/* プレビュー */}
        {pct !== null && (
          <div className="text-center py-2">
            <p
              className="text-4xl font-display font-black"
              style={{ color: pct >= 80 ? "var(--color-brand-green)" : pct >= 60 ? "var(--color-warning)" : "var(--color-error)" }}
            >
              {pct}%
            </p>
            {diff !== null && (
              <div className="flex items-center justify-center gap-1 mt-1">
                {diff > 0
                  ? <TrendingUp size={14} style={{ color: "var(--color-brand-green)" }} />
                  : diff < 0
                  ? <TrendingDown size={14} style={{ color: "var(--color-error)" }} />
                  : <Minus size={14} style={{ color: "var(--color-text-muted)" }} />}
                <span
                  className="text-sm font-bold"
                  style={{ color: diff > 0 ? "var(--color-brand-green)" : diff < 0 ? "var(--color-error)" : "var(--color-text-muted)" }}
                >
                  {diff > 0 ? `+${diff}pt` : diff < 0 ? `${diff}pt` : "前回と同じ"}
                  {diff !== 0 && <span className="font-normal text-xs" style={{ color: "var(--color-text-muted)" }}> 前回比</span>}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(88,204,2,0.1)" }}>
          <CheckCircle2 size={18} style={{ color: "var(--color-brand-green)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--color-brand-green)" }}>保存しました！</p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!actualScore || saving || saved}
        className="w-full py-3.5 rounded-pill font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: color, boxShadow: `0 4px 12px ${color}40` }}
      >
        {saving ? (
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white" />
        ) : (
          <TrendingUp size={16} />
        )}
        {saving ? "保存中..." : "結果を保存"}
      </button>
    </div>
  );
}
