import { test, expect } from "./fixtures";

test.use({ seed: { keyboardShortcutsEnabled: true } });

test("clicking keyboard shortcut hint opens command palette", async ({
  page,
}) => {
  const hint = page.getByTestId("keyboard-shortcut-hint");
  await expect(hint).toBeVisible();

  await hint.click();

  const palette = page.getByTestId("command-palette");
  await expect(palette).toBeVisible();
  await expect(page.getByTestId("command-palette-input")).toBeFocused();
});

test("command palette closes when backdrop is clicked", async ({ page }) => {
  await page.getByTestId("keyboard-shortcut-hint").click();
  await expect(page.getByTestId("command-palette")).toBeVisible();

  await page.getByTestId("command-palette-backdrop").click();
  await expect(page.getByTestId("command-palette")).not.toBeVisible();
});
