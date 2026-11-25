// End-to-end verification in the HC-2 build (below hc2/) of the computed results and the limit
// indications at take-off and landing, with HC-2 values. CI enriches this run with
// --variant VAR-f23826. hc2() enters 0 L usable fuel and 0 L planned fuel burn unless named.
import { expect, test } from "@playwright/test";
import { hc2, indication, landing } from "../helpers";

test.use({ serviceWorkers: "block" });

const B = [160, 20]; // with 50 L fuel and 30 L burn: take-off 856 kg at 2.137 m, landing 834 kg at 2.138 m
const MASS = "Outside limits: total mass above maximum take-off mass";
const CG = "Outside limits: centre of gravity outside envelope";

test("[SR-d0fb6e/AK-j03d] HC2-01 empty: 640 kg at 2.150 m", async ({ page }) => {
  await hc2(page, [0, 0]);
  await expect(page.locator("#total")).toHaveText("640 kg");
  await expect(page.locator("#cg")).toHaveText("2.150 m");
});

test("[SR-d0fb6e/AK-jsz9] HC2-01 with 220 kg front seats: 860 kg at 2.112 m", async ({ page }) => {
  await hc2(page, [220, 0]);
  await expect(page.locator("#total")).toHaveText("860 kg");
  await expect(page.locator("#cg")).toHaveText("2.112 m");
});

test("[SR-d0fb6e/AK-d8yh] HC2-01 with 40 kg baggage: 680 kg at 2.194 m", async ({ page }) => {
  await hc2(page, [0, 40]);
  await expect(page.locator("#total")).toHaveText("680 kg");
  await expect(page.locator("#cg")).toHaveText("2.194 m");
});

test("[SR-fe9cb7/AK-hx3d] total mass at take-off 856 kg", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#total")).toHaveText("856 kg");
});

test("[SR-fe9cb7/AK-wzrh] total mass at take-off 640 kg with nothing loaded", async ({ page }) => {
  await hc2(page, [0, 0]);
  await expect(page.locator("#total")).toHaveText("640 kg");
});

test("[SR-fe9cb7/AK-byfn] landing mass 834 kg", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#landing-figures")).toHaveText("Landing 834 kg at 2.138 m");
});

test("[SR-cfa742/AK-m0tc] centre of gravity at take-off 2.137 m", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#cg")).toHaveText("2.137 m");
});

test("[SR-cfa742/AK-xwk7] centre of gravity at take-off 2.178 m", async ({ page }) => {
  await hc2(page, [60, 40]);
  await expect(page.locator("#cg")).toHaveText("2.178 m");
});

test("[SR-cfa742/AK-dtbh] centre of gravity at landing 2.138 m", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#landing-figures")).toHaveText("Landing 834 kg at 2.138 m");
});

test("[SR-e47cbf/AK-k2b3] 50 L fuel at 0.72 kg/L and 2.100 m", async ({ page }) => {
  await hc2(page, [0, 0], 50, 0);
  await expect(page.locator("#total")).toHaveText("676 kg");
  await expect(page.locator("#cg")).toHaveText("2.147 m");
});

test("[SR-7c1ea4/AK-p8jn] take-off within limits", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#result-to .state-name")).toHaveText("Take-off");
  await expect(indication(page)).toHaveText("Within limits");
});

test("[SR-7c1ea4/AK-fk8j] exactly the maximum take-off mass 880 kg is within limits", async ({ page }) => {
  await hc2(page, [200, 40]);
  await expect(page.locator("#total")).toHaveText("880 kg");
  await expect(indication(page)).toHaveText("Within limits");
});

test("[SR-7c1ea4/AK-tp9y] exactly on the aft limit is within limits", async ({ page }) => {
  await hc2(page, [75, 35]);
  await expect(page.locator("#total")).toHaveText("750 kg");
  await expect(page.locator("#cg")).toHaveText("2.170 m");
  await expect(indication(page)).toHaveText("Within limits");
});

test("[SR-43c934/AK-t9d1] 900 kg shows mass above maximum take-off mass", async ({ page }) => {
  await hc2(page, [220, 40]);
  await expect(page.locator("#total")).toHaveText("900 kg");
  await expect(indication(page)).toContainText(MASS);
  await expect(indication(page)).not.toContainText("Within limits");
});

test("[SR-43c934/AK-br3y] 880.72 kg with 1 L fuel shows mass above maximum take-off mass", async ({ page }) => {
  await hc2(page, [200, 40], 1, 0);
  await expect(indication(page)).toContainText(MASS);
});

test("[SR-43c934/AK-hqkf] mass and centre of gravity both outside, mass first", async ({ page }) => {
  await hc2(page, [220, 0], 30, 0);
  await expect(page.locator("#total")).toHaveText("882 kg");
  await expect(page.locator("#cg")).toHaveText("2.111 m");
  await expect(indication(page).locator("span")).toHaveText([MASS, CG]);
});

test("[SR-a93b59/AK-srwc] forward of the forward limit (860 kg at 2.112 m)", async ({ page }) => {
  await hc2(page, [220, 0]);
  await expect(indication(page)).toHaveText(CG);
  await expect(indication(page)).not.toContainText("Within limits");
});

test("[SR-a93b59/AK-qq3j] aft of the aft limit (740 kg at 2.178 m)", async ({ page }) => {
  await hc2(page, [60, 40]);
  await expect(page.locator("#total")).toHaveText("740 kg");
  await expect(indication(page)).toHaveText(CG);
  await expect(indication(page)).not.toContainText("Within limits");
});

test("[SR-a93b59/AK-tkf9] exactly on the aft limit is not outside the envelope", async ({ page }) => {
  await hc2(page, [75, 35]);
  await expect(page.locator("#cg")).toHaveText("2.170 m");
  await expect(indication(page)).not.toContainText(CG);
});

test("[SR-bd8e44/AK-yhsm] landing within limits, labelled Landing", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#result-ldg .state-name")).toHaveText("Landing");
  await expect(landing(page)).toHaveText("Within limits");
});

test("[SR-bd8e44/AK-dnhh] within limits at take-off, aft of the aft limit at landing", async ({ page }) => {
  await hc2(page, [60, 35], 52, 10);
  await expect(indication(page)).toHaveText("Within limits");
  await expect(landing(page)).toHaveText(CG);
});

test("[SR-8597d9/AK-xtjm] the landing result names the planned fuel burn", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await expect(page.locator("#landing-burn")).toHaveText("after 30 L planned fuel burn");
});

test("[SR-8597d9/AK-j7xw] a changed planned fuel burn changes the landing result", async ({ page }) => {
  await hc2(page, B, 50, 30);
  await page.locator("#entry-burn").fill("10");
  await expect(page.locator("#landing-burn")).toHaveText("after 10 L planned fuel burn");
});

test("[SR-588924/AK-rksb] results update within 100 ms without a button", async ({ page }) => {
  await hc2(page, B);
  await expect(page.locator("#total")).toHaveText("820 kg");
  const ms = await page.evaluate(async () => {
    const input = document.getElementById("entry-front");
    const total = document.getElementById("total");
    if (!(input instanceof HTMLInputElement) || total === null) {
      throw new Error("missing entry or total");
    }
    const t0 = performance.now();
    input.value = "170";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise<void>((resolve) => {
      const done = (): boolean => total.textContent === "830 kg";
      if (done()) {
        resolve();
        return;
      }
      new MutationObserver((_, o) => {
        if (done()) {
          o.disconnect();
          resolve();
        }
      }).observe(total, { childList: true, characterData: true, subtree: true });
    });
    return performance.now() - t0;
  });
  expect(ms).toBeLessThan(100);
});
