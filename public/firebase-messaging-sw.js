importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Service Worker はビルド時の process.env にアクセスできないため
// NEXT_PUBLIC_* 値（クライアントに公開済み）を直接記述する
firebase.initializeApp({
  apiKey:            "AIzaSyDcH7PyIk7Kk92Vl7lyjK2Epu0s7spr0x0",
  authDomain:        "studypal-b4f35.firebaseapp.com",
  projectId:         "studypal-b4f35",
  storageBucket:     "studypal-b4f35.firebasestorage.app",
  messagingSenderId: "944244063554",
  appId:             "1:944244063554:web:84b6fbde80973c9f881cdb",
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
