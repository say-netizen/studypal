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
      webpush: {
        notification: { icon: "/icons/icon-192x192.png" },
        fcmOptions: { link: url },
      },
    });
  } catch {
    // トークンが無効など — スキップ
  }
}

async function resolveParentEmail(data: FirebaseFirestore.DocumentData): Promise<string | null> {
  const direct = (data.parentEmail as string | null) ?? null;
  if (direct) return direct;
  const parentUid = (data.parentUid as string | null) ?? null;
  if (!parentUid) return null;
  const parentSnap = await adminDb.collection("users").doc(parentUid).get();
  return (parentSnap.data()?.email as string | null) ?? null;
}

export async function GET(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mode = new URL(req.url).searchParams.get("mode") ?? "evening";
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const weekAgoStr = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  let sent = 0;

  // ── evening: FCMトークン保持ユーザーへのプッシュ通知 ──
  if (mode === "evening") {
    const usersSnap = await adminDb.collection("users")
      .where("notificationsEnabled", "==", true)
      .where("fcmToken", "!=", null)
      .get();

    for (const userDoc of usersSnap.docs) {
      const data = userDoc.data();
      const token: string = data.fcmToken;
      if (!token) continue;

      if (data.notifyDailyReminder !== false) {
        const lastStudy = data.lastStudyDate as string | null;
        if (lastStudy !== todayStr) {
          await sendPush(token, "今日もまだ間に合う！🔥", "少しでいいから勉強しよう。ストリークを守れ！", "/study");
          sent++;
        }
      }

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
  }

  // ── morning: テストリマインダー (push) + 保護者アラート (email) ──
  if (mode === "morning") {
    // 1. プッシュ通知: FCMトークンありのユーザー
    const pushUsersSnap = await adminDb.collection("users")
      .where("notificationsEnabled", "==", true)
      .where("fcmToken", "!=", null)
      .get();

    for (const userDoc of pushUsersSnap.docs) {
      const data = userDoc.data();
      const token: string = data.fcmToken;
      if (!token || data.notifyTestReminder === false) continue;

      const testsSnap = await adminDb.collection("tests")
        .where("userId", "==", userDoc.id)
        .where("testDate", ">=", Timestamp.fromDate(today))
        .orderBy("testDate", "asc")
        .limit(3)
        .get();

      for (const testDoc of testsSnap.docs) {
        const testData = testDoc.data();
        const testDate: Date = (testData.testDate as Timestamp).toDate();
        const daysLeft = differenceInDays(testDate, today);

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

    // 2. 保護者メールアラート: familyプランの全子どもユーザー (FCMトークン有無不問)
    const familyUsersSnap = await adminDb.collection("users")
      .where("plan", "==", "family")
      .get();

    for (const userDoc of familyUsersSnap.docs) {
      const data = userDoc.data();
      const childUid = userDoc.id;

      const parentEmail = await resolveParentEmail(data);
      if (!parentEmail) continue;

      const testsSnap = await adminDb.collection("tests")
        .where("userId", "==", childUid)
        .where("testDate", ">=", Timestamp.fromDate(today))
        .orderBy("testDate", "asc")
        .limit(5)
        .get();

      if (testsSnap.empty) continue;

      const childName: string = (data.name as string) ?? "お子さん";

      for (const testDoc of testsSnap.docs) {
        const testData = testDoc.data();
        const testDate: Date = (testData.testDate as Timestamp).toDate();
        const daysLeft = differenceInDays(testDate, today);

        if (daysLeft < 0 || daysLeft > 3) continue;

        const sessionsSnap = await adminDb.collection("studySessions")
          .where("userId", "==", childUid)
          .where("subject", "==", testData.subject)
          .where("date", ">=", weekAgoStr)
          .where("date", "<=", todayStr)
          .limit(1)
          .get();

        if (!sessionsSnap.empty) continue;

        const urgencyColor = daysLeft === 0 ? "#FF4B4B" : daysLeft === 1 ? "#FF6B35" : "#FF9600";
        const urgencyText = daysLeft === 0 ? "今日がテスト当日" : daysLeft === 1 ? "明日がテスト" : `あと${daysLeft}日`;

        await resend.emails.send({
          from: FROM_EMAIL,
          to: parentEmail,
          subject: `🚨 【StudyPal】${childName}さんが${testData.subject as string}のテスト${urgencyText}なのに未勉強です`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:20px;background:#F7F7F8">
              <div style="background:linear-gradient(135deg,${urgencyColor},#FF9600);border-radius:20px;padding:28px;text-align:center;margin-bottom:16px">
                <p style="color:white;font-size:36px;margin:0">🚨</p>
                <h1 style="color:white;font-size:22px;font-weight:900;margin:8px 0 4px">緊急アラート</h1>
                <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0">${urgencyText}</p>
              </div>
              <div style="background:white;border-radius:20px;padding:24px;border:2px solid rgba(255,75,75,0.15);margin-bottom:16px">
                <p style="font-size:15px;color:#1A1A1A;line-height:1.7;margin:0 0 16px">
                  <strong>${childName}さん</strong>の
                  <strong style="color:${urgencyColor}">${testData.subject as string}</strong>のテストが
                  <strong style="color:${urgencyColor}">${urgencyText}</strong>ですが、<br>
                  今週まだ<strong>${testData.subject as string}</strong>の勉強をしていません。
                </p>
                <div style="background:#FFF8F0;border-radius:12px;padding:16px">
                  <p style="font-size:13px;color:#6B7280;margin:0;line-height:1.6">
                    💡 声かけのタイミングかもしれません。<br>
                    一緒に今日の勉強計画を立てていただけると、${childName}さんの力になれます。
                  </p>
                </div>
              </div>
              <div style="text-align:center">
                <a
                  href="https://studypal-chi.vercel.app/parent"
                  style="display:inline-block;background:linear-gradient(135deg,#9B5DE5,#1CB0F6);color:white;font-weight:700;font-size:14px;padding:14px 28px;border-radius:9999px;text-decoration:none"
                >
                  保護者ダッシュボードで確認 →
                </a>
              </div>
              <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:16px">
                StudyPal · このメールはStudyPal Familyプランの設定に基づいて送信されています
              </p>
            </div>
          `,
        }).catch(() => {});
        sent++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent, mode });
}
