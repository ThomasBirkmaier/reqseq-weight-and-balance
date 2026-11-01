// Entry point: load the core, start the app, register the offline cache.
import { Core } from "./core.js";
import { startApp } from "./app.js";

const base = document.body.dataset.base ?? "./";
const typeKey = document.body.dataset.type ?? "hc4";

Core.load(`${base}wb_core.wasm`).then((core) => {
  startApp(core, typeKey);
  document.body.dataset.ready = "true";
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => undefined);
}
