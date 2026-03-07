import { test, expect } from "./fixtures";

test("new cards display ascending card numbers on board", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");

  // Add three cards
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  // Cards are prepended, so newest is at index 0
  // Card added first = #1, second = #2, third = #3
  // Index 0 = #3 (newest), index 1 = #2, index 2 = #1 (oldest)
  const card0 = column.getByTestId("card-0");
  const card1 = column.getByTestId("card-1");
  const card2 = column.getByTestId("card-2");

  await expect(card0).toContainText("#3");
  await expect(card1).toContainText("#2");
  await expect(card2).toContainText("#1");
});

test("card detail modal header shows #N Card Details", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Open card detail modal
  const card = column.getByTestId("card-0");
  await card.hover();
  await column.getByTestId("card-detail-0").click();

  // Modal header should contain "#1 Card Details"
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("#1 Card Details");
});

test("card numbers display in list view", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  // Switch to list view
  await page.getByRole("radio", { name: /list view/i }).click();

  // Table should have a "#" column header
  await expect(page.locator("th").first()).toHaveText("#");

  // Should show card numbers in the table rows
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(2);

  // Cards are shown in column order (newest first since prepended)
  const firstRowNumber = rows.nth(0).locator("td").first();
  const secondRowNumber = rows.nth(1).locator("td").first();
  await expect(firstRowNumber).toHaveText("#2");
  await expect(secondRowNumber).toHaveText("#1");
});

test("card numbers persist to localStorage", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  // Verify numbers on screen
  await expect(column.getByTestId("card-0")).toContainText("#2");
  await expect(column.getByTestId("card-1")).toContainText("#1");

  // Verify numbers are persisted in localStorage
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("kanbeasy:board") || "{}"),
  );
  const cards = stored.columns[0].cards;
  expect(cards[0].number).toBe(2);
  expect(cards[1].number).toBe(1);

  // Verify the counter is also persisted
  const counter = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("kanbeasy:nextCardNumber") || "0"),
  );
  expect(counter).toBe(3);
});

test("duplicated card gets a fresh number", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Card should be #1
  await expect(column.getByTestId("card-0")).toContainText("#1");

  // Copy and paste to duplicate
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-copy-0").click();
  await column.getByTestId("paste-card-button-0").click();

  // Two cards now — the duplicate (index 0) should have #2, original (index 1) keeps #1
  await expect(column.getByTestId("card-0")).toContainText("#2");
  await expect(column.getByTestId("card-1")).toContainText("#1");
});

test("counter increments past deleted cards (no number reuse)", async ({
  page,
}) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");

  // Add card #1
  await column.getByTestId("add-card-button-0").click();
  await expect(column.getByTestId("card-0")).toContainText("#1");

  // Archive it
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-archive-0").click();
  await expect(column.locator('[data-testid^="card-content-"]')).toHaveCount(0);

  // Counter should still be at 2, not reset to 1
  const counter = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("kanbeasy:nextCardNumber") || "0"),
  );
  expect(counter).toBe(2);

  // Add another card — should be #2, not #1 reused
  await column.getByTestId("add-card-button-0").click();
  await expect(column.getByTestId("card-0")).toContainText("#2");
});
