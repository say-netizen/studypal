import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Stripe Price IDs (本番では Stripe ダッシュボードで作成)
const PRICE_IDS: Record<string, string> = {
  pro:    process.env.STRIPE_PRO_PRICE_ID    ?? "price_pro_placeholder",
  family: process.env.STRIPE_FAMILY_PRICE_ID ?? "price_family_placeholder",
};

export async function POST(req: NextRequest) {
  // 認証
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  let uid: string;
  let email: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
    email = decoded.email;
  } catch {
    return NextResponse.json({ error: "無効なトークンです" }, { status: 401 });
  }

  const { plan } = await req.json();
  if (!["pro", "family"].includes(plan)) {
    return NextResponse.json({ error: "無効なプランです" }, { status: 400 });
  }

  // 既存の Stripe Customer ID を取得 or 新規作成
  const userSnap = await adminDb.collection("users").doc(uid).get();
  let customerId: string = userSnap.data()?.stripeCustomerId ?? "";

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { firebaseUid: uid },
    });
    customerId = customer.id;
    await adminDb.collection("users").doc(uid).update({ stripeCustomerId: customerId });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const priceId = PRICE_IDS[plan];
  if (!priceId || priceId.includes("placeholder")) {
    return NextResponse.json({ error: "Price ID が設定されていません" }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true&plan=${plan}`,
    cancel_url: `${appUrl}/settings/billing`,
    metadata: { firebaseUid: uid, plan },
    locale: "ja",
    subscription_data: {
      metadata: { firebaseUid: uid, plan },
    },
  });

  return NextResponse.json({ url: session.url });
}

export async function GET() {
  // デバッグ用: 環境変数の確認
  return NextResponse.json({
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    keyPrefix: process.env.STRIPE_SECRET_KEY?.slice(0, 7),
    proPrice: process.env.STRIPE_PRO_PRICE_ID,
    familyPrice: process.env.STRIPE_FAMILY_PRICE_ID,
  });
}
