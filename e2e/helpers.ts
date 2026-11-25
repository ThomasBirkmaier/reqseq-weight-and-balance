import { expect, type Locator, type Page } from "@playwright/test";

/** Position and size of an element on the page. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The bounding box of a visible element; fails the test when the element has none. */
export async function box(locator: Locator): Promise<Box> {
  const b = await locator.boundingBox();
  if (b === null) throw new Error("element has no bounding box (not visible)");
  return b;
}

/** Opens the app at `path` and waits until the calculation core is loaded. */
export async function open(page: Page, path = "/"): Promise<void> {
  await page.goto(path);
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
}

/** Select the aircraft and enter the masses, then the usable fuel at take-off and the planned
 * fuel burn (default 0 L and 0 L, as the acceptance criteria that keep their release 1 values say). */
export async function load(
  page: Page,
  aircraft: string,
  masses: (string | number)[],
  fuel: string | number | null = 0,
  burn: string | number | null = 0,
  path = "/",
): Promise<void> {
  await open(page, path);
  await page.locator("#aircraft").selectOption(aircraft);
  const inputs = page.locator("#entries input");
  if (fuel !== null) await page.locator("#entry-fuel").fill(String(fuel));
  if (burn !== null) await page.locator("#entry-burn").fill(String(burn));
  for (let i = 0; i < masses.length; i++) await inputs.nth(i).fill(String(masses[i]));
}

/** The limit indication at take-off. */
export const indication = (page: Page): Locator => page.locator("#indication");
/** The limit indication at landing. */
export const landing = (page: Page): Locator => page.locator("#landing-indication");

/** Contrast ratio (WCAG) of an element's text or stroke colour against its effective background. */
export async function contrast(page: Page, selector: string, prop: "color" | "stroke" = "color"): Promise<number> {
  return page
    .locator(selector)
    .first()
    .evaluate((el, property) => {
      const rgb = (s: string): number[] => (s.match(/[\d.]+/gu) ?? ["0", "0", "0", "0"]).map(Number);
      const lum = ([r = 0, g = 0, b = 0]: number[]): number => {
        const f = (c: number): number => {
          const v = c / 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const style = getComputedStyle(el);
      const fg = rgb(property === "color" ? style.color : style.stroke);
      let bgEl: Element | null = el;
      let bg = [255, 255, 255];
      while (bgEl !== null) {
        const c = rgb(getComputedStyle(bgEl).backgroundColor);
        if (c.length < 4 || (c[3] ?? 0) > 0) {
          bg = c;
          break;
        }
        bgEl = bgEl.parentElement;
      }
      const [a = 0, b = 0] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      return (a + 0.05) / (b + 0.05);
    }, prop);
}
