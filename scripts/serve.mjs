// Minimal static file server for the end-to-end tests (no dependencies).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const [root = "dist", port = "4173"] = process.argv.slice(2);
/** @type {Partial<Record<string, string>>} */
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};
createServer((req, res) => {
  void serve(req.url ?? "/", res);
}).listen(Number(port), "127.0.0.1", () => {
  console.log(`serving ${root} on http://127.0.0.1:${port}/`);
});

/**
 * Answer one request with the file below the root, or 404.
 * @param {string} url
 * @param {import("node:http").ServerResponse} res
 * @returns {Promise<void>}
 */
async function serve(url, res) {
  try {
    const p = normalize(decodeURIComponent(new URL(url, "http://x").pathname)).replace(/^(\.\.[/\\])+/u, "");
    let file = join(root, p);
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": types[extname(file)] ?? "application/octet-stream",
      "cache-control": "no-cache",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}
