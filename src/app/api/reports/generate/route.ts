import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { generateWeeklyReportForUser } from "@/lib/reports/generator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "無効なトークンです" }, { status: 401 });
  }

  // 親のプランを確認
  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (userSnap.data()?.plan !== "family") {
    return NextResponse.json({ error: "Familyプランが必要です" }, { status: 403 });
  }

  // targetUid: 子どものUID（指定なければ自分）
  let targetUid = uid;
  try {
    const body = await req.json();
    if (body.targetUid && typeof body.targetUid === "string") {
      // 親子関係を検証
      const childUids: string[] = (userSnap.data()?.childUids as string[]) ?? [];
      if (childUids.includes(body.targetUid)) {
        targetUid = body.targetUid;
      }
    }
  } catch {
    // body読み取り失敗は無視してデフォルト(uid)で続行
  }

  try {
    const payload = await generateWeeklyReportForUser(targetUid);

    await adminDb
      .collection("weeklyReports")
      .doc(`${targetUid}_${payload.weekStr}`)
      .set({ ...payload, savedAt: new Date() });

    return NextResponse.json({ ok: true, report: payload });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[reports/generate] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
