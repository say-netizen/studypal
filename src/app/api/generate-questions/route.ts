import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { checkLimit, incrementUsage } from "@/lib/usage/counter";
import { FieldValue } from "firebase-admin/firestore";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  // 1. 認証
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

  // 2. プラン & 使用回数チェック
  const userSnap = await adminDb.collection("users").doc(uid).get();
  const plan = (userSnap.data()?.plan ?? "free") as "free" | "pro" | "family";
  const grade = (userSnap.data()?.grade as string | null) ?? "中2";

  if (plan === "free") {
    return NextResponse.json(
      { error: "AI予想問題の生成はProプラン以上でご利用いただけます。", upgradeRequired: true },
      { status: 403 }
    );
  }

  const { allowed, count, limit } = await checkLimit(uid, plan);
  if (!allowed) {
    return NextResponse.json(
      { error: "今月の生成回数の上限に達しました。", usageCount: count, usageLimit: limit, upgradeRequired: true },
      { status: 403 }
    );
  }

  // 3. リクエスト解析 (testId は任意)
  let body: { testId?: string; subject: string; range: string; fileUrls?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエスト形式です" }, { status: 400 });
  }

  const { testId, subject, range, fileUrls } = body;
  if (!subject || !range) {
    return NextResponse.json({ error: "科目と出題範囲は必須です" }, { status: 400 });
  }

  // 4. 画像OCR
  let ocrText = "";
  if (fileUrls && fileUrls.length > 0) {
    const imageMessages: Anthropic.MessageParam["content"] = [];
    for (const url of fileUrls.slice(0, 5)) {
      const lower = url.toLowerCase().split("?")[0];
      const isImage = lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".gif") || lower.endsWith(".webp");
      if (isImage) {
        try {
          const res = await fetch(url);
          const buffer = await res.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const mimeType = lower.endsWith(".png") ? "image/png" : "image/jpeg";
          imageMessages.push({ type: "image", source: { type: "base64", media_type: mimeType, data: base64 } });
        } catch {
          // 取得失敗はスキップ
        }
      }
    }
    if (imageMessages.length > 0) {
      imageMessages.push({ type: "text", text: "上記の教材画像から、テスト対策に重要なポイント・語句・公式・事項をすべて日本語でテキスト抽出してください。" });
      const ocrResult = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: imageMessages }],
      });
      ocrText = ocrResult.content[0].type === "text" ? ocrResult.content[0].text : "";
    }
  }

  // 5. 予想問題生成
  const contextText = [
    `科目: ${subject}`,
    `学年: ${grade}`,
    `出題範囲: ${range}`,
    ocrText ? `\n教材から抽出した内容:\n${ocrText}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `あなたは日本の${grade}担当のベテラン塾講師です。以下の情報を元に、定期テストに出そうな予想問題を10問生成してください。

${contextText}

## 出力形式
必ず以下のJSON配列のみを返してください。他のテキストは一切含めないでください。

[
  {
    "type": "multiple",
    "question": "問題文",
    "choices": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    "answer": "選択肢A",
    "explanation": "なぜこの答えになるかの解説（100字以内）"
  },
  {
    "type": "fill",
    "question": "（　）に入る語句を答えなさい。問題文",
    "choices": null,
    "answer": "正解の語句",
    "explanation": "解説（80字以内）"
  },
  {
    "type": "description",
    "question": "〜について説明しなさい。",
    "choices": null,
    "answer": "模範解答",
    "explanation": "採点のポイント（80字以内）"
  }
]

## 制約
- 四択問題 (type: "multiple"): 3問
- 穴埋め問題 (type: "fill"): 4問
- 記述問題 (type: "description"): 3問
- 合計10問
- ${grade}に適した難易度・語彙
- 教科書に出る基本〜標準レベル
- すべて日本語
- JSONのみ出力`;

  let questions: Array<{
    type: "multiple" | "fill" | "description";
    question: string;
    choices: string[] | null;
    answer: string;
    explanation: string;
  }>;

  try {
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = result.content[0].type === "text" ? result.content[0].text.trim() : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("JSON not found");
    questions = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Claude API error:", e);
    return NextResponse.json({ error: "AI問題生成に失敗しました。しばらく待ってから再試行してください。" }, { status: 500 });
  }

  // 6. testId が指定された場合のみ Firestore に保存
  if (testId) {
    const batch = adminDb.batch();
    for (const q of questions) {
      const ref = adminDb.collection("questions").doc();
      batch.set(ref, {
        testId,
        userId: uid,
        type: q.type,
        question: q.question,
        choices: q.choices,
        answer: q.answer,
        explanation: q.explanation,
        isCorrect: null,
        answeredAt: null,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    batch.update(adminDb.collection("tests").doc(testId), {
      hasQuestions: true,
      questionsGeneratedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
  }

  // 7. 使用回数インクリメント
  await incrementUsage(uid);

  return NextResponse.json({ questions, usageCount: count + 1, usageLimit: limit });
}
