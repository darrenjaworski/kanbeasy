import { test, expect, makeE2eCard, idbKvGet } from "./fixtures";

const now = Date.now();

// Use a fixed date in the current month so tests don't break across months
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function seedBoard() {
  return {
    columns: [
      {
        id: "col-0",
        title: "To Do",
        createdAt: now,
        updatedAt: now,
        cards: [
          makeE2eCard("c1", "col-0", {
            number: 1,
            title: "Due Today",
            dueDate: todayStr(),
          }),
          makeE2eCard("c2", "col-0", {
            number: 2,
            title: "No Due Date",
            dueDate: null,
          }),
        ],
      },
      {
        id: "col-1",
        title: "Done",
        createdAt: now,
        updatedAt: now,
        cards: [
          makeE2eCard("c3", "col-1", {
            number: 3,
            title: "Also Due Today",
            dueDate: todayStr(),
          }),
        ],
      },
    ],
  };
}

test.describe("Calendar view", () => {
  test.use({ seed: { board: seedBoard(), nextCardNumber: 4 } });

  test.beforeEach(async ({ page }) => {
    // Switch to calendar view
    await page.getByRole("radio", { name: /calendar view/i }).click();
  });

  test("displays calendar grid with day headers", async ({ page }) => {
    await expect(page.getByTestId("calendar-grid")).toBeVisible();
    for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
      await expect(page.getByText(day)).toBeVisible();
    }
  });

  test("shows cards with due dates on the calendar", async ({ page }) => {
    const grid = page.getByTestId("calendar-grid");
    await expect(grid.getByText("Due Today", { exact: true })).toBeVisible();
    await expect(grid.getByText("Also Due Today")).toBeVisible();
  });

  test("opens card detail modal when clicking a card", async ({ page }) => {
    const grid = page.getByTestId("calendar-grid");
    await grid.getByText("Due Today", { exact: true }).click();

    await expect(page.getByTestId("card-detail-due-date")).toBeVisible();
  });

  test("does not show cards without due dates on the calendar", async ({
    page,
  }) => {
    const grid = page.getByTestId("calendar-grid");
    await expect(grid.getByText("No Due Date")).not.toBeVisible();
  });

  test("navigates to next and previous month", async ({ page }) => {
    const monthHeading = page.locator("h2");
    const initialMonth = await monthHeading.textContent();

    await page.getByLabel("Next month").click();
    const nextMonth = await monthHeading.textContent();
    expect(nextMonth).not.toBe(initialMonth);

    await page.getByLabel("Previous month").click();
    const backMonth = await monthHeading.textContent();
    expect(backMonth).toBe(initialMonth);
  });

  test("Today button returns to current month", async ({ page }) => {
    const monthHeading = page.locator("h2");
    const initialMonth = await monthHeading.textContent();

    // Navigate away
    await page.getByLabel("Next month").click();
    await page.getByLabel("Next month").click();

    // Click Today
    await page.getByText("Today").click();
    await expect(monthHeading).toHaveText(initialMonth!);
  });

  test("persists calendar view preference", async ({ page }) => {
    await expect
      .poll(() => idbKvGet(page, "kanbeasy:viewMode"))
      .toBe("calendar");
  });
});

test.describe("Calendar view — empty board", () => {
  test.use({
    seed: {
      board: {
        columns: [
          {
            id: "col-0",
            title: "Empty",
            createdAt: now,
            updatedAt: now,
            cards: [],
          },
        ],
      },
    },
  });

  test("calendar view toggle is disabled when board has no cards", async ({
    page,
  }) => {
    await expect(
      page.getByRole("radio", { name: /calendar view/i }),
    ).toBeDisabled();
  });
});

test.describe("Calendar view — no due dates", () => {
  test.use({
    seed: {
      viewMode: "calendar",
      board: {
        columns: [
          {
            id: "col-0",
            title: "To Do",
            createdAt: now,
            updatedAt: now,
            cards: [
              makeE2eCard("c1", "col-0", {
                number: 1,
                title: "No date",
                dueDate: null,
              }),
            ],
          },
        ],
      },
    },
  });

  test("shows empty state when no cards have due dates", async ({ page }) => {
    await expect(page.getByText(/no cards with due dates/i)).toBeVisible();
  });
});
