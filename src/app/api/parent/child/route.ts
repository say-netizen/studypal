import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { differenceInDays, subDays, format } from "date-fns";

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

// GET /api/parent/child?childUid=xxx
// 保護者が子どものデータを取得。親子関係を検証してから返す。
export async function GET(req: NextRequest) {
  const uid = await verifyToken(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const childUid = new URL(req.url).searchParams.get("childUid");
  if (!childUid) return NextResponse.json({ error: "childUid required" }, { status: 400 });

  // 親子関係を検証
  const parentSnap = await adminDb.collection("users").doc(uid).get();
  if (!parentSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parentData = parentSnap.data()!;
  const childUids: string[] = (parentData.childUids as string[]) ?? [];
  if (!childUids.includes(childUid)) {
    return NextResponse.json({ error: "この子どものデータへのアクセス権がありません" }, { status: 403 });
  }

  // 子どものデータを取得
  const childSnap = await adminDb.collection("users").doc(childUid).get();
  if (!childSnap.exists) return NextResponse.json({ error: "Child not found" }, { status: 404 });
  const childData = childSnap.data()!;

  const today = format(new Date(), "yyyy-MM-dd");
  const monthAgo = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const weekAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");

  // 過去30日の学習セッション
  const sessionsSnap = await adminDb.collection("studySessions")
    .where("userId", "==", childUid)
    .where("date", ">=", monthAgo)
    .where("date", "<=", today)
    .orderBy("date", "asc")
    .get();

  const sessions = sessionsSnap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as {
      userId: string;
      subject: string;
      plannedMinutes: number;
      actualMinutes: number;
      scheduleId: string | null;
      date: string;
    }),
  }));

  // テスト (直近20件)
  const testsSnap = await adminDb.collection("tests")
    .where("userId", "==", childUid)
    .orderBy("testDate", "desc")
    .limit(20)
    .get();

  const tests = testsSnap.docs.map((d) => {
    const td = d.data();
    const testDate = (td.testDate as Timestamp).toDate();
    return {
      id: d.id,
      subject: td.subject as string,
      testDate: testDate.toISOString(),
      daysLeft: differenceInDays(testDate, new Date()),
      range: td.range as string,
      actualScore: (td.actualScore as number | null) ?? null,
      maxScore: (td.maxScore as number | null) ?? 100,
      scoredAt: td.scoredAt ? (td.scoredAt as Timestamp).toDate().toISOString() : null,
    };
  });

  // 目標
  const goalsSnap = await adminDb.collection("goals")
    .where("userId", "==", childUid)
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  const goals = goalsSnap.docs.map((d) => ({
    id: d.id,
    description: d.data().description as string,
    targetScore: d.data().targetScore as number,
    achieved: d.data().achieved as boolean,
  }));

  // 今週のセッション集計
  const weekSessions = sessions.filter((s) => s.date >= weekAgo);
  const scheduledCount = weekSessions.filter((s) => s.scheduleId !== null).length;
  const freeCount = weekSessions.filter((s) => s.scheduleId === null).length;
  const totalCount = weekSessions.length;
  const scheduledRate = totalCount > 0 ? Math.round((scheduledCount / totalCount) * 100) : 0;
  const streakScore = Math.min(((childData.currentStreak as number) ?? 0) / 7, 1) * 100;
  const autonomyScore = Math.round(scheduledRate * 0.5 + (freeCount > 0 ? 100 : 0) * 0.3 + streakScore * 0.2);

  // テスト結果のトレンド（得点済みのテストを過去順に）
  const scoredTests = tests
    .filter((t) => t.actualScore !== null && t.scoredAt !== null)
    .sort((a, b) => (a.scoredAt! > b.scoredAt! ? 1 : -1));

  const testTrends = scoredTests.map((t, i) => {
    const prev = scoredTests[i - 1];
    const pct = Math.round(((t.actualScore ?? 0) / (t.maxScore ?? 100)) * 100);
    const prevPct = prev ? Math.round(((prev.actualScore ?? 0) / (prev.maxScore ?? 100)) * 100) : null;
    return {
      subject: t.subject,
      date: t.scoredAt!.slice(0, 10),
      actualScore: t.actualScore!,
      maxScore: t.maxScore ?? 100,
      pct,
      delta: prevPct !== null ? pct - prevPct : null,
    };
  });

  return NextResponse.json({
    child: {
      uid: childUid,
      name: childData.name as string,
      grade: (childData.grade as string | null) ?? null,
      currentLevel: (childData.currentLevel as number) ?? 1,
      currentStreak: (childData.currentStreak as number) ?? 0,
      totalXp: (childData.totalXp as number) ?? 0,
      plan: childData.plan as string,
    },
    sessions,
    tests,
    goals,
    weekStats: {
      scheduledRate,
      freeCount,
      scheduledCount,
      totalCount,
      autonomyScore,
    },
    testTrends,
  });
}
