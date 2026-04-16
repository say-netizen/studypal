// 使用回数管理 — Firestore: users/{uid}/usage/{YYYY-MM}
// サーバーサイド (Firebase Admin) 専用

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

/** 今月のドキュメントID (e.g. "2026-04") */
function currentMonthId(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** 現在の使用回数を取得 */
export async function getUsage(uid: string): Promise<number> {
  const ref = adminDb
    .collection("users")
    .doc(uid)
    .collection("usage")
    .doc(currentMonthId());
  const snap = await ref.get();
  return snap.exists ? ((snap.data()?.generateCount as number) ?? 0) : 0;
}

/** 使用回数を +1 */
export async function incrementUsage(uid: string): Promise<void> {
  const ref = adminDb
    .collection("users")
    .doc(uid)
    .collection("usage")
    .doc(currentMonthId());
  await ref.set({ generateCount: FieldValue.increment(1) }, { merge: true });
}

export type PlanType = "free" | "pro" | "family";
const FREE_LIMIT = 3;

/** プランと使用回数に基づいて生成可能かチェック */
export async function checkLimit(
  uid: string,
  plan: PlanType
): Promise<{ allowed: boolean; count: number; limit: number }> {
  if (plan === "pro" || plan === "family") {
    return { allowed: true, count: 0, limit: -1 };
  }
  const count = await getUsage(uid);
  return { allowed: count < FREE_LIMIT, count, limit: FREE_LIMIT };
}
