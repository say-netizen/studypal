import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/** 今週 (月曜始まり) の ISO 週番号と年を返す */
function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(date);
  const day = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// GET: ランキング取得
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "weekly";
  const subjectFilter = searchParams.get("subject");

  let collPath: string;
  if (period === "monthly") {
    collPath = `rankings/monthly_${currentMonth()}/entries`;
  } else {
    const { year, week } = getISOWeek(new Date());
    collPath = `rankings/weekly_${year}_${String(week).padStart(2, "0")}/entries`;
  }

  let q = adminDb.collection(collPath).orderBy("score", "desc").limit(100);
  if (subjectFilter) {
    q = q.where("subject", "==", subjectFilter) as typeof q;
  }

  const snap = await q.get();
  const entries = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
  return NextResponse.json({ entries });
}

// POST: スコアを更新
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

  const body = await req.json();
  const { studyMinutes = 0, correctAnswers = 0, streakDays = 0, subject } = body;

  // スコア計算: 勉強時間×1pt/分 + 正解×10pt + ストリーク×20pt/日
  const points = studyMinutes * 1 + correctAnswers * 10 + streakDays * 20;

  const userSnap = await adminDb.collection("users").doc(uid).get();
  const nickname = userSnap.data()?.name ?? "匿名ユーザー";
  const level = userSnap.data()?.currentLevel ?? 1;

  const entry = {
    nickname,
    level,
    subject: subject ?? null,
    score: FieldValue.increment(points),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // 週次・月次 両方更新
  const { year, week } = getISOWeek(new Date());
  const weeklyPath = `rankings/weekly_${year}_${String(week).padStart(2, "0")}/entries`;
  const monthlyPath = `rankings/monthly_${currentMonth()}/entries`;

  await Promise.all([
    adminDb.collection(weeklyPath).doc(uid).set(entry, { merge: true }),
    adminDb.collection(monthlyPath).doc(uid).set(entry, { merge: true }),
  ]);

  return NextResponse.json({ ok: true, points });
}
