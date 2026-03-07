import { test, expect } from "./fixtures";

test("analytics button is disabled when there are no cards", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: /open analytics/i }),
  ).toBeDisabled();
});

test("analytics button is enabled when a card exists", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  await expect(
    page.getByRole("button", { name: /open analytics/i }),
  ).toBeEnabled();
});

test("archive button is disabled when no cards are archived", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: /open archive/i }),
  ).toBeDisabled();
});

test("search input is disabled when there are no cards", async ({ page }) => {
  const searchInput = page.getByTestId("search-input");
  await expect(searchInput).toBeDisabled();
});

test("search input is enabled when a card exists", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  await expect(page.getByTestId("search-input")).toBeEnabled();
});

test("list view toggle is disabled when there are no cards", async ({
  page,
}) => {
  // Need at least one column for the view toggle to appear, but no cards
  await page.getByTestId("add-column-button").click();
  await expect(page.getByRole("radio", { name: /list view/i })).toBeDisabled();
});

test("list view toggle is enabled when cards exist", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  await expect(page.getByRole("radio", { name: /list view/i })).toBeEnabled();
});
