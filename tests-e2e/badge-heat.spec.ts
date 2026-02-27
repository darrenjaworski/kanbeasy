import { test, expect } from "@playwright/test";

function makeCard(id: string, columnId: string) {
  const now = Date.now();
  return {
    id,
    title: `Card ${id}`,
    description: "",
    createdAt: now,
    updatedAt: now,
    columnHistory: [{ columnId, enteredAt: now }],
  };
}

function seedBoard(
  columns: { id: string; title: string; cardCount: number }[],
) {
  const now = Date.now();
  return {
    columns: columns.map((col) => ({
      id: col.id,
      title: col.title,
      createdAt: now,
      updatedAt: now,
      cards: Array.from({ length: col.cardCount }, (_, i) =>
        makeCard(`${col.id}-card-${i}`, col.id),
      ),
    })),
  };
}

test.describe("Badge heat indicator", () => {
  test.beforeEach(async ({ page }) => {
    const target = process.env.CI === "true" ? "/kanbeasy" : "/";
    // Seed a 3-column board so the middle column (index 1) is eligible for heat
    await page.addInitScript(
      (board: string) => {
        localStorage.setItem("kanbeasy:board", board);
      },
      JSON.stringify(
        seedBoard([
          { id: "col-0", title: "To Do", cardCount: 0 },
          { id: "col-1", title: "In Progress", cardCount: 0 },
          { id: "col-2", title: "Done", cardCount: 0 },
        ]),
      ),
    );
    await page.goto(target);
    await page.getByTestId("get-started-button").click();
  });

  test("no heat on first column even with many cards", async ({ page }) => {
    const column = page.getByTestId("column-0");
    // Add 5 cards to the first column
    for (let i = 0; i < 5; i++) {
      await column.getByTestId("add-card-button-0").click();
    }

    const badge = column.getByLabel(/5 cards/i);
    await expect(badge).toBeVisible();
    // First column should never get heat styling
    const style = await badge.getAttribute("style");
    expect(style).toBeNull();
  });

  test("no heat on last column even with many cards", async ({ page }) => {
    const column = page.getByTestId("column-2");
    // Add 5 cards to the last column
    for (let i = 0; i < 5; i++) {
      await column.getByTestId("add-card-button-2").click();
    }

    const badge = column.getByLabel(/5 cards/i);
    await expect(badge).toBeVisible();
    // Last column should never get heat styling
    const style = await badge.getAttribute("style");
    expect(style).toBeNull();
  });

  test("no heat on middle column with 2 or fewer cards", async ({ page }) => {
    const column = page.getByTestId("column-1");
    // Add 2 cards to the middle column
    await column.getByTestId("add-card-button-1").click();
    await column.getByTestId("add-card-button-1").click();

    const badge = column.getByLabel(/2 cards/i);
    await expect(badge).toBeVisible();
    // 2 cards should not trigger heat
    const style = await badge.getAttribute("style");
    expect(style).toBeNull();
  });

  test("heat appears on middle column with 3+ cards", async ({ page }) => {
    const column = page.getByTestId("column-1");
    // Add 3 cards to the middle column
    for (let i = 0; i < 3; i++) {
      await column.getByTestId("add-card-button-1").click();
    }

    const badge = column.getByLabel(/3 cards/i);
    await expect(badge).toBeVisible();
    // Badge should have inline background-color with color-mix
    const style = await badge.getAttribute("style");
    expect(style).toContain("background-color");
    expect(style).toContain("color-mix");
  });

  test("heat intensifies and badge is bold at 10+ cards", async ({ page }) => {
    const column = page.getByTestId("column-1");
    // Add 10 cards to the middle column
    for (let i = 0; i < 10; i++) {
      await column.getByTestId("add-card-button-1").click();
    }

    const badge = column.getByLabel(/10 cards/i);
    await expect(badge).toBeVisible();
    // Badge should have heat styling
    const style = await badge.getAttribute("style");
    expect(style).toContain("background-color");
    expect(style).toContain("color-mix");
    // Badge text should be bold
    await expect(badge).toHaveClass(/font-bold/);
  });
});
