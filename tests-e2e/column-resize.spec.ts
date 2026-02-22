import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("settings toggle enables column resize and persists", async ({ page }) => {
  // create a column
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await expect(column).toBeVisible();

  // resize handle should not be present by default (feature-flag off)
  const handleLocator = page.locator('[data-testid="resize-handle-0"]');
  await expect(handleLocator).toHaveCount(0);

  // enable via settings
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();
  const switchEl = dlg.getByRole("switch", { name: /column resizing/i });
  await switchEl.focus();
  await page.keyboard.press("Space");
  await dlg.getByRole("button", { name: /close settings/i }).click();

  // handle should now be present
  await expect(page.locator('[data-testid="resize-handle-0"]')).toBeVisible();

  // localStorage should reflect the setting
  const stored = await page.evaluate(() =>
    localStorage.getItem("kanbeasy:columnResizingEnabled"),
  );
  expect(stored).toBe("true");
});

test("can resize a column with the mouse and clamps to min/max", async ({
  page,
}) => {
  // create a column and enable resizing
  await page.getByTestId("add-column-button").click();
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  const switch2 = dlg.getByRole("switch", { name: /column resizing/i });
  await switch2.focus();
  await page.keyboard.press("Space");
  await dlg.getByRole("button", { name: /close settings/i }).click();

  const column = page.getByTestId("column-0");
  await expect(column).toBeVisible();

  const handle = page.getByTestId("resize-handle-0");
  await expect(handle).toBeVisible();

  const initialBox = await column.boundingBox();
  const handleBox = await handle.boundingBox();
  if (!initialBox || !handleBox)
    throw new Error("Could not get bounding boxes");

  const startX = handleBox.x + handleBox.width / 2;
  const startY = handleBox.y + handleBox.height / 2;

  // Drag right to increase width
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 120, startY, { steps: 12 });
  await page.mouse.up();

  const afterIncrease = await column.boundingBox();
  if (!afterIncrease)
    throw new Error("Could not get bounding box after increase");
  expect(afterIncrease.width).toBeGreaterThan(initialBox.width + 30);

  // Drag left a lot to test min clamp (min expected 200)
  const handleBox2 = await handle.boundingBox();
  if (!handleBox2)
    throw new Error("Could not get handle bounding box for shrink");
  const startX2 = handleBox2.x + handleBox2.width / 2;
  const startY2 = handleBox2.y + handleBox2.height / 2;

  await page.mouse.move(startX2, startY2);
  await page.mouse.down();
  await page.mouse.move(startX2 - 1000, startY2, { steps: 20 });
  await page.mouse.up();

  const afterShrink = await column.boundingBox();
  if (!afterShrink) throw new Error("Could not get bounding box after shrink");
  expect(afterShrink.width).toBeGreaterThanOrEqual(200);

  // Drag right a lot to test max clamp (max expected 480)
  const handleBox3 = await handle.boundingBox();
  if (!handleBox3)
    throw new Error("Could not get handle bounding box for expand");
  const startX3 = handleBox3.x + handleBox3.width / 2;
  const startY3 = handleBox3.y + handleBox3.height / 2;

  await page.mouse.move(startX3, startY3);
  await page.mouse.down();
  await page.mouse.move(startX3 + 1000, startY3, { steps: 20 });
  await page.mouse.up();

  const afterExpand = await column.boundingBox();
  if (!afterExpand) throw new Error("Could not get bounding box after expand");
  expect(afterExpand.width).toBeLessThanOrEqual(480);
});
