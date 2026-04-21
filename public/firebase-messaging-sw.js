importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Firebase設定はService Worker内ではprocess.envが使えないため直接記述する必要があります
// 本番では環境変数からビルド時に差し替えてください
firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY ?? "",
  authDomain:        self.FIREBASE_AUTH_DOMAIN ?? "",
  projectId:         self.FIREBASE_PROJECT_ID ?? "",
  storageBucket:     self.FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId:             self.FIREBASE_APP_ID ?? "",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? "StudyPal", {
    body: body ?? "",
    icon: icon ?? "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: payload.data,
    vibrate: [200, 100, 200],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(clients.openWindow(url));
});
