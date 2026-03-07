import { test, expect } from "@playwright/test";
import { makeE2eCard } from "./fixtures";

const now = Date.now();

function seedBoard() {
  return JSON.stringify({
    columns: [
      {
        id: "col-0",
        title: "To Do",
        createdAt: now,
        updatedAt: now,
        cards: [
          makeE2eCard("c1", "col-0", {
            number: 1,
            title: "Card 1",
            ticketTypeId: "feat",
            dueDate: "2025-06-15",
          }),
          makeE2eCard("c2", "col-0", {
            number: 2,
            title: "Card 2",
            ticketTypeId: "fix",
          }),
        ],
      },
      {
        id: "col-1",
        title: "Done",
        createdAt: now,
        updatedAt: now,
        cards: [makeE2eCard("c3", "col-1", { number: 3, title: "Card 3" })],
      },
    ],
  });
}

test.describe("List view", () => {
  test.beforeEach(async ({ page }) => {
    const board = seedBoard();
    await page.addInitScript((b: string) => {
      localStorage.setItem("kanbeasy:board", b);
      localStorage.setItem("kanbeasy:nextCardNumber", "4");
    }, board);
    const target = process.env.CI === "true" ? "/kanbeasy" : "/";
    await page.goto(target);
    await page.getByTestId("get-started-button").click();

    // Switch to list view
    await page.getByRole("radio", { name: /list view/i }).click();
  });

  test("displays all expected column headers", async ({ page }) => {
    const headers = page.locator("thead th");
    await expect(headers).toHaveCount(6);
    await expect(headers.nth(0)).toHaveText("#");
    await expect(headers.nth(1)).toHaveText("Type");
    await expect(headers.nth(2)).toHaveText("Title");
    await expect(headers.nth(3)).toHaveText("Due Date");
    await expect(headers.nth(4)).toHaveText("Column");
    await expect(headers.nth(5)).toHaveText("Created");
  });

  test("shows all cards from all columns", async ({ page }) => {
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(3);
  });

  test("displays ticket type label for typed cards", async ({ page }) => {
    const rows = page.locator("tbody tr");

    // First card has ticketTypeId "feat" → label "Feature"
    const firstRowType = rows.nth(0).getByTestId("list-cell-type");
    await expect(firstRowType).toHaveText("Feature");

    // Second card has ticketTypeId "fix" → label "Fix"
    const secondRowType = rows.nth(1).getByTestId("list-cell-type");
    await expect(secondRowType).toHaveText("Fix");
  });

  test("displays em dash for cards without a type", async ({ page }) => {
    const rows = page.locator("tbody tr");

    // Third card has no ticket type
    const thirdRowType = rows.nth(2).getByTestId("list-cell-type");
    await expect(thirdRowType).toHaveText("\u2014");
  });

  test("displays card title and column name", async ({ page }) => {
    const rows = page.locator("tbody tr");

    // First row: title and column
    const firstRowTitle = rows.nth(0).getByTestId("list-cell-title");
    await expect(firstRowTitle).toHaveText("Card 1");

    const firstRowColumn = rows.nth(0).getByTestId("list-cell-column");
    await expect(firstRowColumn).toHaveText("To Do");

    // Third row is in "Done" column
    const thirdRowColumn = rows.nth(2).getByTestId("list-cell-column");
    await expect(thirdRowColumn).toHaveText("Done");
  });

  test("opens card detail modal when clicking a row", async ({ page }) => {
    const rows = page.locator("tbody tr");
    await rows.nth(0).click();

    // Card detail modal should open with the due date field
    await expect(page.getByTestId("card-detail-due-date")).toBeVisible();
  });

  test("displays due date when present", async ({ page }) => {
    const rows = page.locator("tbody tr");

    // First card has due date
    const firstRowDue = rows.nth(0).getByTestId("list-cell-due-date");
    await expect(firstRowDue).toContainText("Jun");

    // Second card has no due date — shows em dash
    const secondRowDue = rows.nth(1).getByTestId("list-cell-due-date");
    await expect(secondRowDue).toHaveText("\u2014");
  });
});

test("list view toggle is disabled when board has no cards", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "kanbeasy:board",
      JSON.stringify({
        columns: [
          {
            id: "col-0",
            title: "Empty",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cards: [],
          },
        ],
      }),
    );
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);
  await page.getByTestId("get-started-button").click();

  await expect(page.getByRole("radio", { name: /list view/i })).toBeDisabled();
});
