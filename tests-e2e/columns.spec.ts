import { test, expect } from "@playwright/test";

// Basic smoke test to verify the app loads and the settings modal toggles

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
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
    "test header",
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

test("reorder columns by dragging", async ({ page }) => {
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

  // Reveal the drag handle (controls are hidden until column is hovered)
  await firstColumn.hover();
  const dragHandleFirst = firstColumn.getByTestId("drag-column-button-0");
  await dragHandleFirst.scrollIntoViewIfNeeded();
  await expect(dragHandleFirst).toBeVisible();

  // Perform a mouse-based drag sequence compatible with dnd-kit
  const handleBox = await dragHandleFirst.boundingBox();
  const targetBox = await secondColumn.boundingBox();
  if (!handleBox || !targetBox)
    throw new Error("Could not get bounding boxes for drag");

  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // small jitter to initiate drag
  await page.mouse.move(startX + 10, startY + 10);
  // move to the center of the second column
  await page.mouse.move(targetX, targetY, { steps: 12 });
  await page.mouse.up();

  // Verify the columns have been reordered
  await expect(page.getByTestId("column-title-input-1")).toHaveValue(
    "test header",
  );
});
