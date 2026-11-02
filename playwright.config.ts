import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results/e2e",
  fullyParallel: true,
  retries: 0,
  // One JUnit file per project run: CI runs the core and the HC-2 suites separately, so that the
  // HC-2 run can be enriched for the variant (PLAYWRIGHT_JUNIT_OUTPUT_FILE names the file).
  reporter: [["list"], ["junit", { outputFile: process.env.PLAYWRIGHT_JUNIT_OUTPUT_FILE ?? "test-results/e2e-junit.xml" }]],
  projects: [
    { name: "core", testDir: "e2e/core" },
    { name: "hc2", testDir: "e2e/hc2" },
    { name: "walkthrough", testDir: "e2e/walkthrough" },
  ],
  use: {
    baseURL: "http://127.0.0.1:4173/",
    screenshot: "on",
    ...devices["Desktop Chrome"],
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: {
    command: "node scripts/serve.mjs dist 4173",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: !process.env.CI,
  },
});
