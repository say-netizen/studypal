import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, {
    apiVersion: "2026-03-25.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export async function POST(req: NextRequest) {
  try {
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

    const priceId = (plan === "pro"
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_FAMILY_PRICE_ID)?.trim();

    if (!priceId) {
      return NextResponse.json({ error: `STRIPE_${plan.toUpperCase()}_PRICE_ID が未設定です` }, { status: 500 });
    }

    const stripe = getStripe();

    const userSnap = await adminDb.collection("users").doc(uid).get();
    let customerId: string = userSnap.data()?.stripeCustomerId ?? "";

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUid: uid },
      });
      customerId = customer.id;
      await adminDb.collection("users").doc(uid).set({ stripeCustomerId: customerId }, { merge: true });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://studypal-chi.vercel.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=true&plan=${plan}`,
      cancel_url: `${appUrl}/settings/billing`,
      metadata: { firebaseUid: uid, plan },
      locale: "ja",
      subscription_data: { metadata: { firebaseUid: uid, plan } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    keyPrefix: process.env.STRIPE_SECRET_KEY?.slice(0, 7),
    proPrice: process.env.STRIPE_PRO_PRICE_ID?.slice(0, 15),
    familyPrice: process.env.STRIPE_FAMILY_PRICE_ID?.slice(0, 15),
  });
}
