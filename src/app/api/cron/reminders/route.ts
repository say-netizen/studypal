import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getMessaging } from "firebase-admin/messaging";
import adminDefault from "@/lib/firebase/admin";
import { differenceInDays } from "date-fns";
import { Timestamp } from "firebase-admin/firestore";

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
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent, mode });
}
