import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI == "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("search input is visible and can receive text", async ({ page }) => {
  const searchInput = page.getByTestId("search-input");
  await expect(searchInput).toBeVisible();

  await searchInput.fill("test query");
  await expect(searchInput).toHaveValue("test query");
});

test("shows match count when cards match the search", async ({ page }) => {
  // Create a column with two cards
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  // Give cards distinct titles
  const card0 = column.getByTestId("card-content-0");
  await card0.click();
  await card0.fill("Buy groceries");
  await card0.press("Enter");

  const card1 = column.getByTestId("card-content-1");
  await card1.click();
  await card1.fill("Walk the dog");
  await card1.press("Enter");

  // Search for "groceries" - should match 1 card
  const searchInput = page.getByTestId("search-input");
  await searchInput.fill("groceries");
  await expect(page.getByText("1 match")).toBeVisible();
});

test("highlights matching cards with blue border", async ({ page }) => {
  // Create a column with two cards
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  const card0 = column.getByTestId("card-content-0");
  await card0.click();
  await card0.fill("Important task");
  await card0.press("Enter");

  const card1 = column.getByTestId("card-content-1");
  await card1.click();
  await card1.fill("Other work");
  await card1.press("Enter");

  // Search for "important"
  await page.getByTestId("search-input").fill("important");
  await expect(page.getByText("1 match")).toBeVisible();

  // The matching card should have the blue ring highlight
  const matchingCard = column.getByTestId("card-0");
  await expect(matchingCard).toHaveClass(/ring-2/);

  // The non-matching card should not have the blue ring
  const otherCard = column.getByTestId("card-1");
  await expect(otherCard).not.toHaveClass(/ring-2/);
});

test("does not show match count for short queries", async ({ page }) => {
  // Create a column with a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  const card = column.getByTestId("card-content-0");
  await card.click();
  await card.fill("Test card");
  await card.press("Enter");

  // Type only 1 character - should not trigger search
  const searchInput = page.getByTestId("search-input");
  await searchInput.fill("T");
  await expect(page.getByText(/\d+ match/)).not.toBeVisible();
});

test("clears results when search is emptied", async ({ page }) => {
  // Create a column with a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  const card = column.getByTestId("card-content-0");
  await card.click();
  await card.fill("Searchable card");
  await card.press("Enter");

  const searchInput = page.getByTestId("search-input");
  await searchInput.fill("searchable");
  await expect(page.getByText("1 match")).toBeVisible();

  // Clear the search
  await searchInput.fill("");
  await expect(page.getByText(/\d+ match/)).not.toBeVisible();

  // Card should no longer be highlighted
  const cardEl = column.getByTestId("card-0");
  await expect(cardEl).not.toHaveClass(/ring-2/);
});
