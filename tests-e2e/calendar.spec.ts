import { test, expect } from "@playwright/test";

const now = Date.now();

function makeCard(
  id: string,
  number: number,
  columnId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    number,
    title: `Card ${number}`,
    description: "",
    ticketTypeId: null,
    dueDate: null,
    createdAt: now,
    updatedAt: now,
    columnHistory: [{ columnId, enteredAt: now }],
    ...overrides,
  };
}

// Use a fixed date in the current month so tests don't break across months
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function seedBoard() {
  return JSON.stringify({
    columns: [
      {
        id: "col-0",
        title: "To Do",
        createdAt: now,
        updatedAt: now,
        cards: [
          makeCard("c1", 1, "col-0", {
            title: "Due Today",
            dueDate: todayStr(),
          }),
          makeCard("c2", 2, "col-0", {
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
          makeCard("c3", 3, "col-1", {
            title: "Also Due Today",
            dueDate: todayStr(),
          }),
        ],
      },
    ],
  });
}

test.describe("Calendar view", () => {
  test.beforeEach(async ({ page }) => {
    const board = seedBoard();
    await page.addInitScript((b: string) => {
      localStorage.setItem("kanbeasy:board", b);
      localStorage.setItem("kanbeasy:nextCardNumber", "4");
    }, board);
    const target = process.env.CI === "true" ? "/kanbeasy" : "/";
    await page.goto(target);
    await page.getByTestId("get-started-button").click();

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
    const viewMode = await page.evaluate(() =>
      localStorage.getItem("kanbeasy:viewMode"),
    );
    expect(viewMode).toBe("calendar");
  });
});

test("calendar view toggle is disabled when board has no cards", async ({
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

  await expect(
    page.getByRole("radio", { name: /calendar view/i }),
  ).toBeDisabled();
});

test("shows empty state when no cards have due dates", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "kanbeasy:board",
      JSON.stringify({
        columns: [
          {
            id: "col-0",
            title: "To Do",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cards: [
              {
                id: "c1",
                number: 1,
                title: "No date",
                description: "",
                ticketTypeId: null,
                dueDate: null,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                columnHistory: [{ columnId: "col-0", enteredAt: Date.now() }],
              },
            ],
          },
        ],
      }),
    );
    localStorage.setItem("kanbeasy:viewMode", "calendar");
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);
  await page.getByTestId("get-started-button").click();

  await expect(page.getByText(/no cards with due dates/i)).toBeVisible();
});
