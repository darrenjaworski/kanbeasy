import { test, expect } from "@playwright/test";

// Basic smoke test to verify the app loads and the settings modal toggles

test("app loads and settings modal can be opened/closed", async ({ page }) => {
  await page.goto("/");

  // Header title visible
  await expect(page.getByRole("heading", { name: "Kanbeasy" })).toBeVisible();

  // Open settings
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();

  // Toggle dark mode switch via keyboard to avoid overlay intercepts
  const darkSwitch = page.getByRole("switch", { name: "Dark mode" });
  const wasChecked = await darkSwitch.isChecked();
  await darkSwitch.focus();
  await page.keyboard.press(" ");
  if (wasChecked) {
    await expect(darkSwitch).not.toBeChecked();
  } else {
    await expect(darkSwitch).toBeChecked();
  }

  // Close settings via the in-dialog close button
  const dialog = page.getByRole("dialog", { name: "Settings" });
  await dialog.getByRole("button", { name: "Close settings" }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeHidden();
});
