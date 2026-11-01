// End-to-end verification of the system requirements in the core build (Halcyra HC-4 fleet).
// Test names carry [SR-<id>/AK<n>] so that ReqSeq can attach the JUnit results.
import { expect, test } from "@playwright/test";
import { indication, load, open } from "./helpers";

const A = [160, 0, 20]; // 945 kg, 2.219 m, within limits
const AFT = [70, 200, 50]; // 1085 kg, 2.475 m

test("[SR-e95f42/AK1] shows one labelled entry per loading station", async ({ page }) => {
  await open(page);
  await page.selectOption("#aircraft", "HC4-01");
  await expect(page.locator("#entries label")).toHaveText(["Front seats (max 230 kg)", "Rear seats (max 200 kg)", "Baggage compartment (max 50 kg)"]);
  for (const v of await page.locator("#entries input").all()) await expect(v).toHaveValue("");
});

test("[SR-e95f42/AK2] entered front seats mass gives total mass 925 kg", async ({ page }) => {
  await load(page, "HC4-01", [160, 0, 0]);
  await expect(page.locator("#entry-front")).toHaveValue("160");
  await expect(page.locator("#total")).toHaveText("925 kg");
});

test("[SR-181ae8/AK1] rear seats 201 kg shows a message next to the entry", async ({ page }) => {
  await load(page, "HC4-01", ["", 201, ""]);
  await expect(page.locator("#entry-rear-msg")).toHaveText("Enter 0 to 200 kg");
});

test("[SR-181ae8/AK2] negative front seats mass shows a message", async ({ page }) => {
  await load(page, "HC4-01", [-5]);
  await expect(page.locator("#entry-front-msg")).toHaveText("Enter 0 to 230 kg");
});

test("[SR-181ae8/AK3] decimal baggage mass shows a message", async ({ page }) => {
  await load(page, "HC4-01", ["", "", "7.5"]);
  await expect(page.locator("#entry-baggage-msg")).toHaveText("Enter 0 to 50 kg");
});

test("[SR-b59c9a/AK1] invalid entry gives check not complete", async ({ page }) => {
  await load(page, "HC4-01", [160, 201, 0]);
  await expect(indication(page)).toHaveText("Check not complete: fill in or correct the marked entries");
  await expect(page.getByText("Within limits")).toHaveCount(0);
});

test("[SR-b59c9a/AK2] empty entry gives check not complete", async ({ page }) => {
  await load(page, "HC4-01", [160, 0]);
  await expect(indication(page)).toHaveText("Check not complete: fill in or correct the marked entries");
  await expect(page.getByText("Within limits")).toHaveCount(0);
});

test("[SR-b59c9a/AK3] corrected entry gives a limit indication", async ({ page }) => {
  await load(page, "HC4-01", [160, 201, 0]);
  await page.fill("#entry-rear", "200");
  await expect(indication(page)).not.toContainText("Check not complete");
});

test("[SR-348143/AK1] total mass 945 kg", async ({ page }) => {
  await load(page, "HC4-01", A);
  await expect(page.locator("#total")).toHaveText("945 kg");
});

test("[SR-348143/AK2] total mass of the empty aircraft 765 kg", async ({ page }) => {
  await load(page, "HC4-01", [0, 0, 0]);
  await expect(page.locator("#total")).toHaveText("765 kg");
});

test("[SR-29562e/AK1] centre of gravity 2.219 m", async ({ page }) => {
  await load(page, "HC4-01", A);
  await expect(page.locator("#cg")).toHaveText("2.219 m");
});

test("[SR-29562e/AK2] centre of gravity 2.475 m", async ({ page }) => {
  await load(page, "HC4-01", AFT);
  await expect(page.locator("#cg")).toHaveText("2.475 m");
});

test("[SR-45198e/AK1] 1155 kg shows mass above maximum take-off mass", async ({ page }) => {
  await load(page, "HC4-01", [180, 160, 50]);
  await expect(indication(page)).toContainText("Outside limits: total mass above maximum take-off mass");
  await expect(page.getByText("Within limits")).toHaveCount(0);
});

test("[SR-45198e/AK2] exactly 1150 kg does not show the mass indication", async ({ page }) => {
  await load(page, "HC4-01", [180, 160, 45]);
  await expect(page.locator("#total")).toHaveText("1150 kg");
  await expect(indication(page)).not.toContainText("total mass above");
});

test("[SR-687e88/AK1] aft of the aft limit shows centre of gravity outside envelope", async ({ page }) => {
  await load(page, "HC4-01", AFT);
  await expect(indication(page)).toHaveText("Outside limits: centre of gravity outside envelope");
  await expect(page.getByText("Within limits")).toHaveCount(0);
});

test("[SR-687e88/AK2] forward of the forward limit shows centre of gravity outside envelope", async ({ page }) => {
  await load(page, "HC4-01", [212, 6, 8]);
  await expect(page.locator("#total")).toHaveText("991 kg");
  await expect(indication(page)).toHaveText("Outside limits: centre of gravity outside envelope");
  await expect(page.getByText("Within limits")).toHaveCount(0);
});

test("[SR-687e88/AK3] exactly on the forward limit is not outside", async ({ page }) => {
  await load(page, "HC4-01", [211, 6, 8]);
  await expect(indication(page)).not.toContainText("centre of gravity outside envelope");
});

test("[SR-3a4905/AK1] 945 kg at 2.219 m is within limits", async ({ page }) => {
  await load(page, "HC4-01", A);
  await expect(indication(page)).toHaveText("Within limits (without fuel)");
});

test("[SR-3a4905/AK2] exactly the maximum take-off mass is within limits", async ({ page }) => {
  await load(page, "HC4-01", [180, 160, 45]);
  await expect(indication(page)).toHaveText("Within limits (without fuel)");
});

test("[SR-3a4905/AK3] exactly on the aft limit is within limits", async ({ page }) => {
  await load(page, "HC4-01", [73, 200, 47]);
  await expect(page.locator("#cg")).toHaveText("2.470 m");
  await expect(indication(page)).toHaveText("Within limits (without fuel)");
});

test("[SR-588924/AK1] results update within 100 ms without a button", async ({ page }) => {
  await load(page, "HC4-01", A);
  await expect(page.locator("#total")).toHaveText("945 kg");
  const ms = await page.evaluate(async () => {
    const input = document.getElementById("entry-front") as HTMLInputElement;
    const total = document.getElementById("total")!;
    const t0 = performance.now();
    input.value = "170";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise<void>((resolve) => {
      if (total.textContent === "955 kg") return resolve();
      new MutationObserver((_, o) => { if (total.textContent === "955 kg") { o.disconnect(); resolve(); } }).observe(total, { childList: true, characterData: true, subtree: true });
    });
    return performance.now() - t0;
  });
  expect(ms).toBeLessThan(100);
});

test("[SR-0b76d9/AK1] table rows with mass, lever arm and moment", async ({ page }) => {
  await load(page, "HC4-01", A);
  const rows = page.locator("#table tbody tr");
  await expect(rows).toHaveText([
    /Empty mass\s*765 kg\s*2\.220 m\s*1698\.3 kg·m/,
    /Front seats\s*160 kg\s*2\.000 m\s*320\.0 kg·m/,
    /Rear seats\s*0 kg\s*3\.250 m\s*0\.0 kg·m/,
    /Baggage compartment\s*20 kg\s*3\.950 m\s*79\.0 kg·m/,
    /Total\s*945 kg\s*2\.219 m\s*2097\.3 kg·m/,
  ]);
});

test("[SR-0b76d9/AK2] rounding is stated below the table", async ({ page }) => {
  await load(page, "HC4-01", A);
  await expect(page.locator("#rounding")).toHaveText("Masses rounded to 1 kg, lever arms to 0.001 m, moments to 0.1 kg·m");
});

test("[SR-5e3579/AK1] top view marks the loading stations front to back", async ({ page }) => {
  await load(page, "HC4-01", A);
  const labels = page.locator("#topview .mark-label");
  await expect(labels).toHaveText(["Front seats160 kg", "Rear seats0 kg", "Baggage compartment20 kg"]);
  const ys = await page.locator("#topview .mark").evaluateAll((els) => els.map((e) => Number(e.getAttribute("y"))));
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);
});

test("[SR-5e3579/AK2] changed baggage mass updates its mark", async ({ page }) => {
  await load(page, "HC4-01", A);
  await page.fill("#entry-baggage", "50");
  await expect(page.locator('#topview [data-station="baggage"] .mark-label')).toHaveText("Baggage compartment50 kg");
});

test("[SR-3f6229/AK1] chart shows the envelope and the point inside", async ({ page }) => {
  await load(page, "HC4-01", A);
  await expect(page.locator("#chart .envelope")).toHaveAttribute("data-corners", "650:2100 850:2100 1150:2300 1150:2470 650:2470");
  const p = page.locator("#chart #point");
  await expect(p).toHaveAttribute("data-mass", "945");
  await expect(p).toHaveAttribute("data-cg", "2219");
  await expect(p).toHaveAttribute("data-state", "inside");
});

test("[SR-3f6229/AK2] point aft of the aft limit is labelled", async ({ page }) => {
  await load(page, "HC4-01", AFT);
  await expect(page.locator("#chart #point")).toHaveAttribute("data-state", "outside");
  await expect(page.locator("#chart #point")).toHaveAttribute("data-cg", "2475");
  await expect(page.locator("#point-label")).toHaveText("Aft limit exceeded");
});

test("[SR-3f6229/AK3] point forward of the forward limit is labelled", async ({ page }) => {
  await load(page, "HC4-01", [200, 0, 0]);
  await expect(page.locator("#chart #point")).toHaveAttribute("data-mass", "965");
  await expect(page.locator("#chart #point")).toHaveAttribute("data-cg", "2174");
  await expect(page.locator("#point-label")).toHaveText("Forward limit exceeded");
});

test("[SR-fc8953/AK1] selected aircraft is named above the results", async ({ page }) => {
  await open(page);
  await page.selectOption("#aircraft", "HC4-02");
  await expect(page.locator("#selected")).toHaveText("HC4-02 · Halcyra HC-4");
  const sel = await page.locator("#selected").boundingBox();
  const res = await page.locator("#result").boundingBox();
  expect(sel!.y).toBeLessThan(res!.y);
});

test("[SR-fc8953/AK2] aircraft selection lists the HC-4 fleet", async ({ page }) => {
  await open(page);
  await expect(page.locator("#aircraft option:not([value=''])")).toHaveText(["HC4-01", "HC4-02"]);
});

test("[SR-fc8953/AK3] no aircraft is preselected", async ({ page }) => {
  await open(page);
  await expect(page.locator("#aircraft")).toHaveValue("");
  await expect(page.locator("#select-hint")).toHaveText("Select the aircraft");
  await expect(page.locator("#entries input").first()).toBeHidden();
  await expect(page.locator("#result")).toBeHidden();
});

test("[SR-bdab78/AK1] HC4-01 empty: 765 kg at 2.220 m", async ({ page }) => {
  await load(page, "HC4-01", [0, 0, 0]);
  await expect(page.locator("#total")).toHaveText("765 kg");
  await expect(page.locator("#cg")).toHaveText("2.220 m");
});

test("[SR-bdab78/AK2] HC4-02 empty: 778 kg at 2.236 m", async ({ page }) => {
  await load(page, "HC4-02", [0, 0, 0]);
  await expect(page.locator("#total")).toHaveText("778 kg");
  await expect(page.locator("#cg")).toHaveText("2.236 m");
});

test("[SR-bdab78/AK3] maximum take-off mass 1150 kg", async ({ page }) => {
  await open(page);
  await page.selectOption("#aircraft", "HC4-01");
  await expect(page.locator("#mtom")).toHaveText("Maximum take-off mass 1150 kg");
});

test("[SR-663a61/AK1] empty mass, lever arm and weighing date from the fleet data file", async ({ page }) => {
  await open(page);
  await page.selectOption("#aircraft", "HC4-02");
  await expect(page.locator("#empty-data")).toHaveText("Empty mass 778 kg at 2.236 m, weighed 2026-09-14");
});

test("[SR-1329af/AK1] invented aircraft notice is the first text", async ({ page }) => {
  await open(page);
  const first = await page.evaluate(() => document.body.innerText.trim().split("\n")[0]);
  expect(first).toBe("Invented aircraft. Not for flight operations.");
});

test("[SR-1329af/AK2] responsibility statement above the first result", async ({ page }) => {
  await load(page, "HC4-01", A);
  await expect(page.locator("#aid")).toHaveText("This app is an aid. The pilot in command remains responsible for mass and balance according to the flight manual.");
  const aid = await page.locator("#aid").boundingBox();
  const res = await page.locator("#result").evaluate((e) => e.offsetTop);
  expect(aid!.y).toBeLessThan(res);
});

test("[SR-1329af/AK3] fuel note directly below the limit indication", async ({ page }) => {
  await load(page, "HC4-01", A);
  await expect(page.locator("#indication + #fuel")).toHaveText("Fuel is not included in this version.");
});

