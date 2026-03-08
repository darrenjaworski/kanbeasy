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
            cardTypeId: "feat",
            cardTypeLabel: "Feature",
            cardTypeColor: "#22c55e",
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
            columnHistory: [{ columnId: "col-0", enteredAt: FIXED_NOW }],
          }),
          makeE2eCard("c2", "col-0", {
            number: 2,
            title: "Update dependencies",
            cardTypeId: "chore",
            cardTypeLabel: "Chore",
            cardTypeColor: "#8b5cf6",
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
            cardTypeId: "fix",
            cardTypeLabel: "Fix",
            cardTypeColor: "#ef4444",
            dueDate: "2025-06-16",
            createdAt: FIXED_NOW,
            updatedAt: FIXED_NOW,
            columnHistory: [{ columnId: "col-1", enteredAt: FIXED_NOW }],
          }),
          makeE2eCard("c4", "col-1", {
            number: 4,
            title: "Add user profile page",
            cardTypeId: "feat",
            cardTypeLabel: "Feature",
            cardTypeColor: "#22c55e",
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
            cardTypeId: "chore",
            cardTypeLabel: "Chore",
            cardTypeColor: "#8b5cf6",
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

const DIFF_PIXEL_RATIO = 0.0005;

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
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
    });
  });

  // ── Theme variants ────────────────────────────────────
  // Light themes
  test("board view — stone theme", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("kanbeasy:theme", "light-stone");
      localStorage.setItem("kanbeasy:themePreference", "light");
    });
    await seedAndNavigate(page);
    await expect(page).toHaveScreenshot("board-stone.png", {
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
    });
  });

  test("board view — rose theme", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("kanbeasy:theme", "light-rose");
      localStorage.setItem("kanbeasy:themePreference", "light");
    });
    await seedAndNavigate(page);
    await expect(page).toHaveScreenshot("board-rose.png", {
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
    });
  });

  // Dark themes
  test("board view — midnight theme", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("kanbeasy:theme", "dark-slate");
      localStorage.setItem("kanbeasy:themePreference", "dark");
    });
    await seedAndNavigate(page);
    await expect(page).toHaveScreenshot("board-midnight.png", {
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
    });
  });

  test("board view — forest theme", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("kanbeasy:theme", "dark-emerald");
      localStorage.setItem("kanbeasy:themePreference", "dark");
    });
    await seedAndNavigate(page);
    await expect(page).toHaveScreenshot("board-forest.png", {
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
    });
  });

  test("board view — twilight theme", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("kanbeasy:theme", "dark-purple");
      localStorage.setItem("kanbeasy:themePreference", "dark");
    });
    await seedAndNavigate(page);
    await expect(page).toHaveScreenshot("board-twilight.png", {
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
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
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
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
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
      mask: TIMESTAMP_MASKS.map((s) => page.locator(s)),
    });
  });

  test("settings modal", async ({ page }) => {
    await seedAndNavigate(page);
    await page.getByRole("button", { name: /open settings/i }).click();
    const dlg = page.getByRole("dialog", { name: /settings/i });
    await expect(dlg).toBeVisible();

    await expect(page).toHaveScreenshot("settings-modal.png", {
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
    });
  });

  test("analytics modal", async ({ page }) => {
    await seedAndNavigate(page);
    await page.getByRole("button", { name: /open analytics/i }).click();
    const dlg = page.getByRole("dialog", { name: /analytics/i });
    await expect(dlg).toBeVisible();

    await expect(page).toHaveScreenshot("analytics-modal.png", {
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
    });
  });

  test("archive modal", async ({ page }) => {
    await seedAndNavigate(page);
    await page.getByRole("button", { name: /open archive/i }).click();
    const dlg = page.getByRole("dialog", { name: /archive/i });
    await expect(dlg).toBeVisible();

    await expect(page).toHaveScreenshot("archive-modal.png", {
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
    });
  });

  test("list view", async ({ page }) => {
    await seedAndNavigate(page);
    await page.getByRole("radio", { name: /list view/i }).click();
    await expect(page.locator("tbody tr")).toHaveCount(5);

    await expect(page).toHaveScreenshot("list-view.png", {
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
    });
  });

  test("calendar view", async ({ page }) => {
    await seedAndNavigate(page);
    await page.getByRole("radio", { name: /calendar view/i }).click();
    await expect(page.getByTestId("calendar-grid")).toBeVisible();

    // Navigate the calendar to June 2025 to show seeded due dates (c3: June 16, c4: June 20).
    // Click prev/next month until we reach the target month.
    const targetLabel = "June 2025";
    const monthHeader = page.getByRole("heading", { level: 2 });
    const prevBtn = page.getByRole("button", { name: "Previous month" });
    const nextBtn = page.getByRole("button", { name: "Next month" });
    for (let i = 0; i < 24; i++) {
      const label = await monthHeader.textContent();
      if (label?.trim() === targetLabel) break;
      // Determine direction: if current date is after June 2025, go back
      if (label && label.includes("2026")) await prevBtn.click();
      else if (label && label.includes("2025")) {
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        const currentMonth = monthNames.findIndex((m) => label.includes(m));
        if (currentMonth > 5) await prevBtn.click();
        else await nextBtn.click();
      } else await prevBtn.click();
    }
    await expect(monthHeader).toHaveText(targetLabel);

    await expect(page).toHaveScreenshot("calendar-view.png", {
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
    });
  });

  test("empty board", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
      localStorage.setItem("hasSeenWelcome", "true");
    });
    const target = process.env.CI === "true" ? "/kanbeasy" : "/";
    await page.goto(target);
    await expect(page.getByTestId("add-column-button")).toBeVisible();

    await expect(page).toHaveScreenshot("empty-board.png", {
      maxDiffPixelRatio: DIFF_PIXEL_RATIO,
    });
  });
});
