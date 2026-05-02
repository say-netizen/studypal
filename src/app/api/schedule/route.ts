import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { resolveEffectivePlan } from "@/lib/usage/counter";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// GET: スケジュール一覧取得
export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  let q = adminDb
    .collection("schedules")
    .where("userId", "==", uid)
    .orderBy("date", "asc");

  if (startDate) q = q.where("date", ">=", startDate) as typeof q;
  if (endDate)   q = q.where("date", "<=", endDate)   as typeof q;

  const snap = await q.get();
  const schedules = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ schedules });
}

// POST: AIが空き時間を検出して勉強計画提案
export async function POST(req: NextRequest) {
  // 認証
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

  // プラン確認 (Pro/Family のみ、子アカウントは親planを継承)
  const plan = await resolveEffectivePlan(uid);
  if (plan === "free") {
    return NextResponse.json(
      { error: "この機能はProプランで利用できます", upgradeRequired: true },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { testDate, subject, daysUntilTest, freeSlots } = body;

  const prompt = `あなたは学習プランナーです。以下の情報をもとに、テストまでの学習計画を提案してください。

科目: ${subject}
テスト日: ${testDate}
テストまでの日数: ${daysUntilTest}日
空き時間帯: ${JSON.stringify(freeSlots)}

1日の推奨勉強時間と、各日の学習内容を具体的に提案してください。
JSON形式で返してください:
{
  "dailyMinutes": 60,
  "plan": [
    { "date": "YYYY-MM-DD", "focus": "学習内容", "minutes": 60 }
  ],
  "advice": "一言アドバイス"
}`;

  const result = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = result.content[0].type === "text" ? result.content[0].text : "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "計画生成に失敗しました" }, { status: 500 });
  }

  return NextResponse.json(JSON.parse(jsonMatch[0]));
}
