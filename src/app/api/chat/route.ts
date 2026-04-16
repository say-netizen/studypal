import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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

  // Pro/Family プラン確認
  const userSnap = await adminDb.collection("users").doc(uid).get();
  const plan = userSnap.data()?.plan ?? "free";
  const grade = userSnap.data()?.grade ?? "中2";
  if (plan === "free") {
    return NextResponse.json(
      { error: "AI解説チャットはProプランの機能です", upgradeRequired: true },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { message, imageUrl } = body;

  if (!message && !imageUrl) {
    return NextResponse.json({ error: "メッセージまたは画像が必要です" }, { status: 400 });
  }

  const systemPrompt = `あなたはStudyPalのAI家庭教師です。
${grade}の生徒に対して、分かりやすく丁寧に教えてください。
- 専門用語は噛み砕いて説明する
- 具体例を必ず使う
- 励ます言葉を忘れずに
- 回答は日本語で、読みやすい長さに収める
- 数式や図表が必要な場合はテキストで表現する`;

  const content: Anthropic.MessageParam["content"] = [];

  // 画像がある場合は Vision を使用
  if (imageUrl) {
    try {
      const res = await fetch(imageUrl);
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const isJpeg =
        imageUrl.toLowerCase().includes(".jpg") ||
        imageUrl.toLowerCase().includes(".jpeg");
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: isJpeg ? "image/jpeg" : "image/png",
          data: base64,
        },
      });
    } catch {
      // 画像取得失敗はスキップ
    }
  }

  content.push({
    type: "text",
    text: message || "この問題を解説してください。",
  });

  // ストリーミングレスポンス
  const stream = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content }],
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
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
