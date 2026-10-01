const CACHE = "qareen-desk-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/css/app.css",
  "/css/desk-extra.css",
  "/css/app-chrome-a.css",
  "/css/app-chrome-b.css",
  "/js/app.js",
  "/js/chunk-0.js",
  "/js/chunk-1.js",
  "/js/chunk-2.js",
  "/js/audio.js",
  "/data/cases.js",
  "/data/shift.js",
  "/data/cases-p0.js",
  "/data/cases-p1.js",
  "/data/cases-p2.js",
  "/data/cases-p3.js",
  "/data/cases-p4.js",
  "/manifest.webmanifest",
  "/icons/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
