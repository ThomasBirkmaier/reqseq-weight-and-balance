// End-to-end verification in the HC-2 build (below hc2/) of the platform requirements: phone
// screen, contrast, offline use, no network requests and a calculation core that cannot be loaded.
// CI enriches this run with --variant VAR-f23826.
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { box, contrast, HC2, hc2, open, uncovered } from "../helpers";

const B = [160, 20]; // with 50 L fuel and 30 L burn: take-off 856 kg at 2.137 m, landing 834 kg at 2.138 m
const OFFLINE = "Offline: aircraft data as of 2025-11-20. Check the weighing date against the aircraft documents.";

/** Opens the HC-2 build twice so that its service worker has cached it, then switches the network off. */
async function cachedOffline(page: Page, context: BrowserContext): Promise<void> {
  await open(page, HC2);
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
}

test.describe("HC-2 on a phone", () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });

  test("[SR-54e043/AK-s3r8] page is at most 360 px wide", async ({ page }) => {
    await hc2(page, B);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });

  test("[SR-54e043/AK-qdnj] total mass and both limit indications without horizontal scrolling", async ({ page }) => {
    await hc2(page, B, 50, 30);
    for (const id of ["#indication", "#landing-indication", "#total"]) {
      const b = await box(page.locator(id));
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(360);
    }
  });

  test("[SR-c1fe36/AK-pf8z] both limit indications in the viewport after the planned fuel burn entry", async ({
    page,
  }) => {
    await hc2(page, B, 50, null);
    await page.locator("#entry-burn").fill("30");
    await expect(page.locator("#indication")).toBeInViewport({ ratio: 1 });
    await expect(page.locator("#landing-indication")).toBeInViewport({ ratio: 1 });
  });

  test("[SR-bc01c0/AK-yhbr] the result never hides the baggage entry or its message", async ({ page }) => {
    await hc2(page, [160, 41], null, null);
    await expect(page.locator("#entry-baggage-msg")).toHaveText("Enter 0 to 40 kg");
    for (const sel of ["#entry-baggage", "#entry-baggage-msg"]) {
      await expect(page.locator(sel)).toBeInViewport();
      expect(await uncovered(page.locator(sel)), sel).toBe(true);
    }
  });
});

for (const scheme of ["light", "dark"] as const) {
  test.describe(`HC-2 in ${scheme} mode`, () => {
    test.use({ colorScheme: scheme, serviceWorkers: "block" });
    const ak = scheme === "light" ? "AK-qcdw" : "AK-fcf4";

    test(`[SR-070ac3/${ak}] text contrast at least 4.5:1 in ${scheme} mode`, async ({ page }) => {
      await hc2(page, B, 50, 30);
      for (const sel of [
        "#indication span",
        "#landing-indication span",
        "#total",
        "#aid",
        "#entries label",
        ".banner",
        "#table td",
      ]) {
        expect(await contrast(page, sel), sel).toBeGreaterThanOrEqual(4.5);
      }
    });
  });
}

test("[SR-070ac3/AK-rrs5] graphics contrast at least 3:1 in light and dark mode", async ({ browser }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    const page = await browser.newPage({ colorScheme, serviceWorkers: "block" });
    await hc2(page, B, 50, 30);
    for (const sel of ["#chart .envelope", "#chart .point", "#chart .point.landing", "#topview .mark"]) {
      expect(await contrast(page, sel, "stroke"), `${colorScheme} ${sel}`).toBeGreaterThanOrEqual(3);
    }
    await page.close();
  }
});

test("[SR-384eab/AK-g07h] opens and calculates without network after the first visit", async ({ page, context }) => {
  await cachedOffline(page, context);
  await page.locator("#aircraft").selectOption("HC2-01");
  for (const id of ["front", "baggage", "fuel", "burn"]) {
    await page.locator(`#entry-${id}`).fill("0");
  }
  await expect(page.locator("#total")).toHaveText("640 kg");
  await context.setOffline(false);
});

test("[SR-384eab/AK-xmmt] lists every aircraft of the build without network", async ({ page, context }) => {
  await cachedOffline(page, context);
  await expect(page.locator("#aircraft option:not([value=''])")).toHaveText(["HC2-01"]);
  await context.setOffline(false);
});

test("[SR-384eab/AK-pw8y] opens from the cache within 5 s when the network hangs", async ({ page, context }) => {
  await open(page, HC2);
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  // Every request now takes 10 s to answer.
  await context.route("**/*", async (r) => {
    await new Promise((res) => setTimeout(res, 10_000));
    await r.continue().catch(() => undefined);
  });
  const start = Date.now();
  await page.reload({ waitUntil: "commit", timeout: 9_000 });
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true", { timeout: 9_000 });
  expect(Date.now() - start).toBeLessThan(5_000);
  await expect(page.locator("#aircraft option:not([value=''])")).toHaveText(["HC2-01"]);
  await context.unrouteAll({ behavior: "ignoreErrors" });
});

test.describe("without the service worker", () => {
  test.use({ serviceWorkers: "block" });

  test("[SR-87691b/AK-dbn0] entering a loading sends no network request", async ({ page }) => {
    await open(page, HC2);
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.locator("#aircraft").selectOption("HC2-01");
    for (const [id, v] of [
      ["fuel", "0"],
      ["burn", "0"],
      ["front", "160"],
      ["baggage", "20"],
    ] as const) {
      await page.locator(`#entry-${id}`).fill(v);
    }
    await expect(page.locator("#total")).toHaveText("820 kg");
    expect(requests).toEqual([]);
  });

  test("[SR-87691b/AK-jdyw] changing the usable fuel sends no network request", async ({ page }) => {
    await hc2(page, B);
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.locator("#entry-fuel").fill("30");
    await expect(page.locator("#total")).toHaveText("842 kg");
    expect(requests).toEqual([]);
  });

  test("[SR-c74a67/AK-rkj2] no sign-in or installation step", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await open(page, HC2);
    await expect(page.locator("#aircraft")).toBeVisible();
    await expect(page.locator("input[type=password], form[action*=login]")).toHaveCount(0);
    await context.close();
  });
});

test.describe("offline notice and load error", () => {
  test.use({ serviceWorkers: "block" });

  test("[SR-3bd928/AK-t8pt] without network the HC-2 build names the weighing date of HC2-01", async ({
    page,
    context,
  }) => {
    await hc2(page, [0, 0]);
    await expect(page.locator("#offline")).toBeHidden();
    await context.setOffline(true);
    await expect(page.locator("#offline")).toHaveText(OFFLINE);
    await context.setOffline(false);
  });

  test("[SR-3bd928/AK-rdrj] the offline notice disappears when the network is back", async ({ page, context }) => {
    await hc2(page, [0, 0]);
    await context.setOffline(true);
    await expect(page.locator("#offline")).toHaveText(OFFLINE);
    await context.setOffline(false);
    await expect(page.locator("#offline")).toBeHidden();
  });

  test("[SR-ecf597/AK-n6bb] a calculation core that cannot be loaded gives a message and no selection", async ({
    page,
  }) => {
    await page.route("**/wb_core.wasm", async (r) => r.fulfill({ status: 404, body: "" }));
    await page.goto(HC2);
    await expect(page.locator("body")).toHaveAttribute("data-ready", "error");
    await expect(page.locator("#load-error")).toHaveText("The app could not load its data. Reload the page.");
    await expect(page.locator("#work")).toBeHidden();
  });
});
