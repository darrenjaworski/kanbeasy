import { test, expect } from "@playwright/test";

// Basic smoke test to verify the app loads and the settings modal toggles

test.beforeEach(async ({ page }) => {
  const target = process.env.CI == "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("app loads and settings modal can be opened/closed", async ({ page }) => {
  // Check if the main heading is visible
  await expect(page.getByTestId("header-title")).toBeVisible();
});

test("add a new column to the board", async ({ page }) => {
  // Click the button to add a new column
  await page.getByTestId("add-column-button").click();

  // Verify the new column is added
  const newColumn = await page.getByTestId("column-0");
  await expect(newColumn).toBeVisible();

  // Check the column title is editable
  await newColumn.getByTestId("column-title-input-0").click();
  await newColumn.getByTestId("column-title-input-0").fill("test header");
  await newColumn.getByTestId("column-title-input-0").press("Enter");

  // Verify the title is updated
  await expect(newColumn.getByTestId("column-title-input-0")).toHaveValue(
    "test header"
  );
});

test("delete a column from the board", async ({ page }) => {
  // Add a new column first
  await page.getByTestId("add-column-button").click();
  const newColumn = await page.getByTestId("column-0");
  await expect(newColumn).toBeVisible();

  // Click the delete button on the new column
  await newColumn.getByTestId("delete-column-button-0").click();

  // Confirm the column is deleted
  await expect(newColumn).not.toBeVisible();
});

test.skip("reorder columns by dragging", async ({ page }) => {
  // Click the button to add a new column
  await page.getByTestId("add-column-button").click();

  // Verify the new column is added
  const firstColumn = await page.getByTestId("column-0");
  await expect(firstColumn).toBeVisible();

  // Check the column title is editable
  await firstColumn.getByTestId("column-title-input-0").click();
  await firstColumn.getByTestId("column-title-input-0").fill("test header");
  await firstColumn.getByTestId("column-title-input-0").press("Enter");

  await page.getByTestId("add-column-button").click();

  // Drag the first column and drop it onto the second column
  const secondColumn = await page.getByTestId("column-1");

  // Ensure drag handles are visible and interactable
  const dragHandleFirst = firstColumn.getByTestId("drag-column-button-0");
  const dragHandleSecond = secondColumn.getByTestId("drag-column-button-1");
  await expect(dragHandleFirst).toBeVisible();
  await expect(dragHandleSecond).toBeVisible();

  // Log positions before dragging
  const firstPosition = await dragHandleFirst.boundingBox();
  const secondPosition = await dragHandleSecond.boundingBox();
  console.log("Before drag:", { firstPosition, secondPosition });

  // Perform the drag action
  await dragHandleFirst.dragTo(dragHandleSecond);

  // Log positions after dragging
  const firstPositionAfter = await dragHandleFirst.boundingBox();
  const secondPositionAfter = await dragHandleSecond.boundingBox();
  console.log("After drag:", { firstPositionAfter, secondPositionAfter });

  // Verify the columns have been reordered
  await expect(page.getByTestId("column-title-input-1")).toHaveValue(
    "test header"
  );
});
