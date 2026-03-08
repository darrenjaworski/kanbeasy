import { test, expect, idbKvGet } from "./fixtures";

test("can select a dark theme", async ({ page }) => {
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();

  // Expand the Appearance section
  await dlg.getByRole("button", { name: /appearance/i }).click();

  // Switch to dark mode, then pick a dark theme
  await dlg.getByRole("button", { name: /dark/i }).click();
  await dlg.getByRole("button", { name: /midnight theme/i }).click();

  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.classList.contains("dark")),
    )
    .toBe(true);

  await dlg.getByRole("button", { name: /close settings/i }).click();
});

test("has a setting to adjust the size of the cards via card layout editor", async ({
  page,
}) => {
  // Prepare a column with a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await expect(column).toBeVisible();
  await column.getByTestId("add-card-button-0").click();

  // Default title lines = 1
  await expect(column.getByTestId("card-content-0")).toHaveAttribute(
    "rows",
    "1",
  );

  // Open settings → Appearance → Card Layout Editor
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog");
  await expect(dlg).toBeVisible();
  await dlg.getByRole("button", { name: /appearance/i }).click();
  await dlg.getByRole("button", { name: /card layout editor/i }).click();

  // Change title line count to 3
  const titleSelect = dlg.getByRole("combobox", { name: /title line count/i });
  await expect(titleSelect).toHaveValue("1");
  await titleSelect.selectOption("3");
  await expect(titleSelect).toHaveValue("3");

  // Close modal
  await page.keyboard.press("Escape");

  // Card textarea should now have rows=3
  await expect(column.getByTestId("card-content-0")).toHaveAttribute(
    "rows",
    "3",
  );
});

test("compact header hides text labels", async ({ page }) => {
  // Add a column so view toggles are enabled
  await page.getByTestId("add-column-button").click();
  const col = page.getByTestId("column-0");
  await col.getByTestId("add-card-button-0").click();

  // Labels should be visible by default
  await expect(page.getByText("Settings")).toBeVisible();
  await expect(page.getByText("Board")).toBeVisible();

  // Enable compact header
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await dlg.getByRole("button", { name: /appearance/i }).click();
  await dlg.getByText("Compact header").click();
  await dlg.getByRole("button", { name: /close settings/i }).click();

  // Text labels should be hidden
  await expect(page.getByText("Board")).not.toBeVisible();
  await expect(page.getByText("Settings")).not.toBeVisible();
  await expect(page.getByText("Analytics")).not.toBeVisible();

  // Icon buttons should still be accessible
  await expect(page.getByRole("radio", { name: /board view/i })).toBeVisible();
  await expect(page.getByLabel("Open settings")).toBeVisible();

  // Setting is persisted to IndexedDB
  await expect
    .poll(() => idbKvGet(page, "kanbeasy:compactHeader"))
    .toBe("true");
});

test("can wipe the board data", async ({ page }) => {
  // Create some board data
  await page.getByTestId("add-column-button").click();
  await page.getByTestId("add-column-button").click();
  const col0 = page.getByTestId("column-0");
  await expect(col0).toBeVisible();
  await col0.getByTestId("add-card-button-0").click();

  // Theme and density keys are already set by ThemeProvider on load

  // Open settings and clear
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();
  await dlg.getByRole("button", { name: /data/i }).click();
  await dlg.getByRole("button", { name: /clear all data/i }).click();

  // Board should be empty
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(0);

  // IndexedDB settings should be cleared
  await expect.poll(() => idbKvGet(page, "kanbeasy:theme")).toBeNull();
  await expect.poll(() => idbKvGet(page, "kanbeasy:cardDensity")).toBeNull();
});
