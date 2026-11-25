// End-to-end verification in the HC-2 build (below hc2/) of the notices, the table, the top view
// and the chart, with HC-2 values. CI enriches this run with --variant VAR-f23826.
import { expect, test } from "@playwright/test";
import { box, HC2, hc2, open } from "../helpers";

test.use({ serviceWorkers: "block" });

const B = [160, 20]; // with 50 L fuel and 30 L burn: take-off 856 kg at 2.137 m, landing 834 kg at 2.138 m

test("[SR-1329af/AK-y2jc] invented aircraft notice is the first text of the HC-2 build", async ({ page }) => {
  await open(page, HC2);
  const first = await page.evaluate(() => document.body.innerText.trim().split("\n")[0]);
  expect(first).toBe("Invented aircraft. Not for flight operations.");
});

test("[SR-dffb5b/AK-pdxp] responsibility statement above the first result", async ({ page }) => {
  await hc2(page, B);
  await expect(page.locator("#aid")).toHaveText(
    "This app is an aid. The pilot in command remains responsible for mass and balance according to the flight manual.",
  );
  const aid = await box(page.locator("#aid"));
  const res = await page.locator("#result").evaluate((e) => (e instanceof HTMLElement ? e.offsetTop : Number.NaN));
  expect(aid.y).toBeLessThan(res);
});

test("[SR-ea51a5/AK-fp9b] table rows at take-off including fuel", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#table tbody tr").filter({ hasNotText: "at landing" })).toHaveText([
    /Empty mass\s*640 kg\s*2\.150 m\s*1376\.0 kg·m/u,
    /Front seats\s*160 kg\s*2\.000 m\s*320\.0 kg·m/u,
    /Baggage compartment\s*20 kg\s*2\.900 m\s*58\.0 kg·m/u,
    /Usable fuel 50 L\s*36 kg\s*2\.100 m\s*75\.6 kg·m/u,
    /Total at take-off\s*856 kg\s*2\.137 m\s*1829\.6 kg·m/u,
  ]);
});

test("[SR-ea51a5/AK-y94k] rounding is stated below the table", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#rounding")).toHaveText(
    "Masses rounded to 1 kg, lever arms to 0.001 m, moments to 0.1 kg·m",
  );
});

test("[SR-ea51a5/AK-rvb6] table rows for the usable fuel and the total at landing", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#table tbody tr").filter({ hasText: "at landing" })).toHaveText([
    /Usable fuel at landing 20 L\s*14 kg\s*2\.100 m\s*30\.2 kg·m/u,
    /Total at landing\s*834 kg\s*2\.138 m\s*1784\.2 kg·m/u,
  ]);
});

test("[SR-113683/AK-gdmm] top view marks front to back", async ({ page }) => {
  await hc2(page, B, 50, null);
  await expect(page.locator("#topview .mark-label")).toHaveText([
    "Front seats160 kg",
    "Usable fuel50 L",
    "Baggage compartment20 kg",
  ]);
  const ys = await page.locator("#topview .mark").evaluateAll((els) => els.map((e) => Number(e.getAttribute("y"))));
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);
});

test("[SR-113683/AK-k0nx] changed baggage mass updates its mark", async ({ page }) => {
  await hc2(page, B, 50, null);
  await page.locator("#entry-baggage").fill("40");
  await expect(page.locator('#topview [data-station="baggage"] .mark-label')).toHaveText("Baggage compartment40 kg");
});

test("[SR-0c6fc0/AK-t3p8] chart with the HC-2 envelope, take-off and landing points inside", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#chart .envelope")).toHaveAttribute(
    "data-corners",
    "550:2050 750:2050 880:2130 880:2170 550:2170",
  );
  for (const [id, mass, cg] of [
    ["#point", "856", "2137"],
    ["#point-landing", "834", "2138"],
  ] as const) {
    const p = page.locator(`#chart ${id}`);
    await expect(p).toHaveAttribute("data-mass", mass);
    await expect(p).toHaveAttribute("data-cg", cg);
    await expect(p).toHaveAttribute("data-state", "inside");
  }
});

for (const [ak, masses, mass, cg, label] of [
  ["mkx9", [60, 40], "740", "2178", "Aft limit exceeded"],
  ["ss3k", [220, 0], "860", "2112", "Forward limit exceeded"],
  ["pmj5", [220, 40], "900", "2147", "Mass limit exceeded"],
] as const) {
  test(`[SR-867afc/AK-${ak}] take-off point at ${mass} kg labelled ${label}`, async ({ page }) => {
    await hc2(page, [...masses]);
    const p = page.locator("#chart #point");
    await expect(p).toHaveAttribute("data-mass", mass);
    await expect(p).toHaveAttribute("data-cg", cg);
    await expect(p).toHaveAttribute("data-state", "outside");
    await expect(page.locator("#point-label")).toHaveText(label);
  });
}

test("[SR-03f2e6/AK-zz0d] envelope corners of the HC-2 as numbers", async ({ page }) => {
  await open(page, HC2);
  await page.locator("#aircraft").selectOption("HC2-01");
  await expect(page.locator("#corners tbody tr")).toHaveText([
    /1\s*550 kg\s*2\.050 m/u,
    /2\s*750 kg\s*2\.050 m/u,
    /3\s*880 kg\s*2\.130 m/u,
    /4\s*880 kg\s*2\.170 m/u,
    /5\s*550 kg\s*2\.170 m/u,
  ]);
});
