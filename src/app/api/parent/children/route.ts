import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { differenceInDays } from "date-fns";

export const dynamic = "force-dynamic";

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

// GET /api/parent/children — 保護者の連携している子どもリストを返す
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parentSnap = await adminDb.collection("users").doc(uid).get();
  if (!parentSnap.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const childUids: string[] = (parentSnap.data()?.childUids as string[]) ?? [];

  const children = await Promise.all(
    childUids.map(async (childUid) => {
      const snap = await adminDb.collection("users").doc(childUid).get();
      if (!snap.exists) return null;
      const d = snap.data()!;
      return {
        uid: childUid,
        name: d.name as string,
        grade: (d.grade as string | null) ?? null,
      };
    })
  );

  return NextResponse.json({ children: children.filter(Boolean) });
}
