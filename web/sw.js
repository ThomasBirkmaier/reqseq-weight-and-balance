// Offline cache: the app opens and calculates without network after the first visit.
// Network first: with network the current build (and so the current fleet data) is
// used; the cache is the fallback without network or when the network is too slow.
// The core's JSON interface must stay compatible across builds, because a slow network
// can mix fresh and cached files.
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
let slowUntil = 0;
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Poor reception: if the network has not answered within 3 s, open from the cache;
  // the network answer still refreshes the cache when it arrives.
  let settled = false;
  const network = fetch(e.request).finally(() => { settled = true; }).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  });
  const cached = () => caches.match(e.request, { ignoreSearch: true });
  // After one slow answer, the following files of the same opening come from the cache at once.
  const wait = Date.now() < slowUntil ? 0 : 3000;
  const slow = new Promise((res) => setTimeout(res, wait)).then(() => {
    if (settled) return undefined;
    slowUntil = Date.now() + 30000;
    return cached();
  });
  e.respondWith(
    Promise.race([network.catch(cached), slow.then((r) => r ?? network)])
      .then((r) => r ?? cached().then((c) => c ?? network))
      .catch(() => Response.error()),
  );
  e.waitUntil(network.then(() => undefined, () => undefined));
});
