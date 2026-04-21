import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

// GET: フォロー中 or フォロワー一覧
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  const type = searchParams.get("type") ?? "following"; // "following" | "followers"

  if (!uid) return NextResponse.json({ error: "uid が必要です" }, { status: 400 });

  const field = type === "followers" ? "followingId" : "followerId";
  const snap = await adminDb.collection("follows").where(field, "==", uid).get();

  const ids = snap.docs.map((d) =>
    type === "followers" ? (d.data().followerId as string) : (d.data().followingId as string)
  );

  // ユーザー情報を取得
  const users = await Promise.all(
    ids.map(async (id) => {
      const u = await adminDb.collection("users").doc(id).get();
      return u.exists ? { uid: id, ...u.data() } : { uid: id, name: "Unknown" };
    })
  );

  return NextResponse.json({ users });
}

// POST: フォロー
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  let followerId: string;
  try {
    followerId = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid;
  } catch {
    return NextResponse.json({ error: "無効なトークンです" }, { status: 401 });
  }

  const { followingId } = await req.json();
  if (!followingId || followingId === followerId) {
    return NextResponse.json({ error: "無効なリクエスト" }, { status: 400 });
  }

  // 重複チェック
  const existing = await adminDb
    .collection("follows")
    .where("followerId", "==", followerId)
    .where("followingId", "==", followingId)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ ok: true, alreadyFollowing: true });
  }

  await adminDb.collection("follows").add({
    followerId,
    followingId,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}

// DELETE: フォロー解除
export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  let followerId: string;
  try {
    followerId = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid;
  } catch {
    return NextResponse.json({ error: "無効なトークンです" }, { status: 401 });
  }

  const { followingId } = await req.json();
  const snap = await adminDb
    .collection("follows")
    .where("followerId", "==", followerId)
    .where("followingId", "==", followingId)
    .get();

  await Promise.all(snap.docs.map((d) => d.ref.delete()));
  return NextResponse.json({ ok: true });
}
