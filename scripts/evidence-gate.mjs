// Evidence gate (D-cb5556): every system requirement that is not obsolete, draft and approved
// alike, has a passed test of this CI run at its current version for each of its acceptance
// criteria, in the core view and in each variant view given. Only the evidence of this run
// counts: the gate refuses to run while spec/evidence holds other folders than ci/ (the enriched
// JUnit files of this run) and validation/ (validation records, which verify nothing). CI removes
// the older evidence folders from its checkout before it downloads the files of this run.
// Usage: node scripts/evidence-gate.mjs <view>...   (for example: core VAR-f23826)
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const EVIDENCE = "spec/evidence";
const RUN = join(EVIDENCE, "ci");
const NOT_OBSOLETE = { all: [{ type: ["system-requirement"] }, { not: { status: ["obsolete"] } }] };

/**
 * A passed or failed test case of an enriched JUnit file of this run.
 * @typedef {{ name: string, file: string, passed: boolean, elements: string[], versions: string[],
 *   criteria: string[], views: string[] }} Case
 */

/**
 * Runs a ReqSeq command on the workspace and returns its JSON output (also on a non-zero exit).
 * @param {string[]} args
 * @returns {Record<string, unknown>}
 */
function reqseq(args) {
  let out;
  try {
    out = execFileSync("reqseq", [...args, "--json", "--workspace", "spec"], { encoding: "utf8" });
  } catch (e) {
    const stdout = e instanceof Error && "stdout" in e ? e.stdout : "";
    out = typeof stdout === "string" ? stdout : "";
  }
  const parsed = /** @type {unknown} */ (JSON.parse(out));
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`reqseq ${args.join(" ")}: no JSON object`);
  }
  return /** @type {Record<string, unknown>} */ (parsed);
}

/**
 * The list under `key` of a ReqSeq answer, as records.
 * @param {Record<string, unknown>} answer
 * @param {string} key
 * @returns {Record<string, unknown>[]}
 */
function rows(answer, key) {
  const list = answer[key];
  /** @type {unknown[]} */
  const items = Array.isArray(list) ? list : [];
  /** @type {Record<string, unknown>[]} */
  const out = [];
  for (const r of items) {
    if (typeof r === "object" && r !== null) {
      out.push(/** @type {Record<string, unknown>} */ (r));
    }
  }
  return out;
}

/**
 * The text of a field, or "".
 * @param {Record<string, unknown>} row
 * @param {string} key
 * @returns {string}
 */
function text(row, key) {
  const v = row[key];
  return typeof v === "string" ? v : "";
}

/**
 * The test cases of the enriched JUnit files of this run.
 * @returns {Case[]}
 */
function cases() {
  /** @type {Case[]} */
  const all = [];
  for (const file of readdirSync(RUN).filter((f) => f.endsWith(".xml"))) {
    const xml = readFileSync(join(RUN, file), "utf8");
    for (const m of xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/gu)) {
      const head = m[1] ?? "";
      const body = m[2] ?? "";
      /**
       * The values of the properties with this name.
       * @param {string} name
       * @returns {string[]}
       */
      const props = (name) =>
        [...body.matchAll(new RegExp(`<property name="${name}" value="([^"]*)"`, "gu"))].map((p) => p[1] ?? "");
      all.push({
        name: /name="([^"]*)"/u.exec(head)?.[1] ?? "",
        file,
        passed: !/<(?:failure|error|skipped)\b/u.test(body),
        elements: props("reqseq:element"),
        versions: props("reqseq:version"),
        criteria: props("reqseq:criterion"),
        views: props("reqseq:variant"),
      });
    }
  }
  return all;
}

/**
 * The criteria (`<element id>:<key>`) with a passed test case of this run in the view, at the
 * current version of the element.
 * @param {Case[]} all
 * @param {string} viewId core or the UUID of the variant
 * @param {Map<string, string>} versions current version per element id
 * @returns {Set<string>}
 */
function passedCriteria(all, viewId, versions) {
  /** @type {Set<string>} */
  const passed = new Set();
  for (const c of all) {
    const views = c.views.length === 0 ? ["core"] : c.views;
    if (!c.passed || !views.includes(viewId)) {
      continue;
    }
    for (const criterion of c.criteria) {
      const element = criterion.split(":")[0] ?? "";
      const at = c.elements.indexOf(element);
      if (at >= 0 && c.versions[at] === versions.get(element)) {
        passed.add(criterion);
      }
    }
  }
  return passed;
}

/**
 * The UUID of a variant given by short ID or identifier.
 * @param {string} view
 * @returns {string}
 */
function variantId(view) {
  const e = reqseq(["element", "get", view])["element"];
  return typeof e === "object" && e !== null ? text(/** @type {Record<string, unknown>} */ (e), "id") : view;
}

/**
 * Checks one view and returns the number of findings.
 * @param {string} view
 * @param {Case[]} all
 * @returns {number}
 */
function checkView(view, all) {
  let findings = 0;
  const selection = { view, where: NOT_OBSOLETE };
  const degree = reqseq(["evidence", "degree", "--input", JSON.stringify({ selection })])["degree"];
  const d = typeof degree === "object" && degree !== null ? /** @type {Record<string, unknown>} */ (degree) : {};
  console.log(`== ${view}: ${String(d["total"])} requirements, share verified ${String(d["share"])}`);
  if (d["total"] !== 0 && d["share"] !== 1) {
    findings += 1;
    console.log(`  not every requirement is verified: ${JSON.stringify(d["counts"])}`);
  }
  for (const r of rows(reqseq(["evidence", "without-passed-test", "--view", view]), "elements")) {
    if (text(r, "status") !== "obsolete") {
      findings += 1;
      console.log(`  without a passed test: ${text(r, "shortId")} ${text(r, "title")}`);
    }
  }
  const input = { selection, fields: ["identifier", "status", "version", "properties"], limit: 500 };
  const srs = rows(reqseq(["element", "list", "--input", JSON.stringify(input)]), "partial");
  const viewId = view === "core" ? "core" : variantId(view);
  const versions = new Map(srs.map((r) => [text(r, "id"), text(r, "version")]));
  const passed = passedCriteria(all, viewId, versions);
  let criteria = 0;
  for (const r of srs) {
    const p = r["properties"];
    const list =
      typeof p === "object" && p !== null
        ? rows(/** @type {Record<string, unknown>} */ (p), "acceptance-criteria")
        : [];
    for (const c of list) {
      criteria += 1;
      if (!passed.has(`${text(r, "id")}:${text(c, "key")}`)) {
        findings += 1;
        console.log(`  criterion without a passed test of this run: ${text(r, "shortId")}/AK-${text(c, "key")}`);
      }
    }
  }
  console.log(`  ${String(srs.length)} requirements, ${String(criteria)} criteria, ${String(findings)} findings`);
  return findings;
}

/**
 * Runs the gate over the views given on the command line and sets the exit code.
 * @returns {void}
 */
function main() {
  const views = process.argv.slice(2);
  const others = readdirSync(EVIDENCE).filter((f) => f !== "ci" && f !== "validation");
  if (views.length === 0 || others.length > 0) {
    console.log(
      `Usage: evidence-gate.mjs <view>...; only ci/ and validation/ below ${EVIDENCE} (found: ${others.join(", ")})`,
    );
    process.exitCode = 1;
    return;
  }
  const all = cases();
  let findings = 0;
  for (const c of all.filter((t) => t.elements.length > 0 && t.criteria.length === 0)) {
    findings += 1;
    console.log(`test case without an acceptance criterion: ${c.file}: ${c.name}`);
  }
  for (const c of all.filter((t) => !t.passed && t.elements.length > 0)) {
    findings += 1;
    console.log(`failed test case: ${c.file}: ${c.name}`);
  }
  for (const view of views) {
    findings += checkView(view, all);
  }
  if (findings > 0) {
    console.log(`Evidence gate failed with ${String(findings)} findings.`);
    process.exitCode = 1;
  }
}

main();
