// Validation walk-throughs of release 2 (15288 6.4.11): one scenario per need, in the context of
// use (phone viewport), with a screenshot per step, including the four the client asked for
// (reported fuel with its time, the pilot's own figure, a landing outside limits after a take-off
// within limits, offline use). Test names carry no element reference on purpose: validation
// records are written by IV&V from these screenshots.
import { expect, test, type Page } from "@playwright/test";
import { indication, landing, load, open } from "../helpers";

test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

async function shot(page: Page, need: string, step: string, full = false): Promise<void> {
  await page.screenshot({ path: `test-results/validation/${need}-${step}.png`, fullPage: full });
}

test("walk-through need 6010df enter what is on board", async ({ page }) => {
  await open(page);
  await page.selectOption("#aircraft", "HC4-01");
  await shot(page, "N-6010df", "1-entries-with-fuel-in-litres", true);
  await load(page, "HC4-01", [160, 75, 60], 100, 30);
  await expect(page.locator("#entry-baggage-msg")).toHaveText("Enter 0 to 50 kg");
  await page.fill("#entry-fuel", "171");
  await expect(page.locator("#entry-fuel-msg")).toHaveText("Enter 0 to 170 L");
  await shot(page, "N-6010df", "2-too-much", true);
  await open(page, "/hc2/");
  await page.selectOption("#aircraft", "HC2-01");
  await shot(page, "N-6010df", "3-hc2-entries", true);
});

test("walk-through need cac39d see and correct the reported fuel", async ({ page }) => {
  await open(page);
  await page.selectOption("#aircraft", "HC4-01");
  await expect(page.locator("#fuel-report")).toHaveText("Reported by the fuel system module: 142 L at 2026-11-02 05:40 UTC");
  await page.locator("#fuel-entries").scrollIntoViewIfNeeded();
  await shot(page, "N-cac39d", "1-reported-fuel-and-time");
  await page.fill("#entry-fuel", "100");
  await expect(page.locator("#fuel-note")).toHaveText("Pilot's figure (fuel system module reported 142 L)");
  await page.locator("#fuel-entries").scrollIntoViewIfNeeded();
  await shot(page, "N-cac39d", "2-pilots-own-figure");
});

test("walk-through need a02a77 landing within limits known before take-off", async ({ page }) => {
  for (const [name, l, f, b, to, ldg] of [
    ["within-both", [160, 0, 20], 100, 60, "Within limits", "Within limits"],
    ["landing-outside", [60, 190, 50], 50, 40, "Within limits", "Outside limits: centre of gravity outside envelope"],
  ] as const) {
    await load(page, "HC4-01", [...l], f, b);
    await expect(indication(page)).toHaveText(to);
    await expect(landing(page)).toHaveText(ldg);
    await shot(page, "N-a02a77", name);
  }
  await load(page, "HC2-01", [60, 35], 52, 10, "/hc2/");
  await expect(landing(page)).toHaveText("Outside limits: centre of gravity outside envelope");
  await shot(page, "N-a02a77", "hc2-landing-outside");
});

test("walk-through need e9c5c6 mass permitted at once", async ({ page }) => {
  await load(page, "HC4-01", [180, 160, 45]);
  await expect(indication(page)).toHaveText("Within limits");
  await shot(page, "N-e9c5c6", "1-exactly-mtom");
  await load(page, "HC4-01", [230, 100, 0], 100, 0);
  await expect(indication(page)).toContainText("Outside limits: total mass above maximum take-off mass");
  await shot(page, "N-e9c5c6", "2-mass-and-cg-outside");
});

test("walk-through need 790a55 centre of gravity permitted at once", async ({ page }) => {
  await load(page, "HC4-01", [70, 200, 50]);
  await expect(indication(page)).toHaveText("Outside limits: centre of gravity outside envelope");
  await shot(page, "N-790a55", "1-aft-of-aft-limit");
  await load(page, "HC4-01", [73, 200, 47]);
  await expect(indication(page)).toHaveText("Within limits");
  await shot(page, "N-790a55", "2-on-aft-limit");
});

test("walk-through need 1e786e never a wrong within limits", async ({ page }) => {
  await load(page, "HC4-01", [160, 0, 20], 100, 101);
  await expect(indication(page)).toContainText("Check not complete");
  await expect(landing(page)).toContainText("Check not complete");
  await shot(page, "N-1e786e", "1-burn-above-fuel");
  await load(page, "HC4-01", [160, 0, 20], "", 0);
  await expect(indication(page)).toContainText("Check not complete");
  await shot(page, "N-1e786e", "2-no-fuel-figure");
});

test("walk-through need 2c5472 cross-check the calculation", async ({ page }) => {
  await load(page, "HC4-01", [160, 0, 20], 100, 60);
  await page.locator("#table").scrollIntoViewIfNeeded();
  await expect(page.locator("#table tbody tr")).toHaveCount(8);
  await shot(page, "N-2c5472", "1-table-take-off-and-landing");
});

test("walk-through need 98a54d see where the load acts", async ({ page }) => {
  await load(page, "HC4-01", [160, 0, 20], 100, 60);
  await page.locator("#topview").scrollIntoViewIfNeeded();
  await shot(page, "N-98a54d", "1-top-view");
  await page.locator("#chart").scrollIntoViewIfNeeded();
  await shot(page, "N-98a54d", "2-chart-take-off-and-landing");
});

test("walk-through need e67c17 right data for the individual aircraft", async ({ page }) => {
  for (const id of ["HC4-01", "HC4-02"]) {
    await load(page, id, [0, 0, 0]);
    await shot(page, "N-e67c17", id);
  }
});

test("walk-through need e01992 use at the aircraft on a phone", async ({ page }) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await load(page, "HC4-01", [160, 0, 20], 100, 60);
    await expect(indication(page)).toBeInViewport();
    await expect(landing(page)).toBeInViewport();
    await shot(page, "N-e01992", `result-${scheme}`);
  }
});

test.describe("offline", () => {
  test.use({ serviceWorkers: "allow" });
  test("walk-through need 6d2299 use without network", async ({ page, context }) => {
    await page.goto("/");
    await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await context.setOffline(true);
    await page.reload();
    await page.selectOption("#aircraft", "HC4-01");
    for (const [id, v] of [["front", 160], ["rear", 0], ["baggage", 20], ["fuel", 100], ["burn", 60]] as const) await page.fill(`#entry-${id}`, String(v));
    await expect(page.locator("#offline")).toHaveText("Offline: aircraft data as of 2026-11-02. Check the weighing date against the aircraft documents.");
    await expect(indication(page)).toHaveText("Within limits");
    await shot(page, "N-6d2299", "1-offline-pilots-figure", true);
    await context.setOffline(false);
  });
});
