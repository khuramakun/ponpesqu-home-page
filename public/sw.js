// Service Worker for Ponpesqu PWA
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Pass-through fetch handler is required for PWA installation criteria
  event.respondWith(fetch(event.request));
});
