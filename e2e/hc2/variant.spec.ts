// End-to-end verification in the HC-2 build (below hc2/): the variant requirements and every
// core requirement that applies in the variant view, with HC-2 values. CI enriches this run with
// --variant VAR-f23826. load() enters 0 L usable fuel at take-off and 0 L planned fuel burn
// unless a test names others.
import { expect, test } from "@playwright/test";
import { contrast, indication, landing, load, open } from "../helpers";

const H = "/hc2/";
const B = [160, 20]; // with 50 L fuel and 30 L burn: take-off 856 kg at 2.137 m, landing 834 kg at 2.138 m
const hc2 = (page: import("@playwright/test").Page, masses: (string | number)[], fuel: string | number | null = 0, burn: string | number | null = 0) =>
  load(page, "HC2-01", masses, fuel, burn, H);

// Variant requirements
test("[SR-d0fb6e/AK1] HC2-01 empty: 640 kg at 2.150 m", async ({ page }) => {
  await hc2(page, [0, 0]);
  await expect(page.locator("#total")).toHaveText("640 kg");
  await expect(page.locator("#cg")).toHaveText("2.150 m");
});
test("[SR-d0fb6e/AK2] HC2-01 entries without rear seats", async ({ page }) => {
  await open(page, H);
  await page.selectOption("#aircraft", "HC2-01");
  await expect(page.locator("#entries label")).toHaveText(["Front seats (max 220 kg)", "Baggage compartment (max 40 kg)"]);
});
test("[SR-d0fb6e/AK3] HC2-01 aft of the aft limit", async ({ page }) => {
  await hc2(page, [60, 40]);
  await expect(page.locator("#total")).toHaveText("740 kg");
  await expect(page.locator("#cg")).toHaveText("2.178 m");
  await expect(indication(page)).toHaveText("Outside limits: centre of gravity outside envelope");
});
test("[SR-b73090/AK1] HC-2 build names the selected aircraft", async ({ page }) => {
  await open(page, H);
  await page.selectOption("#aircraft", "HC2-01");
  await expect(page.locator("#selected")).toHaveText("HC2-01 · Halcyra HC-2");
});
test("[SR-b73090/AK2] HC-2 build lists HC2-01 only", async ({ page }) => {
  await open(page, H);
  await expect(page.locator("#aircraft option:not([value=''])")).toHaveText(["HC2-01"]);
});
test("[SR-b73090/AK3] HC-2 build has no aircraft preselected", async ({ page }) => {
  await open(page, H);
  await expect(page.locator("#aircraft")).toHaveValue("");
  await expect(page.locator("#select-hint")).toHaveText("Select the aircraft");
  await expect(page.locator("#result")).toBeHidden();
});

// Core requirements in the HC-2 view
test("[SR-e95f42] HC-2: one labelled mass entry per seat row and baggage compartment", async ({ page }) => {
  await hc2(page, [160, 0]);
  await expect(page.locator("#entries input")).toHaveCount(2);
  await expect(page.locator("#total")).toHaveText("800 kg");
});
test("[SR-181ae8] HC-2: front seats 221 kg and baggage 41 kg show messages", async ({ page }) => {
  await hc2(page, [221, 41]);
  await expect(page.locator("#entry-front-msg")).toHaveText("Enter 0 to 220 kg");
  await expect(page.locator("#entry-baggage-msg")).toHaveText("Enter 0 to 40 kg");
});
test("[SR-b59c9a] HC-2: missing baggage gives check not complete at take-off and landing", async ({ page }) => {
  await hc2(page, [160]);
  await expect(indication(page)).toHaveText("Check not complete: fill in or correct the marked entries");
  await expect(landing(page)).toHaveText("Check not complete: fill in or correct the marked entries");
});
test("[SR-348143] HC-2: total mass at take-off 856 kg", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#total")).toHaveText("856 kg");
});
test("[SR-29562e] HC-2: centre of gravity at take-off 2.137 m", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#cg")).toHaveText("2.137 m");
});
test("[SR-45198e] HC-2: 900 kg shows mass above maximum take-off mass", async ({ page }) => {
  await hc2(page, [220, 40]);
  await expect(indication(page)).toContainText("Outside limits: total mass above maximum take-off mass");
  await expect(indication(page)).not.toContainText("Within limits");
});
test("[SR-687e88] HC-2: forward of the forward limit (860 kg at 2.112 m)", async ({ page }) => {
  await hc2(page, [220, 0]);
  await expect(indication(page)).toHaveText("Outside limits: centre of gravity outside envelope");
});
test("[SR-3a4905] HC-2: exactly 880 kg and exactly on the aft limit are within limits", async ({ page }) => {
  await hc2(page, [200, 40]);
  await expect(page.locator("#total")).toHaveText("880 kg");
  await expect(indication(page)).toHaveText("Within limits");
  await page.fill("#entry-front", "75");
  await page.fill("#entry-baggage", "35");
  await expect(page.locator("#cg")).toHaveText("2.170 m");
  await expect(indication(page)).toHaveText("Within limits");
});
test("[SR-588924] HC-2: results update within 100 ms without a button", async ({ page }) => {
  await hc2(page, B);
  await expect(page.locator("#total")).toHaveText("820 kg");
  const ms = await page.evaluate(async () => {
    const input = document.getElementById("entry-front") as HTMLInputElement;
    const total = document.getElementById("total")!;
    const t0 = performance.now();
    input.value = "170";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise<void>((resolve) => {
      if (total.textContent === "830 kg") return resolve();
      new MutationObserver((_, o) => { if (total.textContent === "830 kg") { o.disconnect(); resolve(); } }).observe(total, { childList: true, characterData: true, subtree: true });
    });
    return performance.now() - t0;
  });
  expect(ms).toBeLessThan(100);
});
test("[SR-0b76d9] HC-2: table rows including fuel", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#table tbody tr")).toHaveText([
    /Empty mass\s*640 kg\s*2\.150 m\s*1376\.0 kg·m/,
    /Front seats\s*160 kg\s*2\.000 m\s*320\.0 kg·m/,
    /Baggage compartment\s*20 kg\s*2\.900 m\s*58\.0 kg·m/,
    /Usable fuel 50 L\s*36 kg\s*2\.100 m\s*75\.6 kg·m/,
    /Total at take-off\s*856 kg\s*2\.137 m\s*1829\.6 kg·m/,
    /Usable fuel at landing 20 L\s*14 kg\s*2\.100 m\s*30\.2 kg·m/,
    /Total at landing\s*834 kg\s*2\.138 m\s*1784\.2 kg·m/,
  ]);
  await expect(page.locator("#rounding")).toHaveText("Masses rounded to 1 kg, lever arms to 0.001 m, moments to 0.1 kg·m");
});
test("[SR-5e3579] HC-2: top view marks front to back", async ({ page }) => {
  await hc2(page, B, 50, null);
  await expect(page.locator("#topview .mark-label")).toHaveText(["Front seats160 kg", "Usable fuel50 L", "Baggage compartment20 kg"]);
});
test("[SR-3f6229] HC-2: chart with envelope, take-off and landing points", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#chart .envelope")).toHaveAttribute("data-corners", "550:2050 750:2050 880:2130 880:2170 550:2170");
  await expect(page.locator("#chart #point")).toHaveAttribute("data-mass", "856");
  await expect(page.locator("#chart #point-landing")).toHaveAttribute("data-mass", "834");
  await page.fill("#entry-front", "60");
  await page.fill("#entry-baggage", "40");
  await page.fill("#entry-burn", "0");
  await page.fill("#entry-fuel", "0");
  await expect(page.locator("#point-label")).toHaveText("Aft limit exceeded");
});
test("[SR-028748/AK2] envelope corners of the HC-2 as numbers", async ({ page }) => {
  await open(page, H);
  await page.selectOption("#aircraft", "HC2-01");
  await expect(page.locator("#corners tbody tr")).toHaveText([
    /1\s*550 kg\s*2\.050 m/, /2\s*750 kg\s*2\.050 m/, /3\s*880 kg\s*2\.130 m/, /4\s*880 kg\s*2\.170 m/, /5\s*550 kg\s*2\.170 m/,
  ]);
});
test("[SR-663a61] HC-2: empty mass, lever arm and weighing date from the fleet data file", async ({ page }) => {
  await open(page, H);
  await page.selectOption("#aircraft", "HC2-01");
  await expect(page.locator("#empty-data")).toHaveText("Empty mass 640 kg at 2.150 m, weighed 2025-11-20");
});
test("[SR-1329af] HC-2: fixed notices above the first result", async ({ page }) => {
  await open(page, H);
  const first = await page.evaluate(() => document.body.innerText.trim().split("\n")[0]);
  expect(first).toBe("Invented aircraft. Not for flight operations.");
  await expect(page.locator("#aid")).toHaveText("This app is an aid. The pilot in command remains responsible for mass and balance according to the flight manual.");
});
test("[SR-2dc652/AK3] HC-2: usable fuel prefilled with the reported 78 L", async ({ page }) => {
  await open(page, H);
  await page.selectOption("#aircraft", "HC2-01");
  await expect(page.locator('label[for="entry-fuel"]')).toHaveText("Usable fuel at take-off (max 104 L)");
  await expect(page.locator("#entry-fuel")).toHaveValue("78");
  await expect(page.locator("#entry-burn")).toHaveValue("");
});
test("[SR-d26ffc/AK3] HC-2: reported fuel quantity of HC2-01 with its report time", async ({ page }) => {
  await open(page, H);
  await page.selectOption("#aircraft", "HC2-01");
  await expect(page.locator("#fuel-report")).toHaveText("Reported by the fuel system module: 78 L at 2026-11-02 05:50 UTC");
});
test("[SR-833e71] HC-2: pilot's figure is used and marked", async ({ page }) => {
  await open(page, H);
  await page.selectOption("#aircraft", "HC2-01");
  for (const [id, v] of [["front", 0], ["baggage", 0], ["burn", 0]] as const) await page.fill(`#entry-${id}`, String(v));
  await page.fill("#entry-fuel", "50");
  await expect(page.locator("#fuel-note")).toHaveText("Pilot's figure (fuel system module reported 78 L)");
  await expect(page.locator("#total")).toHaveText("676 kg");
});
test("[SR-79804b/AK2] HC-2: 50 L fuel at 0.72 kg/L and 2.100 m", async ({ page }) => {
  await hc2(page, [0, 0], 50, 0);
  await expect(page.locator("#total")).toHaveText("676 kg");
  await expect(page.locator("#cg")).toHaveText("2.147 m");
});
test("[SR-5689df] HC-2: fuel above 104 L and burn above the fuel show messages", async ({ page }) => {
  await hc2(page, [], 105, null);
  await expect(page.locator("#entry-fuel-msg")).toHaveText("Enter 0 to 104 L");
  await page.fill("#entry-fuel", "50");
  await page.fill("#entry-burn", "51");
  await expect(page.locator("#entry-burn-msg")).toHaveText("Enter 0 to 50 L");
});
test("[SR-90608c/AK3] HC-2: within limits at take-off, aft of the aft limit at landing", async ({ page }) => {
  await hc2(page, [60, 35], 52, 10);
  await expect(indication(page)).toHaveText("Within limits");
  await expect(landing(page)).toHaveText("Outside limits: centre of gravity outside envelope");
});
test("[SR-90608c] HC-2: landing within limits with mass and centre of gravity", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(landing(page)).toHaveText("Within limits");
  await expect(page.locator("#landing-figures")).toHaveText("Landing 834 kg at 2.138 m");
});
test("[SR-c74a67/AK2] HC-2: no sign-in or installation step", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await open(page, H);
  await expect(page.locator("#aircraft")).toBeVisible();
  await expect(page.locator("input[type=password], form[action*=login]")).toHaveCount(0);
  await context.close();
});
test("[SR-87691b] HC-2: entering a loading sends no network request", async ({ page }) => {
  await open(page, H);
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.selectOption("#aircraft", "HC2-01");
  for (const [id, v] of [["fuel", "0"], ["burn", "0"], ["front", "160"], ["baggage", "20"]]) await page.fill(`#entry-${id}`, v);
  await expect(page.locator("#total")).toHaveText("820 kg");
  expect(requests).toEqual([]);
});
test("[SR-384eab/AK2] HC-2 build opens without network after the first visit", async ({ page, context }) => {
  await open(page, H);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#aircraft option:not([value=''])")).toHaveText(["HC2-01"]);
  await context.setOffline(false);
});
test("[SR-55a648] HC-2: offline notice with the date of the data", async ({ page, context }) => {
  await hc2(page, [0, 0]);
  await context.setOffline(true);
  await expect(page.locator("#offline")).toHaveText("Offline: aircraft data as of 2026-11-02. Check the weighing date against the aircraft documents.");
  await context.setOffline(false);
  await expect(page.locator("#offline")).toBeHidden();
});

test.describe("HC-2 on a phone", () => {
  test.use({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  test("[SR-54e043] HC-2: no horizontal scrolling", async ({ page }) => {
    await hc2(page, B, 50, 30);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
    for (const id of ["#indication", "#landing-indication", "#total"]) {
      const b = await page.locator(id).boundingBox();
      expect(b!.x + b!.width).toBeLessThanOrEqual(360);
    }
  });
  test("[SR-c1fe36] HC-2: result in view after the last entry, edited entry not covered", async ({ page }) => {
    await hc2(page, [160, 41], 50, null);
    await page.locator("#entry-burn").fill("30");
    await expect(page.locator("#indication")).toBeInViewport({ ratio: 1 });
    await page.locator("#entry-baggage").focus();
    const hit = await page.locator("#entry-baggage").evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return top === el || el.contains(top);
    });
    expect(hit).toBe(true);
  });
});

test("[SR-070ac3] HC-2: text 4.5:1 and graphics 3:1 in light and dark mode", async ({ browser }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    const page = await browser.newPage({ colorScheme });
    await hc2(page, B, 50, 30);
    for (const sel of ["#indication span", "#landing-indication span", "#total", "#aid", "#entries label", ".banner", "#table td"]) {
      expect(await contrast(page, sel), `${colorScheme} ${sel}`).toBeGreaterThanOrEqual(4.5);
    }
    for (const sel of ["#chart .envelope", "#chart .point", "#topview .mark"]) {
      expect(await contrast(page, sel, "stroke"), `${colorScheme} ${sel}`).toBeGreaterThanOrEqual(3);
    }
    await page.close();
  }
});
