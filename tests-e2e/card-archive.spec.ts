import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("archive card via controls, verify removed from board", async ({
  page,
}) => {
  // Add a column and a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await expect(column.getByTestId("card-0")).toBeVisible();

  // Archive the card
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-archive-0").click();

  // Card should be removed from the board
  await expect(column.locator('[data-testid^="card-content-"]')).toHaveCount(0);
});

test("open archive modal and verify archived card is listed", async ({
  page,
}) => {
  // Add a column and a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await expect(column.getByTestId("card-0")).toBeVisible();

  // Archive the card
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-archive-0").click();

  // Open archive modal
  await page.getByTestId("archive-button").click();

  // Verify card is listed in archive table
  await expect(page.getByTestId("archive-list")).toBeVisible();
  await expect(page.getByTestId("archive-card-row")).toHaveCount(1);
});

test("restore card from archive via bulk action", async ({ page }) => {
  // Add a column and a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Archive the card
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-archive-0").click();
  await expect(column.locator('[data-testid^="card-content-"]')).toHaveCount(0);

  // Open archive modal, select the card, and restore
  await page.getByTestId("archive-button").click();
  await page.getByTestId("archive-select-all").check();
  await page.getByTestId("archive-bulk-restore").click();

  // Archive should show empty state (modal is still open)
  await expect(page.getByTestId("archive-empty")).toBeVisible();

  // Close archive modal
  await page.getByRole("button", { name: /close archive/i }).click();

  // Card should reappear on the board
  await expect(column.getByTestId("card-0")).toBeVisible();
});

test("permanently delete card from archive via bulk action", async ({
  page,
}) => {
  // Add a column and a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Archive the card
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-archive-0").click();

  // Open archive modal, select the card, and delete
  await page.getByTestId("archive-button").click();
  await page.getByTestId("archive-select-all").check();
  await page.getByTestId("archive-bulk-delete").click();

  // Confirm deletion
  await page.getByTestId("confirm-delete-button").click();

  // Archive should be empty
  await expect(page.getByTestId("archive-empty")).toBeVisible();
});

test("select-all checkbox selects and deselects all cards", async ({
  page,
}) => {
  // Add a column and two cards
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  // Archive both cards
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-archive-0").click();
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-archive-0").click();

  // Open archive modal
  await page.getByTestId("archive-button").click();
  await expect(page.getByTestId("archive-card-row")).toHaveCount(2);

  // Select all
  await page.getByTestId("archive-select-all").check();

  // Bulk restore button should show count
  await expect(page.getByTestId("archive-bulk-restore")).toContainText("(2)");

  // Deselect all
  await page.getByTestId("archive-select-all").uncheck();

  // Bulk buttons should not show count
  await expect(page.getByTestId("archive-bulk-restore")).toHaveText("Restore");
});

test("undo archive restores card to board", async ({ page }) => {
  // Add a column and a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Archive the card
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-archive-0").click();
  await expect(column.locator('[data-testid^="card-content-"]')).toHaveCount(0);

  // Undo with keyboard shortcut
  await page.keyboard.press("Meta+z");

  // Card should reappear
  await expect(column.getByTestId("card-0")).toBeVisible();
});
