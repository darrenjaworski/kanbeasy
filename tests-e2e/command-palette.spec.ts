import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
    localStorage.setItem(
      "kanbeasy:keyboardShortcutsEnabled",
      JSON.stringify("true"),
    );
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);
  await page.getByTestId("get-started-button").click();
});

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
