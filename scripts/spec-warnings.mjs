// Strict check of the ReqSeq workspace: `reqseq workspace check --fail-on warning`, except for the
// warnings listed with their reason in spec-warnings-allowed.json (pending steps of other roles).
// Fails on an error, on any other warning and on a listed warning that no longer occurs, so that
// the list only shrinks. CI runs it after removing the evidence folders of earlier runs from its
// checkout (they are history; the evidence gate counts the evidence of the run only).
// Usage: node scripts/spec-warnings.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * A problem of the check.
 * @typedef {{ severity: string, code: string, message: string }} Problem
 */

/**
 * An accepted warning: its code and the short IDs its message names.
 * @typedef {{ code: string, ids: string[], reason: string }} Allowed
 */

/**
 * The problems that `reqseq workspace check` reports (also when it exits with a non-zero code).
 * @returns {Problem[]}
 */
function problems() {
  let out;
  try {
    out = execFileSync("reqseq", ["workspace", "check", "--fail-on", "warning", "--json", "--workspace", "spec"], {
      encoding: "utf8",
    });
  } catch (e) {
    const stdout = e instanceof Error && "stdout" in e ? e.stdout : "";
    out = typeof stdout === "string" ? stdout : "";
  }
  const parsed = /** @type {unknown} */ (JSON.parse(out));
  const answer = typeof parsed === "object" && parsed !== null ? /** @type {Record<string, unknown>} */ (parsed) : {};
  /** @type {unknown[]} */
  const list = Array.isArray(answer["problems"]) ? answer["problems"] : [];
  return list.map((p) => {
    const r = typeof p === "object" && p !== null ? /** @type {Record<string, unknown>} */ (p) : {};
    /**
     * The field as text, or "".
     * @param {string} k
     * @returns {string}
     */
    const s = (k) => (typeof r[k] === "string" ? r[k] : "");
    return { severity: s("severity"), code: s("code"), message: s("message") };
  });
}

/**
 * The accepted warnings.
 * @returns {Allowed[]}
 */
function allowed() {
  const file = new URL("spec-warnings-allowed.json", import.meta.url);
  const parsed = /** @type {unknown} */ (JSON.parse(readFileSync(file, "utf8")));
  return /** @type {{ allowed: Allowed[] }} */ (parsed).allowed;
}

/**
 * Runs the check and sets the exit code.
 * @returns {void}
 */
function main() {
  const accepted = allowed();
  const seen = new Set();
  let findings = 0;
  for (const p of problems()) {
    if (p.severity !== "error" && p.severity !== "warning") {
      continue;
    }
    const at = accepted.findIndex((a) => a.code === p.code && a.ids.every((id) => p.message.includes(id)));
    if (p.severity === "warning" && at >= 0) {
      seen.add(at);
      console.log(`accepted ${p.code}: ${p.message}`);
    } else {
      findings += 1;
      console.log(`${p.severity} ${p.code}: ${p.message}`);
    }
  }
  accepted.forEach((a, i) => {
    if (!seen.has(i)) {
      findings += 1;
      console.log(`no longer occurs, remove it from spec-warnings-allowed.json: ${a.code} ${a.ids.join(" ")}`);
    }
  });
  console.log(`${String(findings)} findings, ${String(seen.size)} accepted warnings`);
  if (findings > 0) {
    process.exitCode = 1;
  }
}

main();
