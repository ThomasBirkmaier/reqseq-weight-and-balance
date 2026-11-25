// End-to-end verification of the system requirements in the core build (Halcyra HC-4 fleet).
// Test names carry [SR-<id>/AK<n>] so that ReqSeq can attach the JUnit results.
// load() enters 0 L usable fuel at take-off and 0 L planned fuel burn unless a test names others.
import { expect, test } from "@playwright/test";
import { indication, landing, load, open, box } from "../helpers";

const A = [160, 0, 20];
const AFT = [70, 200, 50]; // 1085 kg, 2.475 m

test("[SR-e95f42/AK-nk58] shows one labelled entry per seat row and baggage compartment", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-01");
  await expect(page.locator("#entries label")).toHaveText(["Front seats (max 230 kg)", "Rear seats (max 200 kg)", "Baggage compartment (max 50 kg)"]);
  for (const v of await page.locator("#entries input").all()) await expect(v).toHaveValue("");
});

test("[SR-e95f42/AK-tw0z] entered front seats mass gives total mass 925 kg", async ({ page }) => {
  await load(page, "HC4-01", [160, 0, 0]);
  await expect(page.locator("#entry-front")).toHaveValue("160");
  await expect(page.locator("#total")).toHaveText("925 kg");
});

test("[SR-181ae8/AK-j1jc] rear seats 201 kg shows a message next to the entry", async ({ page }) => {
  await load(page, "HC4-01", ["", 201, ""]);
  await expect(page.locator("#entry-rear-msg")).toHaveText("Enter 0 to 200 kg");
});

test("[SR-181ae8/AK-bb4d] negative front seats mass shows a message", async ({ page }) => {
  await load(page, "HC4-01", [-5]);
  await expect(page.locator("#entry-front-msg")).toHaveText("Enter 0 to 230 kg");
});

test("[SR-181ae8/AK-w4j4] decimal baggage mass shows a message", async ({ page }) => {
  await load(page, "HC4-01", ["", "", "7.5"]);
  await expect(page.locator("#entry-baggage-msg")).toHaveText("Enter 0 to 50 kg");
});

test("[SR-b59c9a/AK-jgk2] invalid entry gives check not complete at take-off and landing", async ({ page }) => {
  await load(page, "HC4-01", [160, 201, 0]);
  await expect(indication(page)).toHaveText("Check not complete: fill in or correct the marked entries");
  await expect(landing(page)).toHaveText("Check not complete: fill in or correct the marked entries");
  await expect(page.getByText("Within limits")).toHaveCount(0);
});

test("[SR-b59c9a/AK-k0w1] cleared usable fuel gives check not complete", async ({ page }) => {
  await load(page, "HC4-01", [160, 0, 0], "", 0);
  await expect(indication(page)).toHaveText("Check not complete: fill in or correct the marked entries");
  await expect(indication(page)).not.toContainText("Within limits");
});

test("[SR-b59c9a/AK-qp17] corrected entry gives a limit indication", async ({ page }) => {
  await load(page, "HC4-01", [160, 201, 0]);
  await page.locator("#entry-rear").fill("200");
  await expect(indication(page)).not.toContainText("Check not complete");
});

test("[SR-348143/AK-jk10] total mass at take-off with fuel 1017 kg", async ({ page }) => {
  await load(page, "HC4-01", A, 100, 60);
  await expect(page.locator("#total")).toHaveText("1017 kg");
});

test("[SR-348143/AK-yc6g] total mass of the empty aircraft 765 kg", async ({ page }) => {
  await load(page, "HC4-01", [0, 0, 0]);
  await expect(page.locator("#total")).toHaveText("765 kg");
});

test("[SR-348143/AK-vf0q] landing mass 974 kg", async ({ page }) => {
  await load(page, "HC4-01", A, 100, 60);
  await expect(page.locator("#landing-figures")).toHaveText("Landing 974 kg at 2.223 m");
});

test("[SR-29562e/AK-vbf5] centre of gravity at take-off with fuel 2.229 m", async ({ page }) => {
  await load(page, "HC4-01", A, 100, 60);
  await expect(page.locator("#cg")).toHaveText("2.229 m");
});

test("[SR-29562e/AK-ts69] centre of gravity 2.475 m", async ({ page }) => {
  await load(page, "HC4-01", AFT);
  await expect(page.locator("#cg")).toHaveText("2.475 m");
});

test("[SR-29562e/AK-ssg7] centre of gravity at landing 2.223 m", async ({ page }) => {
  await load(page, "HC4-01", A, 100, 60);
  await expect(page.locator("#landing-figures")).toHaveText("Landing 974 kg at 2.223 m");
});

test("[SR-45198e/AK-k8g5] 1155 kg shows mass above maximum take-off mass", async ({ page }) => {
  await load(page, "HC4-01", [180, 160, 50]);
  await expect(indication(page)).toContainText("Outside limits: total mass above maximum take-off mass");
  await expect(indication(page)).not.toContainText("Within limits");
});

test("[SR-45198e/AK-j58j] 1154.8 kg with fuel shows mass above maximum take-off mass", async ({ page }) => {
  await load(page, "HC4-01", [180, 100, 45], 90, 0);
  await expect(indication(page)).toContainText("Outside limits: total mass above maximum take-off mass");
});

test("[SR-45198e/AK-yk0x] mass and centre of gravity both outside, mass first", async ({ page }) => {
  await load(page, "HC4-01", [230, 100, 0], 100, 0);
  await expect(indication(page).locator("span")).toHaveText([
    "Outside limits: total mass above maximum take-off mass",
    "Outside limits: centre of gravity outside envelope",
  ]);
});

test("[SR-687e88/AK-xnpm] aft of the aft limit shows centre of gravity outside envelope", async ({ page }) => {
  await load(page, "HC4-01", AFT);
  await expect(indication(page)).toHaveText("Outside limits: centre of gravity outside envelope");
  await expect(indication(page)).not.toContainText("Within limits");
});

test("[SR-687e88/AK-z893] forward of the forward limit shows centre of gravity outside envelope", async ({ page }) => {
  await load(page, "HC4-01", [212, 6, 8]);
  await expect(page.locator("#total")).toHaveText("991 kg");
  await expect(indication(page)).toHaveText("Outside limits: centre of gravity outside envelope");
});

test("[SR-687e88/AK-gf0r] exactly on the forward limit is not outside", async ({ page }) => {
  await load(page, "HC4-01", [211, 6, 8]);
  await expect(indication(page)).not.toContainText("centre of gravity outside envelope");
});

test("[SR-3a4905/AK-y54c] 1017 kg at 2.229 m with fuel is within limits, labelled Take-off", async ({ page }) => {
  await load(page, "HC4-01", A, 100, 60);
  await expect(page.locator("#result-to .state-name")).toHaveText("Take-off");
  await expect(indication(page)).toHaveText("Within limits");
});

test("[SR-3a4905/AK-gt5z] exactly the maximum take-off mass is within limits", async ({ page }) => {
  await load(page, "HC4-01", [180, 160, 45]);
  await expect(page.locator("#total")).toHaveText("1150 kg");
  await expect(indication(page)).toHaveText("Within limits");
});

test("[SR-3a4905/AK-svpd] exactly on the aft limit is within limits", async ({ page }) => {
  await load(page, "HC4-01", [73, 200, 47]);
  await expect(page.locator("#cg")).toHaveText("2.470 m");
  await expect(indication(page)).toHaveText("Within limits");
});

test("[SR-588924/AK-rksb] results update within 100 ms without a button", async ({ page }) => {
  await load(page, "HC4-01", A);
  await expect(page.locator("#total")).toHaveText("945 kg");
  const ms = await page.evaluate(async () => {
    const input = document.getElementById("entry-front");
    const total = document.getElementById("total");
    if (!(input instanceof HTMLInputElement) || total === null) throw new Error("missing entry or total");
    const t0 = performance.now();
    input.value = "170";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise<void>((resolve) => {
      if (total.textContent === "955 kg") { resolve(); return; }
      new MutationObserver((_, o) => { if (total.textContent === "955 kg") { o.disconnect(); resolve(); } }).observe(total, { childList: true, characterData: true, subtree: true });
    });
    return performance.now() - t0;
  });
  expect(ms).toBeLessThan(100);
});

test("[SR-0b76d9/AK-yf9k] table rows with mass, lever arm and moment including fuel", async ({ page }) => {
  await load(page, "HC4-01", A, 100, 60);
  await expect(page.locator("#table tbody tr").filter({ hasNotText: "at landing" })).toHaveText([
    /Empty mass\s*765 kg\s*2\.220 m\s*1698\.3 kg·m/u,
    /Front seats\s*160 kg\s*2\.000 m\s*320\.0 kg·m/u,
    /Rear seats\s*0 kg\s*3\.250 m\s*0\.0 kg·m/u,
    /Baggage compartment\s*20 kg\s*3\.950 m\s*79\.0 kg·m/u,
    /Usable fuel 100 L\s*72 kg\s*2\.350 m\s*169\.2 kg·m/u,
    /Total at take-off\s*1017 kg\s*2\.229 m\s*2266\.5 kg·m/u,
  ]);
});

test("[SR-0b76d9/AK-hnpk] table rows for the usable fuel and the total at landing", async ({ page }) => {
  await load(page, "HC4-01", A, 100, 60);
  await expect(page.locator("#table tbody tr").filter({ hasText: "at landing" })).toHaveText([
    /Usable fuel at landing 40 L\s*29 kg\s*2\.350 m\s*67\.7 kg·m/u,
    /Total at landing\s*974 kg\s*2\.223 m\s*2165\.0 kg·m/u,
  ]);
});

test("[SR-0b76d9/AK-kpx4] rounding is stated below the table", async ({ page }) => {
  await load(page, "HC4-01", A, 100, 60);
  await expect(page.locator("#rounding")).toHaveText("Masses rounded to 1 kg, lever arms to 0.001 m, moments to 0.1 kg·m");
});

test("[SR-5e3579/AK-mttg] top view marks the loading stations front to back", async ({ page }) => {
  await load(page, "HC4-01", A, 100, null);
  await expect(page.locator("#topview .mark-label")).toHaveText(["Front seats160 kg", "Usable fuel100 L", "Rear seats0 kg", "Baggage compartment20 kg"]);
  const ys = await page.locator("#topview .mark").evaluateAll((els) => els.map((e) => Number(e.getAttribute("y"))));
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);
});

test("[SR-5e3579/AK-vcx5] changed baggage mass updates its mark", async ({ page }) => {
  await load(page, "HC4-01", A, 100, null);
  await page.locator("#entry-baggage").fill("50");
  await expect(page.locator('#topview [data-station="baggage"] .mark-label')).toHaveText("Baggage compartment50 kg");
});

test("[SR-3f6229/AK-gc90] chart shows the envelope with take-off and landing points inside", async ({ page }) => {
  await load(page, "HC4-01", A, 100, 60);
  await expect(page.locator("#chart .envelope")).toHaveAttribute("data-corners", "650:2100 850:2100 1150:2300 1150:2470 650:2470");
  const p = page.locator("#chart #point");
  await expect(p).toHaveAttribute("data-mass", "1017");
  await expect(p).toHaveAttribute("data-cg", "2229");
  await expect(p).toHaveAttribute("data-state", "inside");
  const l = page.locator("#chart #point-landing");
  await expect(l).toHaveAttribute("data-mass", "974");
  await expect(l).toHaveAttribute("data-cg", "2223");
  await expect(l).toHaveAttribute("data-state", "inside");
});

test("[SR-3f6229/AK-q17h] take-off point aft of the aft limit is labelled", async ({ page }) => {
  await load(page, "HC4-01", AFT);
  await expect(page.locator("#chart #point")).toHaveAttribute("data-state", "outside");
  await expect(page.locator("#chart #point")).toHaveAttribute("data-cg", "2475");
  await expect(page.locator("#point-label")).toHaveText("Aft limit exceeded");
});

test("[SR-3f6229/AK-t5dd] take-off point forward of the forward limit is labelled", async ({ page }) => {
  await load(page, "HC4-01", [200, 0, 0]);
  await expect(page.locator("#chart #point")).toHaveAttribute("data-mass", "965");
  await expect(page.locator("#chart #point")).toHaveAttribute("data-cg", "2174");
  await expect(page.locator("#point-label")).toHaveText("Forward limit exceeded");
});

test("[SR-028748/AK-ffyn] envelope corners of the HC-4 as numbers", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-01");
  await expect(page.locator("#corners tbody tr")).toHaveText([
    /1\s*650 kg\s*2\.100 m/u, /2\s*850 kg\s*2\.100 m/u, /3\s*1150 kg\s*2\.300 m/u, /4\s*1150 kg\s*2\.470 m/u, /5\s*650 kg\s*2\.470 m/u,
  ]);
});

test("[SR-fc8953/AK-h476] selected aircraft is named above the results", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-02");
  await expect(page.locator("#selected")).toHaveText("HC4-02 · Halcyra HC-4");
  const sel = await box(page.locator("#selected"));
  const res = await box(page.locator("#result"));
  expect(sel.y).toBeLessThan(res.y);
});

test("[SR-fc8953/AK-cck7] aircraft selection lists the HC-4 fleet", async ({ page }) => {
  await open(page);
  await expect(page.locator("#aircraft option:not([value=''])")).toHaveText(["HC4-01", "HC4-02"]);
});

test("[SR-fc8953/AK-wbgb] no aircraft is preselected", async ({ page }) => {
  await open(page);
  await expect(page.locator("#aircraft")).toHaveValue("");
  await expect(page.locator("#select-hint")).toHaveText("Select the aircraft");
  await expect(page.locator("#entries input").first()).toBeHidden();
  await expect(page.locator("#result")).toBeHidden();
});

test("[SR-bdab78/AK-r318] HC4-01 empty: 765 kg at 2.220 m", async ({ page }) => {
  await load(page, "HC4-01", [0, 0, 0]);
  await expect(page.locator("#total")).toHaveText("765 kg");
  await expect(page.locator("#cg")).toHaveText("2.220 m");
});

test("[SR-bdab78/AK-d3h0] HC4-02 empty: 778 kg at 2.236 m", async ({ page }) => {
  await load(page, "HC4-02", [0, 0, 0]);
  await expect(page.locator("#total")).toHaveText("778 kg");
  await expect(page.locator("#cg")).toHaveText("2.236 m");
});

test("[SR-bdab78/AK-nybx] maximum take-off mass 1150 kg", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-01");
  await expect(page.locator("#mtom")).toHaveText("Maximum take-off mass 1150 kg");
});

test("[SR-663a61/AK-q89m] empty mass, lever arm and weighing date from the fleet data file", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-02");
  await expect(page.locator("#empty-data")).toHaveText("Empty mass 778 kg at 2.236 m, weighed 2026-09-14");
});

test("[SR-1329af/AK-y2jc] invented aircraft notice is the first text", async ({ page }) => {
  await open(page);
  const first = await page.evaluate(() => document.body.innerText.trim().split("\n")[0]);
  expect(first).toBe("Invented aircraft. Not for flight operations.");
});

test("[SR-1329af/AK-jnpb] responsibility statement above the first result", async ({ page }) => {
  await load(page, "HC4-01", A);
  await expect(page.locator("#aid")).toHaveText("This app is an aid. The pilot in command remains responsible for mass and balance according to the flight manual.");
  const aid = await box(page.locator("#aid"));
  const res = await page.locator("#result").evaluate((e) => (e instanceof HTMLElement ? e.offsetTop : Number.NaN));
  expect(aid.y).toBeLessThan(res);
});

// Fuel path
test("[SR-2dc652/AK-fp7w] usable fuel prefilled with the reported 142 L", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-01");
  await expect(page.locator('label[for="entry-fuel"]')).toHaveText("Usable fuel at take-off (max 170 L)");
  await expect(page.locator("#entry-fuel")).toHaveValue("142");
});

test("[SR-d26ffc/AK-s4dy] reported fuel quantity of HC4-01 with its report time", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-01");
  await expect(page.locator("#fuel-report")).toHaveText("Reported by the fuel system module: 142 L at 2026-11-02 05:40 UTC");
});

test("[SR-d26ffc/AK-hfph] reported fuel quantity follows the selected aircraft", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-01");
  await expect(page.locator("#fuel-report")).toContainText("142 L");
  await page.locator("#aircraft").selectOption("HC4-02");
  await expect(page.locator("#fuel-report")).toHaveText("Reported by the fuel system module: 96 L at 2026-11-02 05:15 UTC");
});

test("[SR-2dc652/AK-sj26] planned fuel burn is empty", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-01");
  await expect(page.locator('label[for="entry-burn"]')).toHaveText("Planned fuel burn");
  await expect(page.locator("#entry-burn")).toHaveValue("");
});

test("[SR-833e71/AK-xw0s] changed fuel shows the pilot's figure note", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-01");
  await page.locator("#entry-fuel").fill("100");
  await expect(page.locator("#fuel-note")).toHaveText("Pilot's figure (fuel system module reported 142 L)");
});

test("[SR-833e71/AK-v9q7] the check uses the pilot's figure", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-01");
  for (const [id, v] of [["front", 160], ["rear", 0], ["baggage", 20], ["burn", 0]] as const) await page.locator(`#entry-${id}`).fill(String(v));
  await page.locator("#entry-fuel").fill("100");
  await expect(page.locator("#total")).toHaveText("1017 kg");
});

test("[SR-833e71/AK-s4mq] back to the reported figure hides the note", async ({ page }) => {
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-01");
  await page.locator("#entry-fuel").fill("100");
  await expect(page.locator("#fuel-note")).toBeVisible();
  await page.locator("#entry-fuel").fill("142");
  await expect(page.locator("#fuel-note")).toBeHidden();
});

test("[SR-79804b/AK-cy7n] 100 L fuel at 0.72 kg/L and 2.350 m", async ({ page }) => {
  await load(page, "HC4-01", [0, 0, 0], 100, 0);
  await expect(page.locator("#total")).toHaveText("837 kg");
  await expect(page.locator("#cg")).toHaveText("2.231 m");
});

test("[SR-5689df/AK-bd65] fuel above the usable capacity shows a message", async ({ page }) => {
  await load(page, "HC4-01", [], 171, null);
  await expect(page.locator("#entry-fuel-msg")).toHaveText("Enter 0 to 170 L");
});

test("[SR-5689df/AK-z3vm] burn above the fuel at take-off shows a message", async ({ page }) => {
  await load(page, "HC4-01", [], 100, 101);
  await expect(page.locator("#entry-burn-msg")).toHaveText("Enter 0 to 100 L");
});

test("[SR-5689df/AK-cm4v] a fraction of a litre shows a message", async ({ page }) => {
  await load(page, "HC4-01", [], "12.5", null);
  await expect(page.locator("#entry-fuel-msg")).toHaveText("Enter 0 to 170 L");
});

test("[SR-90608c/AK-zmv0] landing within limits, labelled Landing", async ({ page }) => {
  await load(page, "HC4-01", A, 100, 60);
  await expect(page.locator("#result-ldg .state-name")).toHaveText("Landing");
  await expect(landing(page)).toHaveText("Within limits");
});

test("[SR-90608c/AK-nqrm] within limits at take-off, aft of the aft limit at landing", async ({ page }) => {
  await load(page, "HC4-01", [60, 190, 50], 50, 40);
  await expect(indication(page)).toHaveText("Within limits");
  await expect(landing(page)).toHaveText("Outside limits: centre of gravity outside envelope");
  await expect(page.locator("#landing-figures")).toHaveText("Landing 1072 kg at 2.472 m");
});
