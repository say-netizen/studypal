import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { differenceInDays } from "date-fns";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "StudyPal <noreply@studypal.app>";

// GET /api/cron/alerts
// 毎朝実行: テスト3日以内かつ未勉強の子どもの保護者にアラートメールを送信
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const weekAgoStr = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  // FamilyプランでparentEmailが設定されているユーザーを対象
  const usersSnap = await adminDb.collection("users")
    .where("plan", "==", "family")
    .get();

  let sent = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const childUid: string = userDoc.id;
    const parentEmail: string | null = (data.parentEmail as string | null) ?? null;
    const parentUid: string | null = (data.parentUid as string | null) ?? null;

    // 保護者メールアドレスがない場合: parentUidから取得を試みる
    let targetEmail: string | null = parentEmail;
    if (!targetEmail && parentUid) {
      const parentSnap = await adminDb.collection("users").doc(parentUid).get();
      if (parentSnap.exists) {
        targetEmail = (parentSnap.data()?.email as string | null) ?? null;
      }
    }
    if (!targetEmail) continue;

    // 直近3日以内のテストを取得
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

      // 今週その科目を勉強したか確認
      const sessionsSnap = await adminDb.collection("studySessions")
        .where("userId", "==", childUid)
        .where("subject", "==", testData.subject)
        .where("date", ">=", weekAgoStr)
        .where("date", "<=", todayStr)
        .limit(1)
        .get();

      if (!sessionsSnap.empty) continue; // 勉強している場合はスキップ

      const urgencyColor = daysLeft === 0 ? "#FF4B4B" : daysLeft === 1 ? "#FF6B35" : "#FF9600";
      const urgencyText = daysLeft === 0 ? "今日がテスト当日" : daysLeft === 1 ? "明日がテスト" : `あと${daysLeft}日`;

      await resend.emails.send({
        from: FROM_EMAIL,
        to: targetEmail,
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

  return NextResponse.json({ ok: true, sent });
}
