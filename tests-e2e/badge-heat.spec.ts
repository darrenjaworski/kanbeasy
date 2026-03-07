import { test, expect } from "@playwright/test";
import { seedBoard } from "./fixtures";

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
    await expect(badge).not.toHaveAttribute("data-heat-level");
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
    await expect(badge).not.toHaveAttribute("data-heat-level");
  });

  test("no heat on middle column with 2 or fewer cards", async ({ page }) => {
    const column = page.getByTestId("column-1");
    // Add 2 cards to the middle column
    await column.getByTestId("add-card-button-1").click();
    await column.getByTestId("add-card-button-1").click();

    const badge = column.getByLabel(/2 cards/i);
    await expect(badge).toBeVisible();
    // 2 cards should not trigger heat
    await expect(badge).not.toHaveAttribute("data-heat-level");
  });

  test("heat appears on middle column with 3+ cards", async ({ page }) => {
    const column = page.getByTestId("column-1");
    // Add 3 cards to the middle column
    for (let i = 0; i < 3; i++) {
      await column.getByTestId("add-card-button-1").click();
    }

    const badge = column.getByLabel(/3 cards/i);
    await expect(badge).toBeVisible();
    // Badge should have heat styling
    await expect(badge).toHaveAttribute("data-heat-level", "medium");
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
    await expect(badge).toHaveAttribute("data-heat-level", "high");
  });
});
