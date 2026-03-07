import { test, expect, type Page } from "@playwright/test";
import { makeE2eCard } from "./fixtures";

// Use a fixed timestamp so card metadata is deterministic across runs
const FIXED_NOW = new Date("2025-06-15T12:00:00Z").getTime();

function boardWithCards() {
  return JSON.stringify({
    columns: [
      {
        id: "col-0",
        title: "Backlog",
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
        cards: [
          makeE2eCard("c1", "col-0", {
            number: 1,
            title: "Research new auth library",
            ticketTypeId: "feat",
            ticketTypeLabel: "Feature",
            ticketTypeColor: "#22c55e",
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
            columnHistory: [{ columnId: "col-0", enteredAt: FIXED_NOW }],
          }),
          makeE2eCard("c2", "col-0", {
            number: 2,
            title: "Update dependencies",
            ticketTypeId: "chore",
            ticketTypeLabel: "Chore",
            ticketTypeColor: "#8b5cf6",
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
            columnHistory: [{ columnId: "col-0", enteredAt: FIXED_NOW }],
          }),
        ],
      },
      {
        id: "col-1",
        title: "In Progress",
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
        cards: [
          makeE2eCard("c3", "col-1", {
            number: 3,
            title: "Fix login redirect bug",
            description:
              "- [x] Reproduce the issue\n- [x] Identify root cause\n- [ ] Write fix\n- [ ] Add regression test",
            ticketTypeId: "fix",
            ticketTypeLabel: "Fix",
            ticketTypeColor: "#ef4444",
            dueDate: "2025-06-16",
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
            columnHistory: [{ columnId: "col-1", enteredAt: FIXED_NOW }],
          }),
          makeE2eCard("c4", "col-1", {
            number: 4,
            title: "Add user profile page",
            ticketTypeId: "feat",
            ticketTypeLabel: "Feature",
            ticketTypeColor: "#22c55e",
            dueDate: "2025-06-20",
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
            columnHistory: [{ columnId: "col-1", enteredAt: FIXED_NOW }],
          }),
        ],
      },
      {
        id: "col-2",
        title: "Done",
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
        cards: [
          makeE2eCard("c5", "col-2", {
            number: 5,
            title: "Set up CI pipeline",
            ticketTypeId: "chore",
            ticketTypeLabel: "Chore",
            ticketTypeColor: "#8b5cf6",
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
            columnHistory: [{ columnId: "col-2", enteredAt: FIXED_NOW }],
          }),
        ],
      },
    ],
    archive: [
      {
        ...makeE2eCard("c6", "col-0", {
          number: 6,
          title: "Old prototype spike",
          createdAt: FIXED_NOW,
          updatedAt: FIXED_NOW,
          columnHistory: [{ columnId: "col-0", enteredAt: FIXED_NOW }],
        }),
        archivedAt: FIXED_NOW,
        archivedFromColumnId: "col-0",
      },
    ],
  });
}

const DEVELOPMENT_TYPES = JSON.stringify([
  { id: "feat", label: "Feature", color: "#22c55e" },
  { id: "fix", label: "Fix", color: "#ef4444" },
  { id: "refactor", label: "Refactor", color: "#6366f1" },
  { id: "chore", label: "Chore", color: "#8b5cf6" },
  { id: "test", label: "Test", color: "#f59e0b" },
  { id: "docs", label: "Docs", color: "#06b6d4" },
]);

async function seedAndNavigate(page: Page) {
  const board = boardWithCards();
  await page.addInitScript(
    ({ b, types }: { b: string; types: string }) => {
      localStorage.setItem("kanbeasy:board", b);
      localStorage.setItem("kanbeasy:nextCardNumber", "7");
      localStorage.setItem("kanbeasy:ticketTypePreset", "development");
      localStorage.setItem("kanbeasy:ticketTypes", types);
      localStorage.setItem("hasSeenWelcome", "true");
    },
    { b: board, types: DEVELOPMENT_TYPES },
  );
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);
  // Wait for the board to render
  await expect(page.getByTestId("column-0")).toBeVisible();
}

// Mask selectors for elements with dynamic text (timestamps, dates)
const TIMESTAMP_MASKS = [
  '[data-testid="card-detail-metadata"]', // Created/Updated timestamps
];

// Run snapshots only in Chromium for consistency
test.describe("Visual regression", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "Snapshots are Chromium-only",
  );

  test.use({ viewport: { width: 1280, height: 800 } });

  test("board view — default light theme", async ({ page }) => {
    await seedAndNavigate(page);
    await expect(page).toHaveScreenshot("board-light.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("board view — dark theme", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("kanbeasy:theme", "midnight");
      localStorage.setItem("kanbeasy:themePreference", "dark");
    });
    await seedAndNavigate(page);
    await expect(page).toHaveScreenshot("board-dark.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("welcome modal", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
    });
    const target = process.env.CI === "true" ? "/kanbeasy" : "/";
    await page.goto(target);
    await expect(page.getByTestId("get-started-button")).toBeVisible();
    await expect(page).toHaveScreenshot("welcome-modal.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("card detail modal", async ({ page }) => {
    await seedAndNavigate(page);

    // Open detail for card with description checklist + due date
    const column = page.getByTestId("column-1");
    const card = column.getByTestId("card-0");
    await card.hover();
    await column.getByTestId("card-detail-0").click();
    await expect(page.getByTestId("card-detail-title")).toBeVisible();

    await expect(page).toHaveScreenshot("card-detail-modal.png", {
      maxDiffPixelRatio: 0.01,
      mask: TIMESTAMP_MASKS.map((s) => page.locator(s)),
    });
  });

  test("settings modal", async ({ page }) => {
    await seedAndNavigate(page);
    await page.getByRole("button", { name: /open settings/i }).click();
    const dlg = page.getByRole("dialog", { name: /settings/i });
    await expect(dlg).toBeVisible();

    await expect(page).toHaveScreenshot("settings-modal.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("analytics modal", async ({ page }) => {
    await seedAndNavigate(page);
    await page.getByRole("button", { name: /open analytics/i }).click();
    const dlg = page.getByRole("dialog", { name: /analytics/i });
    await expect(dlg).toBeVisible();

    await expect(page).toHaveScreenshot("analytics-modal.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("archive modal", async ({ page }) => {
    await seedAndNavigate(page);
    await page.getByRole("button", { name: /open archive/i }).click();
    const dlg = page.getByRole("dialog", { name: /archive/i });
    await expect(dlg).toBeVisible();

    await expect(page).toHaveScreenshot("archive-modal.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("list view", async ({ page }) => {
    await seedAndNavigate(page);
    await page.getByRole("radio", { name: /list view/i }).click();
    await expect(page.locator("tbody tr")).toHaveCount(5);

    await expect(page).toHaveScreenshot("list-view.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("calendar view", async ({ page }) => {
    // Fix the clock to June 2025 so the calendar shows the month matching seeded due dates
    await page.clock.setFixedTime(new Date("2025-06-15T12:00:00Z"));
    await seedAndNavigate(page);
    await page.getByRole("radio", { name: /calendar view/i }).click();
    await expect(page.getByTestId("calendar-grid")).toBeVisible();

    await expect(page).toHaveScreenshot("calendar-view.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("empty board", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "kanbeasy:board",
        JSON.stringify({ columns: [] }),
      );
      localStorage.setItem("hasSeenWelcome", "true");
    });
    const target = process.env.CI === "true" ? "/kanbeasy" : "/";
    await page.goto(target);
    await expect(page.getByTestId("add-column-button")).toBeVisible();

    await expect(page).toHaveScreenshot("empty-board.png", {
      maxDiffPixelRatio: 0.01,
    });
  });
});
