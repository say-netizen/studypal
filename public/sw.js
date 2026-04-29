// StudyPal Service Worker
const CACHE_NAME = "studypal-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Firebase messaging SW との共存のため fetch はキャッシュしない
self.addEventListener("fetch", () => {});
