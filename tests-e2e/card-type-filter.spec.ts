import { test as base, expect } from "@playwright/test";
import { makeE2eCard } from "./fixtures";

/**
 * Custom fixture that seeds a board with typed and untyped cards.
 * Cards: feat-1 "Auth feature", fix-2 "Auth bugfix", #3 "Untyped task"
 */
const test = base.extend<{ boardPage: never }>({
  boardPage: [
    async ({ page }, use) => {
      const colId = "col-1";
      const board = {
        columns: [
          {
            id: colId,
            title: "To Do",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cards: [
              makeE2eCard("c1", colId, {
                number: 1,
                title: "Auth feature",
                cardTypeId: "feat",
                cardTypeLabel: "Feature",
                cardTypeColor: "#22c55e",
              }),
              makeE2eCard("c2", colId, {
                number: 2,
                title: "Auth bugfix",
                cardTypeId: "fix",
                cardTypeLabel: "Fix",
                cardTypeColor: "#ef4444",
              }),
              makeE2eCard("c3", colId, {
                number: 3,
                title: "Untyped task",
              }),
            ],
          },
        ],
        archive: [],
      };
      await page.addInitScript((b) => {
        localStorage.setItem("kanbeasy:board", JSON.stringify(b));
      }, board);
      const target = process.env.CI === "true" ? "/kanbeasy" : "/";
      await page.goto(target);
      await page.getByTestId("get-started-button").click();
      await use(page as never);
    },
    { auto: true },
  ],
});

test("filter button appears and is enabled with cards", async ({ page }) => {
  const filterBtn = page.getByTestId("card-type-filter-button");
  await expect(filterBtn).toBeVisible();
  await expect(filterBtn).toBeEnabled();
});

test("filter dropdown opens and shows card types", async ({ page }) => {
  await page.getByTestId("card-type-filter-button").click();

  const popover = page.getByTestId("card-type-filter-popover");
  await expect(popover).toBeVisible();
  await expect(popover.getByText("Filter by type")).toBeVisible();
  await expect(
    popover.getByTestId("card-type-filter-option-feat"),
  ).toBeVisible();
  await expect(
    popover.getByTestId("card-type-filter-option-fix"),
  ).toBeVisible();
});

test("selecting a type highlights matching cards", async ({ page }) => {
  await page.getByTestId("card-type-filter-button").click();
  const popover = page.getByTestId("card-type-filter-popover");
  await popover.getByTestId("card-type-filter-option-feat").click();

  // feat card should be highlighted
  await expect(page.getByTestId("card-0")).toHaveAttribute(
    "data-search-highlight",
    "true",
  );

  // fix and untyped cards should not
  await expect(page.getByTestId("card-1")).not.toHaveAttribute(
    "data-search-highlight",
  );
  await expect(page.getByTestId("card-2")).not.toHaveAttribute(
    "data-search-highlight",
  );

  // Match count shown
  await expect(page.getByText("1 match")).toBeVisible();
});

test("multiple type selection uses OR logic", async ({ page }) => {
  await page.getByTestId("card-type-filter-button").click();
  const popover = page.getByTestId("card-type-filter-popover");
  await popover.getByTestId("card-type-filter-option-feat").click();
  await popover.getByTestId("card-type-filter-option-fix").click();

  // Both typed cards highlighted
  await expect(page.getByTestId("card-0")).toHaveAttribute(
    "data-search-highlight",
    "true",
  );
  await expect(page.getByTestId("card-1")).toHaveAttribute(
    "data-search-highlight",
    "true",
  );

  // Untyped card not highlighted
  await expect(page.getByTestId("card-2")).not.toHaveAttribute(
    "data-search-highlight",
  );

  await expect(page.getByText("2 matches")).toBeVisible();
});

test("clear button resets the filter", async ({ page }) => {
  await page.getByTestId("card-type-filter-button").click();
  const popover = page.getByTestId("card-type-filter-popover");
  await popover.getByTestId("card-type-filter-option-feat").click();

  await expect(page.getByTestId("card-0")).toHaveAttribute(
    "data-search-highlight",
    "true",
  );

  await popover.getByTestId("card-type-filter-clear").click();

  await expect(page.getByTestId("card-0")).not.toHaveAttribute(
    "data-search-highlight",
  );
});

test("filter closes on click outside", async ({ page }) => {
  await page.getByTestId("card-type-filter-button").click();
  await expect(page.getByTestId("card-type-filter-popover")).toBeVisible();

  // Click on the board area
  await page.locator("main").click();
  await expect(page.getByTestId("card-type-filter-popover")).not.toBeVisible();
});

test("combined text search and type filter uses AND logic", async ({
  page,
}) => {
  // Text search for "Auth" — both feat and fix cards match
  await page.getByTestId("search-input").fill("Auth");
  await expect(page.getByText("2 matches")).toBeVisible();

  // Now also filter by feat — only the feat card should match
  await page.getByTestId("card-type-filter-button").click();
  await page
    .getByTestId("card-type-filter-popover")
    .getByTestId("card-type-filter-option-feat")
    .click();

  await expect(page.getByText("1 match")).toBeVisible();

  // Only the feat card highlighted
  await expect(page.getByTestId("card-0")).toHaveAttribute(
    "data-search-highlight",
    "true",
  );
  await expect(page.getByTestId("card-1")).not.toHaveAttribute(
    "data-search-highlight",
  );
});
