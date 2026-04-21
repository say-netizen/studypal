import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getMessaging } from "firebase-admin/messaging";
import adminDefault from "@/lib/firebase/admin";

// PUT: FCMトークンを保存
export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid;
  } catch {
    return NextResponse.json({ error: "無効なトークンです" }, { status: 401 });
  }

  const { fcmToken } = await req.json();
  await adminDb.collection("users").doc(uid).set({ fcmToken }, { merge: true });
  return NextResponse.json({ ok: true });
}

// POST: プッシュ通知を送信
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  // cronシークレットまたはBearerで認証
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isBearer = authHeader?.startsWith("Bearer ");

  if (!isCron && !isBearer) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { token, title, body, url } = await req.json();
  if (!token || !title) {
    return NextResponse.json({ error: "token と title は必須です" }, { status: 400 });
  }

  try {
    const messaging = getMessaging(adminDefault.app);
    await messaging.send({
      token,
      notification: { title, body },
      webpush: {
        notification: { icon: "/icons/icon-192x192.png" },
        fcmOptions: { link: url ?? "/dashboard" },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
