// Offline cache: the app opens and calculates without network after the first visit.
const CACHE = "wb-__VERSION__";
const FILES = ["./", "./index.html", "./sw.js"];
const SHARED = ["style.css", "manifest.webmanifest", "wb_core.wasm", "js/main.js", "js/app.js", "js/core.js", "js/draw.js", "js/format.js"];
self.addEventListener("install", (e) => {
  const base = self.location.pathname.includes("/hc2/") ? "../" : "./";
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([...FILES, ...SHARED.map((f) => base + f)])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k.startsWith("wb-") && k.endsWith(CACHE.slice(-4))).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r ?? fetch(e.request)));
});
