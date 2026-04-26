import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia", httpClient: Stripe.createFetchHttpClient() });
}

// DELETE /api/account/delete
// ユーザーのFirestoreデータをすべて削除し、Authアカウントを削除する
export async function DELETE(req: NextRequest) {
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

  // 1. 関連コレクションを削除（バッチ上限500のため分割）
  const collections = [
    adminDb.collection("tests").where("userId", "==", uid),
    adminDb.collection("questions").where("userId", "==", uid),
    adminDb.collection("studySessions").where("userId", "==", uid),
    adminDb.collection("schedules").where("userId", "==", uid),
    adminDb.collection("goals").where("userId", "==", uid),
    adminDb.collection("follows").where("followerId", "==", uid),
    adminDb.collection("follows").where("followingId", "==", uid),
  ];

  for (const q of collections) {
    const snap = await q.get();
    const chunks = [];
    for (let i = 0; i < snap.docs.length; i += 400) {
      chunks.push(snap.docs.slice(i, i + 400));
    }
    for (const chunk of chunks) {
      const batch = adminDb.batch();
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  // 2. ランキングエントリ削除（コレクショングループは別途）
  // weekly/monthly サブコレクションはデータ量少ないのでベストエフォート
  try {
    const rankSnap = await adminDb.collectionGroup("entries").where("uid", "==", uid).get();
    if (!rankSnap.empty) {
      const batch = adminDb.batch();
      rankSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch { /* ランキング削除失敗は無視 */ }

  // 3. Stripeサブスクリプション即時解約
  try {
    const userSnap0 = await adminDb.collection("users").doc(uid).get();
    const stripeCustomerId = userSnap0.data()?.stripeCustomerId as string | null;
    const stripe = getStripe();
    if (stripe && stripeCustomerId) {
      const subs = await stripe.subscriptions.list({ customer: stripeCustomerId, status: "active", limit: 10 });
      await Promise.all(subs.data.map((s) => stripe.subscriptions.cancel(s.id)));
      // trialing も解約
      const trialing = await stripe.subscriptions.list({ customer: stripeCustomerId, status: "trialing", limit: 10 });
      await Promise.all(trialing.data.map((s) => stripe.subscriptions.cancel(s.id)));
    }
  } catch { /* Stripe解約失敗は無視してアカウント削除続行 */ }

  // 4. 保護者との紐付け解除（子ども側が退会する場合）
  try {
    const userSnap = await adminDb.collection("users").doc(uid).get();
    const parentUid = userSnap.data()?.parentUid as string | null;
    if (parentUid) {
      await adminDb.collection("users").doc(parentUid).update({
        childUids: FieldValue.arrayRemove(uid),
      });
    }
    // 保護者側が退会する場合、子どもの parentUid をクリア
    const childUids = (userSnap.data()?.childUids ?? []) as string[];
    for (const childUid of childUids) {
      await adminDb.collection("users").doc(childUid).update({ parentUid: null });
    }
  } catch { /* 無視 */ }

  // 5. usersドキュメント削除
  await adminDb.collection("users").doc(uid).delete();

  // 6. Firebase Authアカウント削除
  await adminAuth.deleteUser(uid);

  return NextResponse.json({ ok: true });
}
