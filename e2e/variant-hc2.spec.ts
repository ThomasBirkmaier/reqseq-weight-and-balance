// End-to-end verification of the variant requirements in the HC-2 build (below hc2/).
import { expect, test } from "@playwright/test";
import { indication, load, open } from "./helpers";

test("[SR-d0fb6e/AK1] HC2-01 empty: 640 kg at 2.150 m", async ({ page }) => {
  await load(page, "HC2-01", [0, 0], "/hc2/");
  await expect(page.locator("#total")).toHaveText("640 kg");
  await expect(page.locator("#cg")).toHaveText("2.150 m");
});

test("[SR-d0fb6e/AK2] HC2-01 entries without rear seats", async ({ page }) => {
  await open(page, "/hc2/");
  await page.selectOption("#aircraft", "HC2-01");
  await expect(page.locator("#entries label")).toHaveText(["Front seats (max 220 kg)", "Baggage compartment (max 40 kg)"]);
});

test("[SR-d0fb6e/AK3] HC2-01 aft of the aft limit", async ({ page }) => {
  await load(page, "HC2-01", [60, 40], "/hc2/");
  await expect(page.locator("#total")).toHaveText("740 kg");
  await expect(page.locator("#cg")).toHaveText("2.178 m");
  await expect(indication(page)).toHaveText("Outside limits: centre of gravity outside envelope");
});

test("[SR-b73090/AK1] HC-2 build names the selected aircraft", async ({ page }) => {
  await open(page, "/hc2/");
  await page.selectOption("#aircraft", "HC2-01");
  await expect(page.locator("#selected")).toHaveText("HC2-01 · Halcyra HC-2");
});

test("[SR-b73090/AK2] HC-2 build lists HC2-01 only", async ({ page }) => {
  await open(page, "/hc2/");
  await expect(page.locator("#aircraft option:not([value=''])")).toHaveText(["HC2-01"]);
});

test("[SR-b73090/AK3] HC-2 build has no aircraft preselected", async ({ page }) => {
  await open(page, "/hc2/");
  await expect(page.locator("#aircraft")).toHaveValue("");
  await expect(page.locator("#select-hint")).toHaveText("Select the aircraft");
  await expect(page.locator("#result")).toBeHidden();
});
