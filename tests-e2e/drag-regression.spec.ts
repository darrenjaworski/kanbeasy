/**
 * Regression tests for the drag sensor bug introduced in v1.45.0 and fixed in v1.49.1.
 *
 * Bug: PointerSensor with { delay: 200, tolerance: 5 } was used for all input types.
 * On desktop, natural mouse movement during the 200ms delay exceeds the 5px tolerance,
 * silently cancelling the drag. The first drag in a session often worked because users
 * clicked deliberately and held still, but all subsequent drags appeared broken.
 *
 * Fix: Split into MouseSensor { distance: 5 } (desktop) and TouchSensor { delay: 200,
 * tolerance: 5 } (touch). MouseSensor activates immediately once the pointer moves 5px —
 * no delay, no tolerance race.
 *
 * These tests deliberately perform two or more consecutive drags without any artificial
 * delay between them, which is the exact scenario the bug prevented.
 */
import { test, expect } from "./fixtures";

/**
 * Perform a mouse drag from one bounding box centre to another.
 * Uses a 6px initial jitter to exceed MouseSensor's activation distance of 5px.
 * No waitForTimeout is needed — MouseSensor has no delay.
 */
async function dragFromTo(
  page: import("@playwright/test").Page,
  from: { x: number; y: number; width: number; height: number },
  to: { x: number; y: number; width: number; height: number },
) {
  const sx = from.x + from.width / 2;
  const sy = from.y + from.height / 2;
  const tx = to.x + to.width / 2;
  const ty = to.y + to.height / 2;

  await page.mouse.move(sx, sy);
  await page.mouse.down();
  // Move 6px to exceed MouseSensor's activation distance (5px) — no delay needed
  await page.mouse.move(sx + 6, sy);
  await page.mouse.move(tx, ty, { steps: 10 });
  await page.mouse.up();
}

test("two consecutive card reorders both succeed", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");

  // Add three cards
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  await column.getByTestId("card-content-0").fill("A");
  await column.getByTestId("card-content-0").press("Enter");
  await column.getByTestId("card-content-1").fill("B");
  await column.getByTestId("card-content-1").press("Enter");
  await column.getByTestId("card-content-2").fill("C");
  await column.getByTestId("card-content-2").press("Enter");

  // --- First drag: A → C's position (A moves to the end) ---
  await column.getByTestId("card-0").hover();
  const drag0 = column.getByTestId("card-drag-0");
  await expect(drag0).toBeVisible();
  const h0 = await drag0.boundingBox();
  const tC = await column.getByTestId("card-2").boundingBox();
  if (!h0 || !tC) throw new Error("bounding boxes unavailable for first drag");
  await dragFromTo(page, h0, tC);

  // First drag result: B, C, A
  await expect(column.getByTestId("card-content-0")).toHaveValue("B");
  await expect(column.getByTestId("card-content-1")).toHaveValue("C");
  await expect(column.getByTestId("card-content-2")).toHaveValue("A");

  // --- Second drag (immediately after, no extra wait): B → A's position ---
  await column.getByTestId("card-0").hover();
  const drag0b = column.getByTestId("card-drag-0");
  await expect(drag0b).toBeVisible();
  const h0b = await drag0b.boundingBox();
  const tA = await column.getByTestId("card-2").boundingBox();
  if (!h0b || !tA)
    throw new Error("bounding boxes unavailable for second drag");
  await dragFromTo(page, h0b, tA);

  // Second drag result: C, A, B
  await expect(column.getByTestId("card-content-0")).toHaveValue("C");
  await expect(column.getByTestId("card-content-2")).toHaveValue("B");
});

test("two consecutive column reorders both succeed", async ({ page }) => {
  // Create three columns
  await page.getByTestId("add-column-button").click();
  await page.getByTestId("add-column-button").click();
  await page.getByTestId("add-column-button").click();

  const col0 = page.getByTestId("column-0");
  const col1 = page.getByTestId("column-1");
  const col2 = page.getByTestId("column-2");

  // Label them X, Y, Z
  await col0.getByTestId("column-title-input-0").fill("X");
  await col0.getByTestId("column-title-input-0").press("Enter");
  await col1.getByTestId("column-title-input-1").fill("Y");
  await col1.getByTestId("column-title-input-1").press("Enter");
  await col2.getByTestId("column-title-input-2").fill("Z");
  await col2.getByTestId("column-title-input-2").press("Enter");

  // --- First drag: move X column (col-0) to col-2's position ---
  await col0.hover();
  const dragHandle0 = col0.getByTestId("drag-column-button-0");
  await expect(dragHandle0).toBeVisible();
  const hBox0 = await dragHandle0.boundingBox();
  const tBox2 = await col2.boundingBox();
  if (!hBox0 || !tBox2)
    throw new Error("bounding boxes unavailable for first column drag");
  await dragFromTo(page, hBox0, tBox2);

  // First drag result: Y is now col-0, X should have moved right
  await expect(page.getByTestId("column-title-input-0")).toHaveValue("Y");

  // --- Second drag (immediately after): move the new col-0 (Y) to the right ---
  const newCol0 = page.getByTestId("column-0");
  const newCol2 = page.getByTestId("column-2");
  await newCol0.hover();
  const dragHandle0b = newCol0.getByTestId("drag-column-button-0");
  await expect(dragHandle0b).toBeVisible();
  const hBox0b = await dragHandle0b.boundingBox();
  const tBox2b = await newCol2.boundingBox();
  if (!hBox0b || !tBox2b)
    throw new Error("bounding boxes unavailable for second column drag");
  await dragFromTo(page, hBox0b, tBox2b);

  // Second drag must have actually moved a column — the current col-0 should not be "Y"
  const currentFirst = await page
    .getByTestId("column-title-input-0")
    .inputValue();
  expect(currentFirst).not.toBe("Y");
});
