import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

// Tooltips use aria-hidden so they don't double-announce for screen readers.
// Use CSS selector instead of getByRole to locate them.
const tooltip = (page: Page, text: string) =>
  page.locator(`[role="tooltip"]`, { hasText: text });

test("undo button shows tooltip with keyboard shortcut on hover", async ({
  page,
}) => {
  const undoBtn = page.getByRole("button", { name: "Undo" });

  await undoBtn.hover({ force: true });
  await expect(tooltip(page, "Undo")).toBeVisible();
  await expect(tooltip(page, "Undo")).toContainText("⌘Z");
});

test("redo button shows tooltip with keyboard shortcut on hover", async ({
  page,
}) => {
  const redoBtn = page.getByRole("button", { name: "Redo" });

  await redoBtn.hover({ force: true });
  await expect(tooltip(page, "Redo")).toBeVisible();
  await expect(tooltip(page, "Redo")).toContainText("⌘⇧Z");
});

test("card control buttons show tooltips on hover", async ({ page }) => {
  // Add a column and a card
  await page.getByTestId("add-column-button").click();
  await page.getByTestId("add-card-button-0").click();

  // Hover the card to reveal controls
  await page.getByTestId("card-0").hover();

  // Hover the copy button
  await page.getByTestId("card-copy-0").hover({ force: true });
  await expect(tooltip(page, "Copy card")).toBeVisible();
});

test("column delete button shows tooltip on hover", async ({ page }) => {
  // Add a column
  await page.getByTestId("add-column-button").click();

  // Hover the column to reveal controls
  await page.getByTestId("column-0").hover();

  // Hover the delete button
  await page.getByTestId("delete-column-button-0").hover({ force: true });
  await expect(tooltip(page, "Remove column")).toBeVisible();
});
