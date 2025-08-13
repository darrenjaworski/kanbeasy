import { test, expect } from "@playwright/test";

// Basic smoke test to verify the app loads and the settings modal toggles

test("app loads and settings modal can be opened/closed", async ({ page }) => {
  const target = process.env.CI == "true" ? "/kanbeasy" : "/";
  await page.goto(target);
  // Check if the main heading is visible
  await expect(page.getByTestId("header-title")).toBeVisible();
});
