import { test, expect } from "@playwright/test";

// Basic smoke test to verify the app loads and the settings modal toggles

test.beforeEach(async ({ page }) => {
  const target = process.env.CI == "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("add a card to a column", async ({ page }) => {
  // Add a column
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await expect(column).toBeVisible();

  // Add a card to the column
  await column.getByTestId("add-card-button-0").click();

  // Verify the card appears and has default content
  await expect(column.getByTestId("card-0")).toBeVisible();
  await expect(column.getByTestId("card-content-0")).toHaveValue("New card");
});

test("can reorder cards within a column", async ({ page }) => {
  // Add a column and three cards
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await expect(column).toBeVisible();

  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  // Set identifiable content for each card
  await column.getByTestId("card-content-0").click();
  await column.getByTestId("card-content-0").fill("A");
  await column.getByTestId("card-content-0").press("Enter");

  await column.getByTestId("card-content-1").click();
  await column.getByTestId("card-content-1").fill("B");
  await column.getByTestId("card-content-1").press("Enter");

  await column.getByTestId("card-content-2").click();
  await column.getByTestId("card-content-2").fill("C");
  await column.getByTestId("card-content-2").press("Enter");

  // Reveal the drag handle of the first card and drag it to the position of the third card
  const firstCard = column.getByTestId("card-0");
  await firstCard.hover();
  const dragHandle = column.getByTestId("card-drag-0");
  await dragHandle.scrollIntoViewIfNeeded();
  await expect(dragHandle).toBeVisible();

  const handleBox = await dragHandle.boundingBox();
  const targetCard = column.getByTestId("card-2");
  const targetBox = await targetCard.boundingBox();
  if (!handleBox || !targetBox)
    throw new Error("Could not get bounding boxes for card drag");

  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // small jitter to initiate drag (dnd-kit activation distance)
  await page.mouse.move(startX + 10, startY + 10);
  await page.mouse.move(targetX, targetY, { steps: 10 });
  await page.mouse.up();

  // After reordering, the values should be B, C, A
  await expect(column.getByTestId("card-content-0")).toHaveValue("B");
  await expect(column.getByTestId("card-content-1")).toHaveValue("C");
  await expect(column.getByTestId("card-content-2")).toHaveValue("A");
});

test("can update the card content", async ({ page }) => {
  // Add a column and one card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Update card content and commit with Enter
  const content = column.getByTestId("card-content-0");
  await content.click();
  await content.fill("Updated title");
  await content.press("Enter");

  await expect(column.getByTestId("card-content-0")).toHaveValue(
    "Updated title"
  );
});

test("can delete a card from a column", async ({ page }) => {
  // Add a column and two cards
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  // Reveal controls for the first card and click remove
  const firstCard = column.getByTestId("card-0");
  await firstCard.hover();
  const removeBtn = column.getByTestId("card-remove-0");
  await removeBtn.click();

  // Verify only one card remains in the column (count textareas by testid)
  await expect(column.locator('[data-testid^="card-content-"]')).toHaveCount(1);
  // Also verify the remaining card's index has collapsed to 0
  await expect(column.getByTestId("card-0")).toBeVisible();
});
