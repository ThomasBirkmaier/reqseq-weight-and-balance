// End-to-end verification in the HC-2 build of the requirements on changed data files: each test loads
// the app with a calculation core built from changed data files (scripts/build-faults.mjs).
import { expect, test } from "@playwright/test";
import { HC2, indication, load, useFaultCore } from "../helpers";

test.use({ serviceWorkers: "block" });

const PATH = HC2;
const LOAD_ERROR = "The app could not load its data. Reload the page.";
const BELOW = "Outside limits: total mass below the envelope";

for (const [ak, name] of [
  ["dzj0", "version-2-0-0"],
  ["fd7z", "version-1-01-0"],
  ["fd7z", "version-1-0"],
] as const) {
  test(`[SR-b53822/AK-${ak}] interface version of ${name} is refused`, async ({ page }) => {
    await useFaultCore(page, name);
    await page.goto(PATH);
    await expect(page.locator("body")).toHaveAttribute("data-ready", "error");
    await expect(page.locator("#load-error")).toHaveText(LOAD_ERROR);
    await expect(page.locator("#aircraft option:not([value=''])")).toHaveCount(0);
  });
}

test("[SR-b53822/AK-bcrp] interface version 1.1.0 is read", async ({ page }) => {
  await useFaultCore(page, "version-1-1-0");
  await page.goto(PATH);
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#aircraft option:not([value=''])")).toHaveText(["HC2-01"]);
});

for (const [ak, name] of [
  ["stzd", "fuel-duplicate-member"],
  ["stzd", "fuel-number-out-of-range"],
  ["t42r", "fleet-line-incomplete"],
  ["t42r", "fleet-unknown-type"],
] as const) {
  test(`[SR-ecf597/AK-${ak}] data file ${name} gives a message and no selection`, async ({ page }) => {
    await useFaultCore(page, name);
    await page.goto(PATH);
    await expect(page.locator("body")).toHaveAttribute("data-ready", "error");
    await expect(page.locator("#load-error")).toHaveText(LOAD_ERROR);
    await expect(page.locator("#work")).toBeHidden();
    await expect(page.locator("#aircraft option:not([value=''])")).toHaveCount(0);
  });
}

test("[SR-bb9061/AK-b8d6] empty mass 10 kg below the envelope is outside limits", async ({ page }) => {
  await useFaultCore(page, "mass-below-envelope");
  await load(page, "HC2-01", [0, 0], 0, 0, PATH);
  await expect(indication(page)).toHaveText(BELOW);
  await expect(indication(page)).not.toContainText("Within limits");
});

test("[SR-bb9061/AK-cn28] empty mass at the lowest mass of the envelope is within limits", async ({ page }) => {
  await useFaultCore(page, "mass-at-lowest-envelope-mass");
  await load(page, "HC2-01", [0, 0], 0, 0, PATH);
  await expect(indication(page)).toHaveText("Within limits");
});

test("[SR-bb9061/AK-spj9] below the envelope comes before the centre of gravity", async ({ page }) => {
  await useFaultCore(page, "mass-below-envelope-aft");
  await load(page, "HC2-01", [0, 0], 0, 0, PATH);
  await expect(indication(page).locator("span")).toHaveText([
    BELOW,
    "Outside limits: centre of gravity outside envelope",
  ]);
});
