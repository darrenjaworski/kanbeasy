import { defineConfig, devices } from "@playwright/test";

const deployedBaseURL = process.env.E2E_BASE_URL; // e.g. https://<user>.github.io/<repo>
const isDeployedRun = Boolean(deployedBaseURL);
const isCI = process.env.CI == "true";

export default defineConfig({
  testDir: "./tests-e2e",
  timeout: 30_000,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : [["list"], ["html"]],
  use: {
    baseURL: deployedBaseURL || "http://localhost:5173",
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Only start a local dev server when not targeting a deployed site
  webServer: isDeployedRun
    ? undefined
    : {
        command: "npm run dev",
        port: 5173,
        reuseExistingServer: !isCI,
        timeout: 60_000,
      },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
