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

  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (userSnap.data()?.plan !== "family") {
    return NextResponse.json({ error: "Familyプランが必要です" }, { status: 403 });
  }

  const payload = await generateWeeklyReportForUser(uid);

  await adminDb
    .collection("weeklyReports")
    .doc(`${uid}_${payload.weekStr}`)
    .set({ ...payload, savedAt: new Date() });

  return NextResponse.json({ ok: true, report: payload });
}
