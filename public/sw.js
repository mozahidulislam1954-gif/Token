self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Secure dynamic network-first or pass-through strategy so that real-time AI APIs work flawlessly
  e.respondWith(fetch(e.request));
});
