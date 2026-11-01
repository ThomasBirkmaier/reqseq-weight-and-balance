import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["junit", { outputFile: "test-results/e2e-junit.xml" }]],
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
