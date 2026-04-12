import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4322";
const gaMeasurementId = "G-TEST123456";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  retries: 0,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `PUBLIC_GA4_MEASUREMENT_ID=${gaMeasurementId} npm run build && npm run preview:ci`,
    url: baseURL,
    reuseExistingServer: false,
    stdout: "ignore",
    stderr: "pipe",
  },
});
