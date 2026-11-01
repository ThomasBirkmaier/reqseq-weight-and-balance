// Validation walk-throughs (15288 6.4.11): one scenario per need, in the context of use
// (phone viewport), with a screenshot per step. Test names carry no element reference on
// purpose: validation records are written by IV&V from these screenshots.
import { expect, test, type Page } from "@playwright/test";
import { indication, load, open } from "./helpers";

test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

async function shot(page: Page, need: string, step: string): Promise<void> {
  await page.screenshot({ path: `test-results/validation/${need}-${step}.png`, fullPage: false });
}

test("walk-through need 6010df enter what is on board", async ({ page }) => {
  await open(page);
  await page.selectOption("#aircraft", "HC4-01");
  await shot(page, "N-6010df", "1-entries");
  await load(page, "HC4-01", [160, 75, 20]);
  await expect(page.locator("#total")).toHaveText("1020 kg");
  await page.fill("#entry-baggage", "60");
  await expect(page.locator("#entry-baggage-msg")).toHaveText("Enter 0 to 50 kg");
  await shot(page, "N-6010df", "2-too-much");
});

test("walk-through need e9c5c6 mass permitted at once", async ({ page }) => {
  for (const [name, l, text] of [
    ["below", [160, 0, 20], "Within limits (without fuel)"],
    ["at", [180, 160, 45], "Within limits (without fuel)"],
    ["above", [180, 160, 50], "Outside limits: total mass above maximum take-off mass"],
  ] as const) {
    await load(page, "HC4-01", [...l]);
    await expect(indication(page)).toHaveText(text);
    await expect(indication(page)).toBeInViewport();
    await shot(page, "N-e9c5c6", `hc4-${name}`);
  }
  await load(page, "HC2-01", [220, 40], "/hc2/");
  await expect(indication(page)).toHaveText("Outside limits: total mass above maximum take-off mass");
  await shot(page, "N-e9c5c6", "hc2-above");
});

test("walk-through need 790a55 centre of gravity permitted at once", async ({ page }) => {
  for (const [name, l, text] of [
    ["inside", [160, 0, 20], "Within limits (without fuel)"],
    ["edge", [73, 200, 47], "Within limits (without fuel)"],
    ["outside", [70, 200, 50], "Outside limits: centre of gravity outside envelope"],
  ] as const) {
    await load(page, "HC4-01", [...l]);
    await expect(indication(page)).toHaveText(text);
    await expect(indication(page)).toBeInViewport();
    await shot(page, "N-790a55", `hc4-${name}`);
  }
  await load(page, "HC2-01", [60, 40], "/hc2/");
  await expect(indication(page)).toHaveText("Outside limits: centre of gravity outside envelope");
  await shot(page, "N-790a55", "hc2-outside");
});

test("walk-through need 98a54d see where the load acts", async ({ page }) => {
  await load(page, "HC4-01", [70, 200, 50]);
  await page.locator("#chart").scrollIntoViewIfNeeded();
  await expect(page.locator("#point-label")).toHaveText("Aft limit exceeded");
  await shot(page, "N-98a54d", "1-aft");
  await page.fill("#entry-rear", "120");
  await page.locator("#chart").scrollIntoViewIfNeeded();
  await expect(page.locator("#chart #point")).toHaveAttribute("data-state", "inside");
  await shot(page, "N-98a54d", "2-corrected");
  await load(page, "HC4-01", [200, 0, 0]);
  await page.locator("#chart").scrollIntoViewIfNeeded();
  await expect(page.locator("#point-label")).toHaveText("Forward limit exceeded");
  await shot(page, "N-98a54d", "3-forward");
});

test("walk-through need e01992 phone without network", async ({ page, context }) => {
  await open(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await load(page, "HC4-01", [160, 0, 20]).catch(async () => {
    await page.selectOption("#aircraft", "HC4-01");
  });
  await expect(indication(page)).toHaveText("Within limits (without fuel)");
  await shot(page, "N-e01992", "offline");
  await context.setOffline(false);
});

test("walk-through need e67c17 data of the individual aircraft", async ({ page }) => {
  for (const id of ["HC4-01", "HC4-02"]) {
    await open(page);
    await page.selectOption("#aircraft", id);
    await expect(page.locator("#selected")).toContainText(id);
    await shot(page, "N-e67c17", id);
  }
  await open(page, "/hc2/");
  await page.selectOption("#aircraft", "HC2-01");
  await shot(page, "N-e67c17", "HC2-01");
});

test("walk-through need 2c5472 cross-check the calculation", async ({ page }) => {
  await load(page, "HC4-01", [160, 0, 20]);
  await page.locator("#table").scrollIntoViewIfNeeded();
  await expect(page.locator("#rounding")).toBeVisible();
  await shot(page, "N-2c5472", "table");
});

test("walk-through need 1e786e never a wrong within limits", async ({ page }) => {
  const cases: [string, (string | number)[]][] = [
    ["front-missing", ["", 0, 0]],
    ["rear-missing", [160, "", 0]],
    ["baggage-missing", [160, 0, ""]],
    ["front-impossible", [999, 0, 0]],
    ["rear-negative", [160, -1, 0]],
    ["baggage-text", [160, 0, "x"]],
  ];
  for (const [name, l] of cases) {
    await load(page, "HC4-01", l);
    await expect(indication(page)).toHaveText("Check not complete: correct the marked entries");
    await expect(page.getByText("Within limits")).toHaveCount(0);
    await shot(page, "N-1e786e", name);
  }
});
