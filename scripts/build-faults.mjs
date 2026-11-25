// Builds the calculation core from changed data files, one WebAssembly file per case, into
// dist/faults/<case>.wasm. The end-to-end tests of SR-b53822, SR-ecf597 and SR-bb9061 load the app
// of either build with such a core ("when the app is built from it and opened"). The data files
// are those of data/ with one change each; the core reads its data folder from WB_DATA_DIR
// (.cargo/config.toml). Run after scripts/build.sh. Usage: node scripts/build-faults.mjs
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const FLEET = readFileSync("data/fleet.csv", "utf8");
const FUEL = readFileSync("data/fuel-module.json", "utf8");

/**
 * A changed pair of data files.
 * @typedef {{ fleet?: [string, string][], fuel?: [string, string][] }} Change
 */

/** @type {Record<string, Change>} */
const CASES = {
  "version-2-0-0": { fuel: [['"interfaceVersion": "1.0.1"', '"interfaceVersion": "2.0.0"']] },
  "version-1-0": { fuel: [['"interfaceVersion": "1.0.1"', '"interfaceVersion": "1.0"']] },
  "version-1-01-0": { fuel: [['"interfaceVersion": "1.0.1"', '"interfaceVersion": "1.01.0"']] },
  "version-1-1-0": { fuel: [['"interfaceVersion": "1.0.1"', '"interfaceVersion": "1.1.0"']] },
  "fuel-duplicate-member": { fuel: [['"HC4-02": {', '"HC4-01": {']] },
  "fuel-number-out-of-range": { fuel: [['"fuelLeverArmM": 2.35', '"fuelLeverArmM": 99999999999999999']] },
  "fleet-line-incomplete": { fleet: [["HC4-01,hc4,765,2220,2026-03-02", "HC4-01,hc4,765"]] },
  "fleet-unknown-type": { fleet: [["HC4-01,hc4,", "HC4-01,hc9,"]] },
  "mass-below-envelope": {
    fleet: [
      ["HC4-01,hc4,765,2220", "HC4-01,hc4,640,2220"],
      ["HC2-01,hc2,640,2150", "HC2-01,hc2,540,2150"],
    ],
  },
  "mass-at-lowest-envelope-mass": {
    fleet: [
      ["HC4-01,hc4,765,2220", "HC4-01,hc4,650,2220"],
      ["HC2-01,hc2,640,2150", "HC2-01,hc2,550,2150"],
    ],
  },
  "mass-below-envelope-aft": {
    fleet: [
      ["HC4-01,hc4,765,2220", "HC4-01,hc4,640,2500"],
      ["HC2-01,hc2,640,2150", "HC2-01,hc2,540,2200"],
    ],
  },
};

/**
 * The text with each replacement applied; fails when a replaced text is not found.
 * @param {string} text
 * @param {[string, string][]} changes
 * @returns {string}
 */
function apply(text, changes) {
  let out = text;
  for (const [from, to] of changes) {
    if (!out.includes(from)) {
      throw new Error(`build-faults: "${from}" not found in the data file`);
    }
    out = out.replace(from, to);
  }
  return out;
}

/**
 * Builds every case and copies its core to dist/faults/.
 * @returns {void}
 */
function main() {
  const target = resolve("core/target/faults");
  mkdirSync("dist/faults", { recursive: true });
  for (const [name, change] of Object.entries(CASES)) {
    const dir = join(target, "data", name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "fleet.csv"), apply(FLEET, change.fleet ?? []));
    writeFileSync(join(dir, "fuel-module.json"), apply(FUEL, change.fuel ?? []));
    const args = ["build", "--release", "--target", "wasm32-unknown-unknown", "--manifest-path", "core/Cargo.toml"];
    execFileSync("cargo", args, {
      stdio: "inherit",
      env: { ...process.env, WB_DATA_DIR: dir, CARGO_TARGET_DIR: target },
    });
    copyFileSync(join(target, "wasm32-unknown-unknown/release/wb_core.wasm"), join("dist/faults", `${name}.wasm`));
    console.log(`built dist/faults/${name}.wasm`);
  }
}

main();
