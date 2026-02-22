import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI == "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("column shows card count badge", async ({ page }) => {
  // Create a column with two cards
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  // The badge should show "2"
  const badge = column.getByLabel(/2 cards/i);
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText("2");
});

test("badge updates when cards are added", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");

  // Initially 0 cards - badge should show "0"
  const badge = column.getByLabel(/0 cards/i);
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText("0");

  // Add a card
  await column.getByTestId("add-card-button-0").click();
  const updatedBadge = column.getByLabel(/1 card$/i);
  await expect(updatedBadge).toBeVisible();
  await expect(updatedBadge).toHaveText("1");
});

test("badge updates when a card is removed", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  // Should show 2
  await expect(column.getByLabel(/2 cards/i)).toHaveText("2");

  // Remove one card
  const card = column.getByTestId("card-0");
  await card.hover();
  await column.getByTestId("card-remove-0").click();

  // Should now show 1
  await expect(column.getByLabel(/1 card$/i)).toHaveText("1");
});
