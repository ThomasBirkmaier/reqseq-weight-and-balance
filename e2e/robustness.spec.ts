// Follow-ups from the IV&V review of the web app: which aircraft a result is for,
// a message when the app cannot load its data, and quiet entry messages.
import { test, expect } from "@playwright/test";
import { load, indication } from "./helpers";

test.use({ serviceWorkers: "block" });

test("result card names the selected aircraft", async ({ page }) => {
  await load(page, "HC4-02", [160, 0, 20]);
  await expect(page.locator("#result-aircraft")).toHaveText("For HC4-02");
  await expect(indication(page)).toHaveText("Within limits (without fuel)");
  await page.selectOption("#aircraft", "HC4-01");
  await expect(page.locator("#result-aircraft")).toHaveText("For HC4-01");
});

test("a load failure shows a message and no selection", async ({ page }) => {
  await page.route("**/wb_core.wasm", (r) => r.fulfill({ status: 404, body: "" }));
  await page.goto("/");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "error");
  await expect(page.locator("#load-error")).toBeVisible();
  await expect(page.locator("#load-error")).toHaveText("The app could not load its data. Reload the page.");
  await expect(page.locator("#work")).toBeHidden();
});

test("entry messages are polite live regions, not alerts", async ({ page }) => {
  await load(page, "HC4-01", [300]);
  const msg = page.locator("#entries .message").first();
  await expect(msg).toHaveText("Enter 0 to 230 kg");
  await expect(msg).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("#entries [role=alert]")).toHaveCount(0);
});

test.describe("phone screen", () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  test("[SR-54e043/AK4] the result card never hides the entry being edited or its message", async ({ page }) => {
    await load(page, "HC4-01", [160, 75, 60]);
    for (const sel of ["#entry-baggage", "#entry-baggage-msg"]) {
      const hit = await page.locator(sel).evaluate((el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return top === el || el.contains(top);
      });
      expect(hit, sel).toBe(true);
    }
    await expect(page.locator("#entry-baggage-msg")).toHaveText("Enter 0 to 50 kg");
  });
});

test("[SR-3f6229/AK4] envelope corners are listed as numbers", async ({ page }) => {
  await load(page, "HC4-01", [0, 0, 0]);
  const rows = page.locator("#corners tbody tr");
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toHaveText(/650 kg\s*2\.100 m/);
  await expect(rows.nth(3)).toHaveText(/1150 kg\s*2\.470 m/);
  await load(page, "HC2-01", [0, 0], "/hc2/");
  await expect(page.locator("#corners tbody tr").nth(2)).toHaveText(/880 kg\s*2\.130 m/);
});

test("[SR-384eab/AK4] without network the app says its aircraft data may be older", async ({ page, context }) => {
  await load(page, "HC4-01", [0, 0, 0]);
  await expect(page.locator("#offline")).toBeHidden();
  await context.setOffline(true);
  await expect(page.locator("#offline")).toHaveText("Offline: aircraft data as of the last opening with network. Check the weighing date against the aircraft documents.");
  await context.setOffline(false);
  await expect(page.locator("#offline")).toBeHidden();
});

test.describe("poor reception", () => {
  test.use({ serviceWorkers: "allow" });
  test("opens from the cache within 5 s when the network hangs", async ({ page, context }) => {
    await page.goto("/");
    await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
    await page.evaluate(() => navigator.serviceWorker.ready);
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
    await page.selectOption("#aircraft", "HC4-01");
    await expect(page.locator("#empty-data")).toContainText("Empty mass 765 kg");
    await context.unrouteAll({ behavior: "ignoreErrors" });
  });
});
