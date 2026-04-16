import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  async function updateUserPlan(metadata: Stripe.Metadata, plan: string) {
    const uid = metadata.firebaseUid;
    if (!uid) return;
    await adminDb.collection("users").doc(uid).update({ plan });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.metadata) {
        const plan = session.metadata.plan ?? "pro";
        await updateUserPlan(session.metadata, plan);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const plan = (sub.metadata?.plan ?? "pro") as string;
      if (sub.status === "active" || sub.status === "trialing") {
        await updateUserPlan(sub.metadata, plan);
      } else if (sub.status === "canceled" || sub.status === "unpaid") {
        await updateUserPlan(sub.metadata, "free");
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await updateUserPlan(sub.metadata, "free");
      break;
    }

    case "invoice.paid": {
      // サブスクリプション継続確認 — 必要に応じて更新ログを記録
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as Stripe.Invoice & { subscription?: string }).subscription;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        const plan = (sub.metadata?.plan ?? "pro") as string;
        if (sub.status === "active") {
          await updateUserPlan(sub.metadata, plan);
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      // 支払い失敗 — 必要に応じてメール通知等
      console.warn("Invoice payment failed:", event.data.object);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
