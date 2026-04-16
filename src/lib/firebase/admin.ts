import {
  initializeApp,
  getApps,
  cert,
  type App as AdminApp,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

// 遅延初期化：ビルド時ではなくリクエスト時に初期化する
let _app: AdminApp | null = null;

function getAdminApp(): AdminApp {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error(
      "Firebase Admin の環境変数が設定されていません。" +
        " FIREBASE_ADMIN_PRIVATE_KEY / FIREBASE_ADMIN_CLIENT_EMAIL / NEXT_PUBLIC_FIREBASE_PROJECT_ID を確認してください。"
    );
  }

  _app = initializeApp({
    credential: cert({ privateKey, clientEmail, projectId }),
    projectId,
  });
  return _app;
}

// ゲッター経由でアクセスすることで遅延初期化を実現
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getFirestore(getAdminApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    return (getAuth(getAdminApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default { get app() { return getAdminApp(); } };
