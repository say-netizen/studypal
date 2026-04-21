import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { adminDb } from "@/lib/firebase/admin";
import { Resend } from "resend";
import { differenceInDays } from "date-fns";
import { Timestamp } from "firebase-admin/firestore";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "StudyPal <noreply@studypal.app>";

function getTestPrepLabel(sessionCount: number, daysLeft: number): string {
  if (sessionCount === 0) return "😟 まだ何もしてない";
  if (sessionCount >= 3 || daysLeft > 3) return "💪 準備OK";
  return "📖 準備中";
}

function buildEmailHtml(params: {
  childName: string;
  scheduledRate: number;
  freeCount: number;
  streak: number;
  testCount: number;
  autonomyScore: number;
  testStatuses: { subject: string; daysLeft: number; label: string }[];
  goals: { description: string; targetScore: number }[];
}) {
  const { childName, scheduledRate, freeCount, streak, testCount, autonomyScore, testStatuses, goals } = params;

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;background:#F7F7F8;padding:20px;margin:0">
<div style="max-width:500px;margin:0 auto">
  <!-- ヘッダー -->
  <div style="background:linear-gradient(135deg,#58CC02,#1CB0F6);border-radius:20px;padding:28px;text-align:center;margin-bottom:16px">
    <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0 0 4px">今週の学習レポート</p>
    <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0">${childName}さんのレポート 📊</h1>
  </div>

  <!-- 自主性スコア -->
  <div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:12px;border:2px solid rgba(88,204,2,0.2)">
    <p style="font-size:12px;color:#58CC02;font-weight:700;margin:0 0 8px">🧠 自主性スコア</p>
    <div style="display:flex;align-items:center;gap:16px">
      <div style="width:64px;height:64px;border-radius:50%;background:conic-gradient(#58CC02 ${autonomyScore * 3.6}deg,#EFEFEF 0);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <div style="width:48px;height:48px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center">
          <span style="font-size:18px;font-weight:900;color:#58CC02">${autonomyScore}</span>
        </div>
      </div>
      <div>
        <p style="margin:0 0 4px;font-size:13px;color:#1A1A1A">「うちの子、自分で考えて勉強してる」</p>
        <p style="margin:0;font-size:12px;color:#9CA3AF">100点満点で評価</p>
      </div>
    </div>
  </div>

  <!-- 指標グリッド -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
    ${[
      { label: "📅 予定通り勉強した率", value: `${scheduledRate}%` },
      { label: "⚡ 自発的に勉強した回数", value: `${freeCount}回` },
      { label: "🔥 ストリーク継続", value: `${streak}日` },
      { label: "📝 テスト登録数", value: `${testCount}件` },
    ].map((item) => `
    <div style="background:#fff;border-radius:12px;padding:14px">
      <p style="font-size:11px;color:#6B7280;margin:0 0 4px">${item.label}</p>
      <p style="font-size:20px;font-weight:900;color:#1A1A1A;margin:0">${item.value}</p>
    </div>`).join("")}
  </div>

  ${testStatuses.length > 0 ? `
  <!-- テスト準備 -->
  <div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:12px">
    <p style="font-size:13px;font-weight:700;color:#1A1A1A;margin:0 0 12px">📚 テストまでの準備状況</p>
    ${testStatuses.map((t) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #EFEFEF">
      <div>
        <p style="font-size:13px;font-weight:600;color:#1A1A1A;margin:0">${t.subject}</p>
        <p style="font-size:11px;color:#9CA3AF;margin:0">あと${t.daysLeft}日</p>
      </div>
      <span style="font-size:12px;font-weight:700;padding:4px 10px;border-radius:9999px;background:${t.label.includes("OK") ? "rgba(88,204,2,0.12)" : t.label.includes("中") ? "rgba(255,150,0,0.12)" : "rgba(255,75,75,0.12)"};color:${t.label.includes("OK") ? "#58CC02" : t.label.includes("中") ? "#FF9600" : "#FF4B4B"}">${t.label}</span>
    </div>`).join("")}
  </div>` : ""}

  ${goals.length > 0 ? `
  <!-- 目標 -->
  <div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:12px">
    <p style="font-size:13px;font-weight:700;color:#1A1A1A;margin:0 0 12px">🎯 ${childName}さんの目標</p>
    ${goals.map((g) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0">
      <span style="font-size:14px">🎯</span>
      <p style="font-size:13px;color:#1A1A1A;margin:0">${g.description}（目標${g.targetScore}点）</p>
    </div>`).join("")}
  </div>` : ""}

  <!-- フッター -->
  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:20px">
    StudyPal 週次レポート · <a href="https://studypal-chi.vercel.app/parent" style="color:#1CB0F6">ダッシュボードで詳細を見る</a>
  </p>
</div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  // FamilyプランでparentEmailがあり、weeklyReportを無効にしていないユーザーのみ
  const usersSnap = await adminDb.collection("users")
    .where("plan", "==", "family")
    .where("parentEmail", "!=", null)
    .get();

  let sent = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const parentEmail: string = data.parentEmail;
    if (!parentEmail) continue;
    if (data.weeklyReport === false) continue;

    const uid = userDoc.id;
    const childName: string = data.name ?? "お子さん";

    // studySessions 取得
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
    const streak: number = data.currentStreak ?? 0;

    // テスト取得
    const testsSnap = await adminDb.collection("tests")
      .where("userId", "==", uid)
      .where("testDate", ">=", Timestamp.fromDate(today))
      .orderBy("testDate", "asc")
      .limit(4)
      .get();

    const testStatuses: { subject: string; daysLeft: number; label: string }[] = [];
    for (const testDoc of testsSnap.docs) {
      const t = testDoc.data();
      const daysLeft = differenceInDays((t.testDate as Timestamp).toDate(), today);
      const subjSessions = sessions.filter((s) => s.subject === t.subject);
      testStatuses.push({
        subject: t.subject,
        daysLeft,
        label: getTestPrepLabel(subjSessions.length, daysLeft),
      });
    }

    // 目標
    const goalsSnap = await adminDb.collection("goals")
      .where("userId", "==", uid)
      .where("achieved", "==", false)
      .limit(3)
      .get();
    const goals = goalsSnap.docs.map((d) => d.data() as { description: string; targetScore: number });

    // 自主性スコア
    const streakScore = Math.min(streak / 7, 1) * 100;
    const autonomyScore = Math.round(scheduledRate * 0.5 + (freeCount > 0 ? 100 : 0) * 0.3 + streakScore * 0.2);

    const html = buildEmailHtml({
      childName,
      scheduledRate,
      freeCount,
      streak,
      testCount: testsSnap.size,
      autonomyScore,
      testStatuses,
      goals,
    });

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: parentEmail,
        subject: `📊 今週の${childName}さんレポート — 自主性スコア ${autonomyScore}点`,
        html,
      });
      sent++;
    } catch (e) {
      console.error("Email send error:", uid, e);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
