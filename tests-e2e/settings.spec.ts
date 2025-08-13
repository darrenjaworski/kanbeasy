import { test, expect } from "@playwright/test";

// Basic smoke test to verify the app loads and the settings modal toggles

test.beforeEach(async ({ page }) => {
  const target = process.env.CI == "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("can toggle theme", async ({ page }) => {
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();

  const initialDark = await page.evaluate(() =>
    document.documentElement.classList.contains("dark")
  );
  const switchEl = dlg.getByRole("switch", { name: /dark mode/i });
  await switchEl.focus();
  await page.keyboard.press("Space");

  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.classList.contains("dark"))
    )
    .toBe(!initialDark);

  await dlg.getByRole("button", { name: /close settings/i }).click();
});

test("has a setting to adjust the size of the cards", async ({ page }) => {
  // Prepare a column with a couple of cards
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await expect(column).toBeVisible();
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  // Open settings and verify default selection (Comfortable/medium)
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();
  const comfortableBtn = dlg.getByRole("button", { name: /comfortable/i });
  await expect(comfortableBtn).toHaveAttribute("aria-pressed", "true");
  await dlg.getByRole("button", { name: /close settings/i }).click();

  // rows should be 2 for medium
  await expect(column.getByTestId("card-content-0")).toHaveAttribute(
    "rows",
    "2"
  );

  // Set Compact (rows = 1)
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg2 = page.getByRole("dialog", { name: /settings/i });
  await dlg2.getByRole("button", { name: /compact/i }).click();
  await dlg2.getByRole("button", { name: /close settings/i }).click();
  await expect(column.getByTestId("card-content-0")).toHaveAttribute(
    "rows",
    "1"
  );

  // Set Spacious (rows = 3)
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg3 = page.getByRole("dialog", { name: /settings/i });
  await dlg3.getByRole("button", { name: /spacious/i }).click();
  await dlg3.getByRole("button", { name: /close settings/i }).click();
  await expect(column.getByTestId("card-content-0")).toHaveAttribute(
    "rows",
    "3"
  );
});

test("can wipe the board data", async ({ page }) => {
  // Create some board data
  await page.getByTestId("add-column-button").click();
  await page.getByTestId("add-column-button").click();
  const col0 = page.getByTestId("column-0");
  await expect(col0).toBeVisible();
  await col0.getByTestId("add-card-button-0").click();

  // Seed some theme/density keys to ensure they are cleared
  await page.evaluate(() => {
    localStorage.setItem("kanbeasy:theme", "dark");
    localStorage.setItem("kanbeasy:cardDensity", "large");
  });

  // Open settings and clear
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();
  await dlg.getByRole("button", { name: /clear board data/i }).click();

  // Board should be empty
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(0);

  // LocalStorage keys should be cleared
  const themeStored = await page.evaluate(() =>
    localStorage.getItem("kanbeasy:theme")
  );
  const densityStored = await page.evaluate(() =>
    localStorage.getItem("kanbeasy:cardDensity")
  );
  expect(themeStored).toBeNull();
  expect(densityStored).toBeNull();
});
