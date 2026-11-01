import { expect, type Page } from "@playwright/test";

export async function open(page: Page, path = "/"): Promise<void> {
  await page.goto(path);
  await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
}

export async function load(page: Page, aircraft: string, masses: (string | number)[], path = "/"): Promise<void> {
  await open(page, path);
  await page.selectOption("#aircraft", aircraft);
  const inputs = page.locator("#entries input");
  for (let i = 0; i < masses.length; i++) await inputs.nth(i).fill(String(masses[i]));
}

export const indication = (page: Page) => page.locator("#indication");

/** Contrast ratio (WCAG) of an element's text or stroke colour against its effective background. */
export async function contrast(page: Page, selector: string, prop: "color" | "stroke" = "color"): Promise<number> {
  return page.locator(selector).first().evaluate((el, prop) => {
    const rgb = (s: string) => (s.match(/[\d.]+/g) ?? ["0", "0", "0", "0"]).map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const fg = rgb(getComputedStyle(el)[prop as "color"]);
    let bgEl: Element | null = el;
    let bg = [255, 255, 255];
    while (bgEl) {
      const c = rgb(getComputedStyle(bgEl).backgroundColor);
      if (c.length < 4 || c[3] > 0) { bg = c; break; }
      bgEl = bgEl.parentElement;
    }
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  }, prop);
}
