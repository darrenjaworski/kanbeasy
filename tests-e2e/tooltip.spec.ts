import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("undo button shows tooltip with keyboard shortcut on hover", async ({
  page,
}) => {
  const undoBtn = page.getByRole("button", { name: "Undo" });
  const tooltip = page.getByRole("tooltip", { name: /Undo/ });

  await undoBtn.hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("⌘Z");
});

test("redo button shows tooltip with keyboard shortcut on hover", async ({
  page,
}) => {
  const redoBtn = page.getByRole("button", { name: "Redo" });
  const tooltip = page.getByRole("tooltip", { name: /Redo/ });

  await redoBtn.hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("⌘⇧Z");
});

test("card control buttons show tooltips on hover", async ({ page }) => {
  // Add a column and a card
  await page.getByTestId("add-column-button").click();
  await page.getByTestId("add-card-button-0").click();

  // Hover the card to reveal controls
  await page.getByTestId("card-0").hover();

  // Hover the copy button
  await page.getByTestId("card-copy-0").hover();
  await expect(page.getByRole("tooltip", { name: "Copy card" })).toBeVisible();
});

test("column delete button shows tooltip on hover", async ({ page }) => {
  // Add a column
  await page.getByTestId("add-column-button").click();

  // Hover the column to reveal controls
  await page.getByTestId("column-0").hover();

  // Hover the delete button
  await page.getByTestId("delete-column-button-0").hover();
  await expect(
    page.getByRole("tooltip", { name: "Remove column" }),
  ).toBeVisible();
});

test("tooltip disappears when mouse leaves", async ({ page }) => {
  const undoBtn = page.getByRole("button", { name: "Undo" });
  const tooltip = page.getByRole("tooltip", { name: /Undo/ });

  // Hover to show tooltip
  await undoBtn.hover();
  await expect(tooltip).toBeVisible();

  // Move mouse away
  await page.mouse.move(0, 0);
  await expect(tooltip).not.toBeVisible();
});
