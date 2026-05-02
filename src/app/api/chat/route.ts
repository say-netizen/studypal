import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { resolveEffectivePlan } from "@/lib/usage/counter";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type HistoryMessage = { role: "user" | "assistant"; content: string };

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
  const grade = (userSnap.data()?.grade as string | null) ?? "中2";
  const plan = await resolveEffectivePlan(uid);
  if (plan === "free") {
    return NextResponse.json(
      { error: "AI塾講師はProプランの機能です", upgradeRequired: true },
      { status: 403 }
    );
  }

  const body = await req.json() as {
    message: string;
    imageUrl?: string;
    history?: HistoryMessage[];
    subject?: string;
  };
  const { message, imageUrl, history, subject } = body;

  if (!message && !imageUrl) {
    return NextResponse.json({ error: "メッセージまたは画像が必要です" }, { status: 400 });
  }

  const subjectLine = subject ? `\n現在のトピック: ${subject}` : "";
  const systemPrompt = `あなたは「StudyPal AI塾講師」です。${grade}の生徒を専門に教える、優しくて頼れる塾の先生です。${subjectLine}

## 教え方の方針
- 難しい言葉は使わず、${grade}が理解できる言葉で説明する
- 「まず〜、次に〜」とステップを分けて説明する
- 具体的な例を必ず1つ以上出す
- 間違いを責めず「惜しい！」「いい線いってる！」など温かく返す
- 自信を育てることを最優先にする

## 回答スタイル
- 最初に答えの核心を1〜2文で簡潔に
- その後、ステップを分けて詳しく説明
- 最後に「ポイントは〇〇です」と締める
- 日本語で、読みやすい長さ（500字以内が目安）
- 数式はテキストで表現（例: x² + 2x + 1 = 0）

## 重要
- 答えだけでなく考え方・解き方を教える
- 生徒が理解したか「分かった？」「他にも聞きたいことある？」と確認する`;

  // 直近8メッセージまでの履歴を使用（トークン節約）
  const recentHistory: HistoryMessage[] = (history ?? []).slice(-8);

  // APIへ送るメッセージ列を構築
  const apiMessages: Anthropic.MessageParam[] = recentHistory.map((h) => ({
    role: h.role,
    content: h.content,
  }));

  // 現在のユーザーメッセージ（画像付き可）
  const currentContent: Anthropic.MessageParam["content"] = [];
  if (imageUrl) {
    try {
      const res = await fetch(imageUrl);
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const lower = imageUrl.toLowerCase().split("?")[0];
      const isJpeg = lower.endsWith(".jpg") || lower.endsWith(".jpeg");
      currentContent.push({
        type: "image",
        source: { type: "base64", media_type: isJpeg ? "image/jpeg" : "image/png", data: base64 },
      });
    } catch {
      // 画像取得失敗はスキップ
    }
  }
  currentContent.push({ type: "text", text: message || "この問題を解説してください。" });
  apiMessages.push({ role: "user", content: currentContent });

  const stream = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: apiMessages,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
