// End-to-end verification of the platform requirements: phone screen, contrast, offline.
import { expect, test } from "@playwright/test";
import { contrast, load, open } from "./helpers";

const A = [160, 0, 20];
const AFT = [70, 200, 50];

test.describe("phone", () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });

  test("[SR-54e043/AK1] page is at most 360 px wide", async ({ page }) => {
    await load(page, "HC4-01", A);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(w).toBeLessThanOrEqual(360);
  });

  test("[SR-54e043/AK2] total mass and limit indication without horizontal scrolling", async ({ page }) => {
    await load(page, "HC4-01", [160, 0, 0]);
    for (const id of ["#indication", "#total"]) {
      const b = await page.locator(id).boundingBox();
      expect(b!.x).toBeGreaterThanOrEqual(0);
      expect(b!.x + b!.width).toBeLessThanOrEqual(360);
    }
  });

  test("[SR-54e043/AK3] limit indication in the viewport after the baggage entry", async ({ page }) => {
    await load(page, "HC4-01", A);
    await page.locator("#entry-baggage").focus();
    await expect(page.locator("#indication")).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: test.info().outputPath("phone-result.png") });
  });
});

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    const ak = scheme === "light" ? "AK1" : "AK2";
    test(`[SR-070ac3/${ak}] text contrast at least 4.5:1 in ${scheme} mode`, async ({ page }) => {
      for (const loading of [A, AFT, [160, 201, 0]]) {
        await load(page, "HC4-01", loading);
        for (const sel of ["#indication span", "#fuel", "#total", "#aid", "#entries label", ".banner", "#table td", ".message"]) {
          if (!(await page.locator(sel).first().isVisible())) continue;
          expect(await contrast(page, sel), `${sel} ${loading}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      await page.screenshot({ path: test.info().outputPath(`${scheme}.png`) });
    });
  });
}

test("[SR-070ac3/AK3] graphics contrast at least 3:1 in light and dark mode", async ({ browser }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    const page = await browser.newPage({ colorScheme });
    await load(page, "HC4-01", A);
    expect(await contrast(page, "#chart .envelope", "stroke")).toBeGreaterThanOrEqual(3);
    expect(await contrast(page, "#chart .point", "stroke")).toBeGreaterThanOrEqual(3);
    expect(await contrast(page, "#topview .mark", "stroke")).toBeGreaterThanOrEqual(3);
    await page.close();
  }
});

test("[SR-384eab/AK1] opens and calculates without network after the first visit", async ({ page, context }) => {
  await open(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  await page.selectOption("#aircraft", "HC4-01");
  await page.fill("#entry-front", "160");
  await page.fill("#entry-rear", "0");
  await page.fill("#entry-baggage", "0");
  await expect(page.locator("#total")).toHaveText("925 kg");
  await context.setOffline(false);
});

test("[SR-384eab/AK2] entering a loading sends no network request", async ({ page }) => {
  await open(page);
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.selectOption("#aircraft", "HC4-01");
  for (const [id, v] of [["#entry-front", "160"], ["#entry-rear", "0"], ["#entry-baggage", "20"]]) await page.fill(id, v);
  await expect(page.locator("#total")).toHaveText("945 kg");
  expect(requests).toEqual([]);
});

test("[SR-384eab/AK3] no sign-in or installation step", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await open(page);
  await expect(page.locator("#aircraft")).toBeVisible();
  await expect(page.locator("input[type=password], form[action*=login]")).toHaveCount(0);
  await context.close();
});
