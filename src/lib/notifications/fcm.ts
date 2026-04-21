import { getMessaging, getToken, type Messaging } from "firebase/messaging";
import { auth } from "@/lib/firebase/client";
import { getApp, getApps, initializeApp } from "firebase/app";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

function getFirebaseApp() {
  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
  return getApps().length ? getApp() : initializeApp(config);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function getFCMToken(): Promise<string | null> {
  if (typeof window === "undefined" || !VAPID_KEY) return null;
  try {
    const app = getFirebaseApp();
    const messaging: Messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register("/firebase-messaging-sw.js"),
    });
    return token;
  } catch (e) {
    console.error("FCM token error:", e);
    return null;
  }
}

export async function saveFCMTokenToFirestore(token: string): Promise<void> {
  const user = auth().currentUser;
  if (!user) return;
  const idToken = await user.getIdToken();
  await fetch("/api/notifications/send", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fcmToken: token }),
  });
}
