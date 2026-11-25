// Offline cache: the app opens and calculates without network after the first visit.
// Network first: with network the current build (and so the current fleet data) is
// used; the cache is the fallback without network or when the network is too slow.
// The core's JSON interface must stay compatible across builds, because a slow network
// can mix fresh and cached files.
const CACHE = "wb-__VERSION__";
const FILES = ["./", "./index.html", "./sw.js"];
const SHARED = ["style.css", "manifest.webmanifest", "wb_core.wasm", "js/main.js", "js/app.js", "js/core.js", "js/draw.js", "js/format.js", "js/guard.js"];
/** The global scope: this script runs as a service worker (type check with tsconfig.sw.json). */
const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));
sw.addEventListener("install", (e) => {
  const base = sw.location.pathname.includes("/hc2/") ? "../" : "./";
  e.waitUntil(caches.open(CACHE).then(async (c) => c.addAll([...FILES, ...SHARED.map((f) => base + f)])).then(async () => sw.skipWaiting()));
});
sw.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(async (ks) => Promise.all(ks.filter((k) => k !== CACHE && k.startsWith("wb-") && k.endsWith(CACHE.slice(-4))).map(async (k) => caches.delete(k)))).then(async () => sw.clients.claim()));
});
let slowUntil = 0;
sw.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Poor reception: if the network has not answered within 3 s, open from the cache;
  // the network answer still refreshes the cache when it arrives.
  let settled = false;
  const network = fetch(e.request).finally(() => { settled = true; }).then((r) => {
    if (r.ok) { const copy = r.clone(); void caches.open(CACHE).then(async (c) => c.put(e.request, copy)).catch(() => undefined); }
    return r;
  });
  /** @returns {Promise<Response | undefined>} */
  async function cached() {
    return caches.match(e.request, { ignoreSearch: true });
  }
  // After one slow answer, the following files of the same opening come from the cache at once.
  const wait = Date.now() < slowUntil ? 0 : 3000;
  /** @type {Promise<Response | undefined>} */
  const slow = new Promise((res) => setTimeout(res, wait)).then(async () => {
    if (settled) return undefined;
    slowUntil = Date.now() + 30000;
    return cached();
  });
  e.respondWith(
    Promise.race([network.catch(cached), slow.then(async (r) => r ?? network)])
      .then(async (r) => r ?? cached().then(async (c) => c ?? network))
      .catch(() => Response.error()),
  );
  e.waitUntil(network.then(() => undefined, () => undefined));
});
