import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("undo and redo buttons are visible", async ({ page }) => {
  const undoBtn = page.getByRole("button", { name: "Undo" });
  const redoBtn = page.getByRole("button", { name: "Redo" });

  await expect(undoBtn).toBeVisible();
  await expect(redoBtn).toBeVisible();

  // Both should be disabled on a clean board with no actions
  await expect(undoBtn).toBeDisabled();
  await expect(redoBtn).toBeDisabled();
});

test("can undo adding a column via button", async ({ page }) => {
  const undoBtn = page.getByRole("button", { name: "Undo" });

  // Add a column
  await page.getByTestId("add-column-button").click();
  await expect(page.getByTestId("column-0")).toBeVisible();

  // Undo should now be enabled
  await expect(undoBtn).toBeEnabled();

  // Click undo — column should disappear
  await undoBtn.click();
  await expect(page.getByTestId("column-0")).not.toBeVisible();
});

test("can redo after undoing via button", async ({ page }) => {
  const undoBtn = page.getByRole("button", { name: "Undo" });
  const redoBtn = page.getByRole("button", { name: "Redo" });

  // Add a column, then undo
  await page.getByTestId("add-column-button").click();
  await expect(page.getByTestId("column-0")).toBeVisible();

  await undoBtn.click();
  await expect(page.getByTestId("column-0")).not.toBeVisible();

  // Redo should now be enabled
  await expect(redoBtn).toBeEnabled();

  // Click redo — column should reappear
  await redoBtn.click();
  await expect(page.getByTestId("column-0")).toBeVisible();
});

test("can undo adding a card", async ({ page }) => {
  const undoBtn = page.getByRole("button", { name: "Undo" });

  // Add a column and a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await expect(column.getByTestId("card-0")).toBeVisible();

  // Undo — card should disappear
  await undoBtn.click();
  await expect(column.getByTestId("card-0")).not.toBeVisible();
});

test("can undo deleting a card", async ({ page }) => {
  const undoBtn = page.getByRole("button", { name: "Undo" });

  // Add a column and a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await expect(column.getByTestId("card-0")).toBeVisible();

  // Delete the card
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-remove-0").click();
  await expect(column.getByTestId("card-0")).not.toBeVisible();

  // Undo — card should reappear
  await undoBtn.click();
  await expect(column.getByTestId("card-0")).toBeVisible();
});

test("keyboard shortcut Ctrl/Cmd+Z triggers undo", async ({ page }) => {
  // Add a column
  await page.getByTestId("add-column-button").click();
  await expect(page.getByTestId("column-0")).toBeVisible();

  // Use keyboard shortcut to undo
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${modifier}+z`);
  await expect(page.getByTestId("column-0")).not.toBeVisible();
});

test("keyboard shortcut Ctrl/Cmd+Shift+Z triggers redo", async ({ page }) => {
  // Add a column, then undo
  await page.getByTestId("add-column-button").click();
  await expect(page.getByTestId("column-0")).toBeVisible();

  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${modifier}+z`);
  await expect(page.getByTestId("column-0")).not.toBeVisible();

  // Redo via keyboard
  await page.keyboard.press(`${modifier}+Shift+z`);
  await expect(page.getByTestId("column-0")).toBeVisible();
});
