import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { adminDb } from "@/lib/firebase/admin";
import { getMessaging } from "firebase-admin/messaging";
import adminDefault from "@/lib/firebase/admin";
import { differenceInDays } from "date-fns";
import { Timestamp } from "firebase-admin/firestore";
import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "StudyPal <noreply@studypal.app>";

async function sendPush(token: string, title: string, body: string, url = "/dashboard") {
  try {
    const messaging = getMessaging(adminDefault.app);
    await messaging.send({
      token,
      notification: { title, body },
      webpush: { fcmOptions: { link: url } },
    });
  } catch {
    // トークンが無効など — スキップ
  }
}

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mode = new URL(req.url).searchParams.get("mode") ?? "evening"; // "evening" | "morning"
  const today = new Date().toISOString().slice(0, 10);

  // ユーザー全員取得（通知有効 + FCMトークンあり）
  const usersSnap = await adminDb.collection("users")
    .where("notificationsEnabled", "==", true)
    .where("fcmToken", "!=", null)
    .get();

  let sent = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const token: string = data.fcmToken;
    if (!token) continue;

    if (mode === "evening") {
      // 毎晩: 今日まだ勉強してないユーザーにリマインダー
      if (data.notifyDailyReminder !== false) {
        const lastStudy = data.lastStudyDate as string | null;
        if (lastStudy !== today) {
          await sendPush(token, "今日もまだ間に合う！🔥", "少しでいいから勉強しよう。ストリークを守れ！", "/study");
          sent++;
        }
      }

      // ストリーク継続通知
      if (data.notifyStreak !== false && (data.currentStreak ?? 0) >= 3) {
        await sendPush(
          token,
          `${data.currentStreak}日連続達成中！🎯`,
          "今日も続けて記録を伸ばそう！",
          "/study"
        );
        sent++;
      }
    }

    if (mode === "morning") {
      // テストリマインダー
      if (data.notifyTestReminder !== false) {
        const testsSnap = await adminDb.collection("tests")
          .where("userId", "==", userDoc.id)
          .where("testDate", ">=", Timestamp.fromDate(new Date()))
          .orderBy("testDate", "asc")
          .limit(3)
          .get();

        for (const testDoc of testsSnap.docs) {
          const testData = testDoc.data();
          const testDate: Date = (testData.testDate as Timestamp).toDate();
          const daysLeft = differenceInDays(testDate, new Date());

          if (daysLeft === 0) {
            await sendPush(token, `今日は${testData.subject}のテスト！💪`, "最終確認をしよう！", `/tests/${testDoc.id}`);
            sent++;
          } else if (daysLeft === 1) {
            await sendPush(token, `明日は${testData.subject}のテスト！📚`, "最終確認をしておこう", `/tests/${testDoc.id}`);
            sent++;
          } else if (daysLeft === 3) {
            await sendPush(token, `${testData.subject}のテストまであと3日！📅`, "計画的に準備しよう", `/tests/${testDoc.id}`);
            sent++;
          }

          // 緊急アラート: テスト3日以内で今週の勉強がゼロ → 保護者にメール
          if (daysLeft <= 3 && daysLeft >= 0 && data.plan === "family" && data.parentEmail) {
            const weekAgoStr = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
            const todayStr = new Date().toISOString().slice(0, 10);
            const sessionsSnap = await adminDb.collection("studySessions")
              .where("userId", "==", userDoc.id)
              .where("subject", "==", testData.subject)
              .where("date", ">=", weekAgoStr)
              .where("date", "<=", todayStr)
              .limit(1)
              .get();

            if (sessionsSnap.empty) {
              const childName: string = data.name ?? "お子さん";
              await resend.emails.send({
                from: FROM_EMAIL,
                to: data.parentEmail as string,
                subject: `🚨 緊急：${childName}さんが${testData.subject}のテスト${daysLeft}日前なのに未勉強です`,
                html: `
                  <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
                    <div style="background:linear-gradient(135deg,#FF4B4B,#FF9600);border-radius:16px;padding:24px;text-align:center;margin-bottom:16px">
                      <p style="color:white;font-size:28px;margin:0">🚨</p>
                      <h1 style="color:white;font-size:20px;font-weight:900;margin:8px 0 0">緊急アラート</h1>
                    </div>
                    <div style="background:#fff;border-radius:16px;padding:20px;border:2px solid rgba(255,75,75,0.2)">
                      <p style="font-size:15px;color:#1A1A1A;line-height:1.6">
                        <strong>${childName}さん</strong>の<strong>${testData.subject}</strong>のテストが
                        <strong style="color:#FF4B4B">あと${daysLeft}日</strong>ですが、
                        今週まだ${testData.subject}の勉強をしていません。
                      </p>
                      <p style="font-size:13px;color:#6B7280;margin-top:12px">
                        声かけのタイミングかもしれません。
                      </p>
                    </div>
                    <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">
                      StudyPal · <a href="https://studypal-chi.vercel.app/parent" style="color:#1CB0F6">ダッシュボードで確認</a>
                    </p>
                  </div>
                `,
              }).catch(() => {});
              sent++;
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent, mode });
}
