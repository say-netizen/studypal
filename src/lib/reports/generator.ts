import Anthropic from "@anthropic-ai/sdk";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { differenceInDays, format, subDays } from "date-fns";
import { ja } from "date-fns/locale";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface ReportPayload {
  uid: string;
  weekStr: string;
  periodStart: string;
  periodEnd: string;
  childName: string;
  scheduledRate: number;
  freeCount: number;
  streak: number;
  testCount: number;
  autonomyScore: number;
  testStatuses: { subject: string; daysLeft: number; label: string }[];
  completedTests: { subject: string; date: string; actualScore: number; maxScore: number }[];
  goals: { description: string; targetScore: number }[];
  aiComment: string;
}

function getISOWeekStr(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getPrepLabel(sessionCount: number, totalMins: number, daysLeft: number): string {
  if (sessionCount === 0) return "まだ何もしてない";
  if (totalMins >= 60 || (daysLeft > 3 && sessionCount >= 2)) return "準備OK";
  return "準備中";
}

export async function generateWeeklyReportForUser(uid: string): Promise<ReportPayload> {
  const today = new Date();
  const weekAgo = subDays(today, 6);
  const todayStr = format(today, "yyyy-MM-dd");
  const weekAgoStr = format(weekAgo, "yyyy-MM-dd");
  const weekStr = getISOWeekStr(today);

  // ── ユーザー情報 ──
  const userSnap = await adminDb.collection("users").doc(uid).get();
  const userData = userSnap.data()!;
  const childName: string = userData.name ?? "お子さん";
  const streak: number = userData.currentStreak ?? 0;

  // ── 今週の学習セッション ──
  const sessionsSnap = await adminDb.collection("studySessions")
    .where("userId", "==", uid)
    .where("date", ">=", weekAgoStr)
    .where("date", "<=", todayStr)
    .get();
  const sessions = sessionsSnap.docs.map((d) => d.data());
  const totalCount = sessions.length;
  const scheduledCount = sessions.filter((s) => s.scheduleId !== null).length;
  const freeCount = sessions.filter((s) => s.scheduleId === null).length;
  const scheduledRate = totalCount > 0 ? Math.round((scheduledCount / totalCount) * 100) : 0;
  const streakScore = Math.min(streak / 7, 1) * 100;
  const autonomyScore = Math.round(
    scheduledRate * 0.5 + (freeCount > 0 ? 100 : 0) * 0.3 + streakScore * 0.2
  );

  // ── 今後のテスト（準備状況） ──
  const upcomingSnap = await adminDb.collection("tests")
    .where("userId", "==", uid)
    .where("testDate", ">=", Timestamp.fromDate(today))
    .orderBy("testDate", "asc")
    .limit(4)
    .get();

  const testStatuses: ReportPayload["testStatuses"] = [];
  for (const d of upcomingSnap.docs) {
    const t = d.data();
    const daysLeft = differenceInDays((t.testDate as Timestamp).toDate(), today);
    const subSessions = sessions.filter((s) => s.subject === t.subject);
    const totalMins = subSessions.reduce((a: number, b: Record<string, unknown>) => a + ((b.actualMinutes as number) ?? 0), 0);
    testStatuses.push({
      subject: t.subject,
      daysLeft,
      label: getPrepLabel(subSessions.length, totalMins, daysLeft),
    });
  }

  // ── 最近のテスト結果（得点入り） ──
  const thirtyDaysAgo = Timestamp.fromDate(subDays(today, 30));
  const completedSnap = await adminDb.collection("tests")
    .where("userId", "==", uid)
    .where("scoredAt", ">=", thirtyDaysAgo)
    .orderBy("scoredAt", "desc")
    .limit(5)
    .get();

  const completedTests: ReportPayload["completedTests"] = [];
  for (const d of completedSnap.docs) {
    const t = d.data();
    if (t.actualScore != null && t.maxScore != null) {
      completedTests.push({
        subject: t.subject,
        date: format((t.testDate as Timestamp).toDate(), "M月d日", { locale: ja }),
        actualScore: t.actualScore,
        maxScore: t.maxScore,
      });
    }
  }

  // ── 目標 ──
  const goalsSnap = await adminDb.collection("goals")
    .where("userId", "==", uid)
    .where("achieved", "==", false)
    .limit(3)
    .get();
  const goals = goalsSnap.docs.map((d) => {
    const g = d.data();
    return { description: g.description as string, targetScore: g.targetScore as number };
  });

  // ── Claude でAIコメント生成 ──
  const testStatusText = testStatuses.length > 0
    ? testStatuses.map((t) => `・${t.subject}: あと${t.daysLeft}日 → ${t.label}`).join("\n")
    : "・登録されているテストはありません";

  const completedTestText = completedTests.length > 0
    ? completedTests
        .map((t) => `・${t.subject}（${t.date}）: ${t.actualScore}/${t.maxScore}点（${Math.round((t.actualScore / t.maxScore) * 100)}%）`)
        .join("\n")
    : "・最近の得点記録はありません";

  const goalsText = goals.length > 0
    ? goals.map((g) => `・${g.description}（目標${g.targetScore}点）`).join("\n")
    : "・目標は設定されていません";

  const prompt = `あなたは小中学生の学習を支援するStudyPalのAIアシスタントです。
以下の学習データを分析して、保護者向けの週次レポートコメントを書いてください。

【今週の学習データ（${weekAgoStr}〜${todayStr}）】
・自主性スコア: ${autonomyScore}点/100点
・予定通りに勉強した率: ${scheduledRate}%（${scheduledCount}/${totalCount}回）
・自発的な学習（予定外）: ${freeCount}回
・ストリーク継続: ${streak}日

【テスト準備状況】
${testStatusText}

【最近のテスト結果】
${completedTestText}

【目標】
${goalsText}

---
以下の構成で保護者向けコメントを書いてください。
1. 今週の総評（1〜2文、数値を交えて）
2. 良かった点（具体的に1点）
3. アドバイスまたは注目点（1〜2文）

全体で180〜250文字程度。温かく前向きなトーンで。マークダウン・箇条書き・見出しは使わず、自然な文章で書いてください。`;

  let aiComment = "";
  try {
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });
    aiComment = result.content[0].type === "text" ? result.content[0].text.trim() : "";
  } catch (e) {
    console.error("Claude API error in report generation:", e);
    // フォールバック：シンプルなサマリー
    aiComment = `今週の自主性スコアは${autonomyScore}点でした。予定通りの学習率${scheduledRate}%、ストリーク${streak}日が記録されています。引き続き学習習慣を大切にしていきましょう。`;
  }

  return {
    uid,
    weekStr,
    periodStart: weekAgoStr,
    periodEnd: todayStr,
    childName,
    scheduledRate,
    freeCount,
    streak,
    testCount: upcomingSnap.size,
    autonomyScore,
    testStatuses,
    completedTests,
    goals,
    aiComment,
  };
}
