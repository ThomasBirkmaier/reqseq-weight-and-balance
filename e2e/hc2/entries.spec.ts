// End-to-end verification in the HC-2 build (below hc2/) of the selection, the entries, their
// messages and the fuel path, with HC-2 values. CI enriches this run with --variant VAR-f23826.
import { expect, test } from "@playwright/test";
import { HC2, hc2, indication, landing, load, open, patchCoreFleet } from "../helpers";

test.use({ serviceWorkers: "block" });

const NOT_COMPLETE = "Check not complete: fill in or correct the marked entries";

test("[SR-e6d15f/AK-q7ty] the HC-2 build lists HC2-01 only", async ({ page }) => {
  await open(page, HC2);
  await expect(page.locator("#aircraft option:not([value=''])")).toHaveText(["HC2-01"]);
});

test("[SR-e6d15f/AK-p3yv] the HC-2 build has no aircraft preselected", async ({ page }) => {
  await open(page, HC2);
  await expect(page.locator("#aircraft")).toHaveValue("");
  await expect(page.locator("#select-hint")).toHaveText("Select the aircraft");
  await expect(page.locator("#entries input").first()).toBeHidden();
  await expect(page.locator("#result")).toBeHidden();
});

test("[SR-b73090/AK-g5b4] the HC-2 build names the selected aircraft above the results", async ({ page }) => {
  await open(page, HC2);
  await page.locator("#aircraft").selectOption("HC2-01");
  await expect(page.locator("#selected")).toHaveText("HC2-01 · Halcyra HC-2");
});

test("[SR-b473b6/AK-jqz4] maximum take-off mass 880 kg next to the selected aircraft", async ({ page }) => {
  await open(page, HC2);
  await page.locator("#aircraft").selectOption("HC2-01");
  await expect(page.locator("#mtom")).toHaveText("Maximum take-off mass 880 kg");
  await expect(page.locator("#aircraft-info #mtom")).toBeVisible();
});

test("[SR-56d038/AK-xpmc] empty mass, lever arm and weighing date of HC2-01", async ({ page }) => {
  await open(page, HC2);
  await page.locator("#aircraft").selectOption("HC2-01");
  await expect(page.locator("#empty-data")).toHaveText("Empty mass 640 kg at 2.150 m, weighed 2025-11-20");
});

test("[SR-5ca0ef/AK-y112] HC2-01 has empty entries for the front seats and the baggage only", async ({ page }) => {
  await open(page, HC2);
  await page.locator("#aircraft").selectOption("HC2-01");
  await expect(page.locator("#entries label")).toHaveText([
    "Front seats (max 220 kg)",
    "Baggage compartment (max 40 kg)",
  ]);
  await expect(page.locator("#entry-front")).toHaveValue("");
  await expect(page.locator("#entry-baggage")).toHaveValue("");
  await expect(page.locator("#entry-rear")).toHaveCount(0);
});

test("[SR-5ca0ef/AK-mff8] 160 kg front seats give 800 kg", async ({ page }) => {
  await hc2(page, [160, 0]);
  await expect(page.locator("#entry-front")).toHaveValue("160");
  await expect(page.locator("#total")).toHaveText("800 kg");
});

test("[SR-a0bfa5/AK-fhzy] 221 kg front seats show a message", async ({ page }) => {
  await hc2(page, [221]);
  await expect(page.locator("#entry-front-msg")).toHaveText("Enter 0 to 220 kg");
});

test("[SR-a0bfa5/AK-md3f] 41 kg baggage shows a message", async ({ page }) => {
  await hc2(page, [0, 41]);
  await expect(page.locator("#entry-baggage-msg")).toHaveText("Enter 0 to 40 kg");
});

test("[SR-a0bfa5/AK-v6rs] a fraction of a kilogram in the baggage shows a message", async ({ page }) => {
  await hc2(page, [0, "7.5"]);
  await expect(page.locator("#entry-baggage-msg")).toHaveText("Enter 0 to 40 kg");
});

test("[SR-38e14b/AK-tj3m] 105 L usable fuel shows a message", async ({ page }) => {
  await hc2(page, [], 105, null);
  await expect(page.locator("#entry-fuel-msg")).toHaveText("Enter 0 to 104 L");
});

test("[SR-38e14b/AK-n3ch] burn above the fuel at take-off shows a message", async ({ page }) => {
  await hc2(page, [], 50, 51);
  await expect(page.locator("#entry-burn-msg")).toHaveText("Enter 0 to 50 L");
});

test("[SR-38e14b/AK-q0vz] a fraction of a litre shows a message", async ({ page }) => {
  await hc2(page, [], "12.5", null);
  await expect(page.locator("#entry-fuel-msg")).toHaveText("Enter 0 to 104 L");
});

test("[SR-b59c9a/AK-jgk2] front seats 221 kg give check not complete at take-off and landing", async ({ page }) => {
  await hc2(page, [221, 0]);
  await expect(indication(page)).toHaveText(NOT_COMPLETE);
  await expect(landing(page)).toHaveText(NOT_COMPLETE);
  await expect(indication(page)).not.toContainText("Within limits");
  await expect(landing(page)).not.toContainText("Within limits");
});

test("[SR-b59c9a/AK-k0w1] cleared usable fuel gives check not complete", async ({ page }) => {
  await hc2(page, [0, 0], "", 0);
  await expect(indication(page)).toHaveText(NOT_COMPLETE);
  await expect(indication(page)).not.toContainText("Within limits");
});

test("[SR-b59c9a/AK-qp17] corrected front seats give a limit indication", async ({ page }) => {
  await hc2(page, [221, 0]);
  await page.locator("#entry-front").fill("0");
  await expect(indication(page)).not.toContainText("Check not complete");
});

test("[SR-454f89/AK-b1xz] usable fuel prefilled with the reported 78 L", async ({ page }) => {
  await open(page, HC2);
  await page.locator("#aircraft").selectOption("HC2-01");
  await expect(page.locator('label[for="entry-fuel"]')).toHaveText("Usable fuel at take-off (max 104 L)");
  await expect(page.locator("#entry-fuel")).toHaveValue("78");
});

test("[SR-40bf74/AK-rcdy] planned fuel burn is empty", async ({ page }) => {
  await open(page, HC2);
  await page.locator("#aircraft").selectOption("HC2-01");
  await expect(page.locator("#entry-burn")).toHaveValue("");
});

test("[SR-65c4ef/AK-d4yp] reported fuel quantity of HC2-01 with its report time", async ({ page }) => {
  await open(page, HC2);
  await page.locator("#aircraft").selectOption("HC2-01");
  await expect(page.locator("#fuel-report")).toHaveText(
    "Reported by the fuel system module: 78 L at 2026-11-02 05:50 UTC",
  );
});

test("[SR-28746d/AK-t4k4] changed fuel shows the pilot's figure note", async ({ page }) => {
  await load(page, "HC2-01", [], null, null, HC2);
  await page.locator("#entry-fuel").fill("50");
  await expect(page.locator("#fuel-note")).toHaveText("Pilot's figure (fuel system module reported 78 L)");
});

test("[SR-28746d/AK-n6ps] back to the reported figure hides the note", async ({ page }) => {
  await load(page, "HC2-01", [], null, null, HC2);
  await page.locator("#entry-fuel").fill("50");
  await expect(page.locator("#fuel-note")).toBeVisible();
  await page.locator("#entry-fuel").fill("78");
  await expect(page.locator("#fuel-note")).toBeHidden();
});

test("[SR-439d2c/AK-z812] the check uses the pilot's figure", async ({ page }) => {
  await load(page, "HC2-01", [0, 0], null, 0, HC2);
  await expect(page.locator("#entry-fuel")).toHaveValue("78");
  await page.locator("#entry-fuel").fill("50");
  await expect(page.locator("#total")).toHaveText("676 kg");
});

test("[SR-9d15c9/AK-w7qh] HC2-01 without a fuel report has an empty fuel entry and a statement", async ({ page }) => {
  await patchCoreFleet(page, { kind: "no-report", aircraft: "HC2-01" });
  await open(page, HC2);
  await page.locator("#aircraft").selectOption("HC2-01");
  await expect(page.locator("#entry-fuel")).toHaveValue("");
  await expect(page.locator("#fuel-report")).toHaveText("No report of the fuel system module");
});

test("[SR-9d15c9/AK-f090] without a fuel report the check is not complete until the fuel is entered", async ({
  page,
}) => {
  await patchCoreFleet(page, { kind: "no-report", aircraft: "HC2-01" });
  await hc2(page, [160, 20], null, 10);
  await expect(indication(page)).toHaveText(NOT_COMPLETE);
  await page.locator("#entry-fuel").fill("50");
  await expect(indication(page)).not.toContainText("Check not complete");
});
