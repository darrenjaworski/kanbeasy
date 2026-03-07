import { test, expect } from "./fixtures";

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

test("has a setting to adjust the size of the cards", async ({ page }) => {
  // Prepare a column with a couple of cards
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await expect(column).toBeVisible();
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  // Open settings and verify default selection (Compact/small)
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();
  await dlg.getByRole("button", { name: /appearance/i }).click();
  const compactBtn = dlg.getByRole("button", { name: /compact/i });
  await expect(compactBtn).toHaveAttribute("aria-pressed", "true");
  await dlg.getByRole("button", { name: /close settings/i }).click();

  // rows should be 1 for small (compact)
  await expect(column.getByTestId("card-content-0")).toHaveAttribute(
    "rows",
    "1",
  );

  // Set Comfortable (rows = 2) — Appearance section stays open from above
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg2 = page.getByRole("dialog", { name: /settings/i });
  await dlg2.getByRole("button", { name: /comfortable/i }).click();
  await dlg2.getByRole("button", { name: /close settings/i }).click();
  await expect(column.getByTestId("card-content-0")).toHaveAttribute(
    "rows",
    "2",
  );

  // Set Spacious (rows = 3) — Appearance section stays open
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg3 = page.getByRole("dialog", { name: /settings/i });
  await dlg3.getByRole("button", { name: /spacious/i }).click();
  await dlg3.getByRole("button", { name: /close settings/i }).click();
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

  // Setting is persisted to localStorage
  const stored = await page.evaluate(() =>
    localStorage.getItem("kanbeasy:compactHeader"),
  );
  expect(stored).toBe("true");
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
    localStorage.setItem("kanbeasy:theme", "dark-slate");
    localStorage.setItem("kanbeasy:cardDensity", "large");
  });

  // Open settings and clear
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();
  await dlg.getByRole("button", { name: /data/i }).click();
  await dlg.getByRole("button", { name: /clear all data/i }).click();

  // Board should be empty
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(0);

  // LocalStorage keys should be cleared
  const themeStored = await page.evaluate(() =>
    localStorage.getItem("kanbeasy:theme"),
  );
  const densityStored = await page.evaluate(() =>
    localStorage.getItem("kanbeasy:cardDensity"),
  );
  expect(themeStored).toBeNull();
  expect(densityStored).toBeNull();
});
