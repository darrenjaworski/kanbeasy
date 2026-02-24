import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("open card detail modal via detail button", async ({ page }) => {
  // Set up a column with a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Hover card to reveal controls, then click detail button
  const card = column.getByTestId("card-0");
  await card.hover();
  await column.getByTestId("card-detail-0").click();

  // Modal should be visible with title and description fields
  await expect(page.getByTestId("card-detail-title")).toBeVisible();
  await expect(page.getByTestId("card-detail-description")).toBeVisible();
  await expect(page.getByTestId("card-detail-column")).toBeVisible();
  await expect(page.getByTestId("card-detail-metadata")).toBeVisible();
});

test("edit title in modal updates card on board", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Open modal
  const card = column.getByTestId("card-0");
  await card.hover();
  await column.getByTestId("card-detail-0").click();

  // Edit title in modal
  const titleField = page.getByTestId("card-detail-title");
  await titleField.click();
  await titleField.fill("Updated from modal");
  // Blur to save by clicking elsewhere in modal
  await page.getByTestId("card-detail-description").click();

  // Close modal
  await page.getByRole("button", { name: /close card details/i }).click();

  // Board card should reflect updated title
  await expect(column.getByTestId("card-content-0")).toHaveValue(
    "Updated from modal",
  );
});

test("edit description in modal persists across reopen", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Open modal and add description
  const card = column.getByTestId("card-0");
  await card.hover();
  await column.getByTestId("card-detail-0").click();

  const descField = page.getByTestId("card-detail-description");
  await descField.click();
  await descField.fill("My description");
  // Blur to save
  await page.getByTestId("card-detail-title").click();

  // Close modal
  await page.getByRole("button", { name: /close card details/i }).click();

  // Reopen modal and verify description persisted
  await card.hover();
  await column.getByTestId("card-detail-0").click();
  await expect(page.getByTestId("card-detail-description")).toHaveValue(
    "My description",
  );
});

test("move card via column selector keeps modal open", async ({ page }) => {
  // Create two columns
  await page.getByTestId("add-column-button").click();
  await page.getByTestId("add-column-button").click();

  const leftColumn = page.getByTestId("column-0");
  const rightColumn = page.getByTestId("column-1");

  // Add a card to the first column
  await leftColumn.getByTestId("add-card-button-0").click();

  // Give it a recognizable title
  const content = leftColumn.getByTestId("card-content-0");
  await content.click();
  await content.fill("Moving card");
  await content.press("Enter");

  // Open modal
  const card = leftColumn.getByTestId("card-0");
  await card.hover();
  await leftColumn.getByTestId("card-detail-0").click();

  // Get the column selector and change to the second column
  const columnSelect = page.getByTestId("card-detail-column");
  const rightColId = await page
    .getByTestId("column-1")
    .getAttribute("data-column-id");

  await columnSelect.selectOption(rightColId!);

  // Modal should still be open
  await expect(page.getByTestId("card-detail-title")).toBeVisible();
  await expect(page.getByTestId("card-detail-description")).toBeVisible();

  // Column selector should now show the right column
  await expect(columnSelect).toHaveValue(rightColId!);

  // Close modal
  await page.getByRole("button", { name: /close card details/i }).click();

  // Card should now be in the right column
  await expect(
    leftColumn.locator('[data-testid^="card-content-"]'),
  ).toHaveCount(0);
  await expect(rightColumn.getByTestId("card-content-0")).toHaveValue(
    "Moving card",
  );
});

test("close modal with Escape key", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Open modal
  const card = column.getByTestId("card-0");
  await card.hover();
  await column.getByTestId("card-detail-0").click();

  await expect(page.getByTestId("card-detail-title")).toBeVisible();

  // Press Escape to close
  await page.keyboard.press("Escape");

  // Modal should be closed
  await expect(page.getByTestId("card-detail-title")).not.toBeVisible();
});

test("close modal by clicking backdrop", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Open modal
  const card = column.getByTestId("card-0");
  await card.hover();
  await column.getByTestId("card-detail-0").click();

  await expect(page.getByTestId("card-detail-title")).toBeVisible();

  // Click the backdrop area outside the dialog (top-left corner of the viewport)
  await page.mouse.click(5, 5);

  // Modal should be closed
  await expect(page.getByTestId("card-detail-title")).not.toBeVisible();
});

test("card detail shows correct column in selector", async ({ page }) => {
  // Create two columns with different names
  await page.getByTestId("add-column-button").click();
  await page.getByTestId("add-column-button").click();

  const leftColumn = page.getByTestId("column-0");
  const rightColumn = page.getByTestId("column-1");

  // Name the columns
  const leftTitle = leftColumn.getByTestId("column-title-input-0");
  await leftTitle.click();
  await leftTitle.fill("To Do");
  await leftTitle.press("Enter");

  const rightTitle = rightColumn.getByTestId("column-title-input-1");
  await rightTitle.click();
  await rightTitle.fill("Done");
  await rightTitle.press("Enter");

  // Add card to the right column
  await rightColumn.getByTestId("add-card-button-1").click();

  // Open detail for the right column card
  const card = rightColumn.getByTestId("card-0");
  await card.hover();
  await rightColumn.getByTestId("card-detail-0").click();

  // The column selector should show the right column's id
  const columnSelect = page.getByTestId("card-detail-column");
  const rightColId = await page
    .getByTestId("column-1")
    .getAttribute("data-column-id");
  await expect(columnSelect).toHaveValue(rightColId!);
});
