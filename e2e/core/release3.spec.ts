// End-to-end verification in the core build of the requirements that release 3 added or split:
// the mass label in the chart, the offline date per aircraft, an aircraft without a fuel report,
// a calculation core with data of an unexpected form and the planned fuel burn with the landing.
import { expect, test } from "@playwright/test";
import { indication, load, open, patchCoreFleet } from "../helpers";

test.use({ serviceWorkers: "block" });

const LOAD_ERROR = "The app could not load its data. Reload the page.";

test("[SR-cb6dc1/AK-g90h] take-off point above the maximum take-off mass is labelled", async ({ page }) => {
  await load(page, "HC4-01", [180, 160, 50]);
  await expect(page.locator("#chart #point")).toHaveAttribute("data-mass", "1155");
  await expect(page.locator("#chart #point")).toHaveAttribute("data-cg", "2403");
  await expect(page.locator("#chart #point")).toHaveAttribute("data-state", "outside");
  await expect(page.locator("#point-label")).toHaveText("Mass limit exceeded");
});

test("[SR-55a648/AK-mg11] the offline notice names the weighing date of the newly selected aircraft", async ({
  page,
  context,
}) => {
  await load(page, "HC4-01", [0, 0, 0]);
  await context.setOffline(true);
  await expect(page.locator("#offline")).toHaveText(
    "Offline: aircraft data as of 2026-03-02. Check the weighing date against the aircraft documents.",
  );
  await page.locator("#aircraft").selectOption("HC4-02");
  await expect(page.locator("#offline")).toHaveText(
    "Offline: aircraft data as of 2026-09-14. Check the weighing date against the aircraft documents.",
  );
  await context.setOffline(false);
});

test("[SR-9d15c9/AK-w7qh] an aircraft without a fuel report has an empty fuel entry and a statement", async ({
  page,
}) => {
  await patchCoreFleet(page, { kind: "no-report", aircraft: "HC4-02" });
  await open(page);
  await page.locator("#aircraft").selectOption("HC4-02");
  await expect(page.locator("#entry-fuel")).toHaveValue("");
  await expect(page.locator("#fuel-report")).toHaveText("No report of the fuel system module");
});

test("[SR-9d15c9/AK-f090] without a fuel report the check is not complete until the fuel is entered", async ({
  page,
}) => {
  await patchCoreFleet(page, { kind: "no-report", aircraft: "HC4-02" });
  await load(page, "HC4-02", [160, 0, 20], null, 10);
  await expect(indication(page)).toHaveText("Check not complete: fill in or correct the marked entries");
  await page.locator("#entry-fuel").fill("50");
  await expect(indication(page)).not.toContainText("Check not complete");
});

test("[SR-ecf597/AK-n6bb] a calculation core answering with data of an unexpected form gives a message", async ({
  page,
}) => {
  await patchCoreFleet(page, { kind: "answer", json: '{"type":{},"aircraft":[]}' });
  await page.goto("/");
  await expect(page.locator("body")).toHaveAttribute("data-ready", "error");
  await expect(page.locator("#load-error")).toHaveText(LOAD_ERROR);
  await expect(page.locator("#work")).toBeHidden();
});

test("[SR-ecf597/AK-n6bb] a calculation core refusing its data file gives a message", async ({ page }) => {
  await patchCoreFleet(page, {
    kind: "answer",
    json: '{"error":"fuel interface data file: unsupported interface version 2.0.0"}',
  });
  await page.goto("/");
  await expect(page.locator("#load-error")).toHaveText(LOAD_ERROR);
  await expect(page.locator("#aircraft option:not([value=''])")).toHaveCount(0);
});

test("[SR-8597d9/AK-xtjm] the landing result names the planned fuel burn", async ({ page }) => {
  await load(page, "HC4-01", [160, 0, 20], 100, 30);
  await expect(page.locator("#landing-burn")).toHaveText("after 30 L planned fuel burn");
});

test("[SR-8597d9/AK-j7xw] a changed planned fuel burn changes the landing result", async ({ page }) => {
  await load(page, "HC4-01", [160, 0, 20], 100, 30);
  await page.locator("#entry-burn").fill("10");
  await expect(page.locator("#landing-burn")).toHaveText("after 10 L planned fuel burn");
});
