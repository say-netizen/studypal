import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function verifyToken(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

// POST /api/invite — 子ども側: 招待コードを生成
export async function POST(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 既存の未使用コードがあれば削除して再生成
  const existing = await adminDb.collection("inviteCodes")
    .where("childUid", "==", uid)
    .where("used", "==", false)
    .get();
  for (const d of existing.docs) {
    await d.ref.delete();
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await adminDb.collection("inviteCodes").doc(code).set({
    code,
    childUid: uid,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    used: false,
  });

  return NextResponse.json({ code, expiresAt: expiresAt.toISOString() });
}

// PUT /api/invite — 保護者側: コードを入力して紐付け
export async function PUT(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = (await req.json()) as { code: string };
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "コードは6桁で入力してください" }, { status: 400 });
  }

  // コードを検証
  const codeSnap = await adminDb.collection("inviteCodes").doc(code).get();
  if (!codeSnap.exists) {
    return NextResponse.json({ error: "コードが見つかりません" }, { status: 404 });
  }

  const codeData = codeSnap.data()!;
  if (codeData.used) {
    return NextResponse.json({ error: "このコードはすでに使用されています" }, { status: 400 });
  }

  const expiresAt = (codeData.expiresAt as Timestamp).toDate();
  if (new Date() > expiresAt) {
    return NextResponse.json({ error: "コードの有効期限が切れています。再度コードを発行してください" }, { status: 400 });
  }

  const childUid: string = codeData.childUid;
  if (childUid === uid) {
    return NextResponse.json({ error: "自分のコードは使用できません" }, { status: 400 });
  }

  // 既にこの子どもと紐付け済みか確認
  const parentSnap = await adminDb.collection("users").doc(uid).get();
  const existingChildUids: string[] = (parentSnap.data()?.childUids as string[]) ?? [];
  if (existingChildUids.includes(childUid)) {
    return NextResponse.json({ error: "すでに連携済みです" }, { status: 400 });
  }

  // 子どものユーザー情報を取得
  const childSnap = await adminDb.collection("users").doc(childUid).get();
  if (!childSnap.exists) {
    return NextResponse.json({ error: "お子さんのアカウントが見つかりません" }, { status: 404 });
  }
  const childData = childSnap.data()!;

  // 紐付け処理
  await adminDb.collection("users").doc(childUid).set({ parentUid: uid }, { merge: true });
  await adminDb.collection("users").doc(uid).set(
    { childUids: [...existingChildUids, childUid] },
    { merge: true }
  );
  await adminDb.collection("inviteCodes").doc(code).update({ used: true });

  return NextResponse.json({
    ok: true,
    child: { uid: childUid, name: childData.name as string, grade: childData.grade as string | null },
  });
}

// DELETE /api/invite — 保護者側: 子どもとの連携を解除
export async function DELETE(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { childUid } = (await req.json()) as { childUid: string };
  if (!childUid) return NextResponse.json({ error: "childUid required" }, { status: 400 });

  // 親側のchildUidsから削除
  const parentSnap = await adminDb.collection("users").doc(uid).get();
  const existing: string[] = (parentSnap.data()?.childUids as string[]) ?? [];
  await adminDb.collection("users").doc(uid).set(
    { childUids: existing.filter((c) => c !== childUid) },
    { merge: true }
  );

  // 子側のparentUidを削除
  const childSnap = await adminDb.collection("users").doc(childUid).get();
  if (childSnap.exists && childSnap.data()?.parentUid === uid) {
    await adminDb.collection("users").doc(childUid).set({ parentUid: null }, { merge: true });
  }

  return NextResponse.json({ ok: true });
}
