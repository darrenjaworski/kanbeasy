import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);
  await page.getByTestId("get-started-button").click();

  // Create a column and a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Open card detail modal
  const card = column.getByTestId("card-0");
  await card.hover();
  await column.getByTestId("card-detail-0").click();
  await expect(page.getByTestId("card-detail-title")).toBeVisible();
});

test("add checklist item button is visible on empty card", async ({ page }) => {
  await expect(page.getByTestId("checklist-add-item-button")).toBeVisible();
  await expect(page.getByTestId("checklist-add-item-button")).toHaveText(
    "+ Add checklist item",
  );
});

test("clicking add button shows input", async ({ page }) => {
  await page.getByTestId("checklist-add-item-button").click();
  await expect(page.getByTestId("checklist-add-item-input")).toBeVisible();
  await expect(page.getByTestId("checklist-add-item-input")).toBeFocused();
});

test("add checklist item via Enter", async ({ page }) => {
  await page.getByTestId("checklist-add-item-button").click();
  const input = page.getByTestId("checklist-add-item-input");
  await input.fill("Buy milk");
  await input.press("Enter");

  // Item should appear as a checkbox in preview
  const preview = page.getByTestId("card-detail-description-preview");
  await expect(preview).toBeVisible();
  await expect(preview.locator('input[type="checkbox"]')).toHaveCount(1);
  await expect(preview).toContainText("Buy milk");

  // Input should be cleared and still visible for more items
  await expect(input).toHaveValue("");
});

test("add multiple checklist items in sequence", async ({ page }) => {
  await page.getByTestId("checklist-add-item-button").click();
  const input = page.getByTestId("checklist-add-item-input");

  await input.fill("First item");
  await input.press("Enter");
  await input.fill("Second item");
  await input.press("Enter");
  await input.fill("Third item");
  await input.press("Enter");

  const preview = page.getByTestId("card-detail-description-preview");
  await expect(preview.locator('input[type="checkbox"]')).toHaveCount(3);
  await expect(preview).toContainText("First item");
  await expect(preview).toContainText("Second item");
  await expect(preview).toContainText("Third item");
});

test("toggle checkbox on and off", async ({ page }) => {
  // Add a checklist item first
  await page.getByTestId("checklist-add-item-button").click();
  const input = page.getByTestId("checklist-add-item-input");
  await input.fill("Toggle me");
  await input.press("Enter");

  const preview = page.getByTestId("card-detail-description-preview");

  // Should start unchecked
  await expect(preview.locator('input[type="checkbox"]')).not.toBeChecked();

  // Check it via evaluate (React re-renders the checkbox from dangerouslySetInnerHTML)
  await preview
    .locator('input[type="checkbox"]')
    .dispatchEvent("click", { bubbles: true });
  await expect(preview.locator('input[type="checkbox"]')).toBeChecked();

  // Uncheck it
  await preview
    .locator('input[type="checkbox"]')
    .dispatchEvent("click", { bubbles: true });
  await expect(preview.locator('input[type="checkbox"]')).not.toBeChecked();
});

test("checkbox toggle does not enter edit mode", async ({ page }) => {
  // Add a checklist item
  await page.getByTestId("checklist-add-item-button").click();
  const input = page.getByTestId("checklist-add-item-input");
  await input.fill("Stay in preview");
  await input.press("Enter");

  // Click away from the input to dismiss it, then click checkbox
  await page.getByTestId("card-detail-title").click();

  const preview = page.getByTestId("card-detail-description-preview");
  const checkbox = preview.locator('input[type="checkbox"]');

  await checkbox.dispatchEvent("click", { bubbles: true });

  // Should still be in preview mode
  await expect(preview).toBeVisible();
  await expect(
    page.locator('[data-testid="card-detail-description"]'),
  ).not.toBeVisible();
});

test("checklist persists after closing and reopening modal", async ({
  page,
}) => {
  // Add checklist items
  await page.getByTestId("checklist-add-item-button").click();
  const input = page.getByTestId("checklist-add-item-input");
  await input.fill("Persistent item");
  await input.press("Enter");

  // Toggle it checked
  const preview = page.getByTestId("card-detail-description-preview");
  await preview
    .locator('input[type="checkbox"]')
    .dispatchEvent("click", { bubbles: true });
  await expect(preview.locator('input[type="checkbox"]')).toBeChecked();

  // Close modal
  await page.getByRole("button", { name: /close #\d+ card details/i }).click();

  // Reopen modal
  const column = page.getByTestId("column-0");
  const card = column.getByTestId("card-0");
  await card.hover();
  await column.getByTestId("card-detail-0").click();

  // Checkbox should still be checked
  const reopenedPreview = page.getByTestId("card-detail-description-preview");
  await expect(reopenedPreview).toContainText("Persistent item");
  await expect(reopenedPreview.locator('input[type="checkbox"]')).toBeChecked();
});

test("clicking description text enters edit mode with raw markdown", async ({
  page,
}) => {
  // Add a checklist item
  await page.getByTestId("checklist-add-item-button").click();
  const input = page.getByTestId("checklist-add-item-input");
  await input.fill("Edit me");
  await input.press("Enter");

  // Click away to dismiss the add-item input
  await page.getByTestId("card-detail-title").click();

  // Click the preview area (not the checkbox) to enter edit mode
  const preview = page.getByTestId("card-detail-description-preview");
  // Click on the text, not the checkbox
  await preview.locator("li").first().locator("text=Edit me").click();

  const textarea = page.getByTestId("card-detail-description");
  await expect(textarea).toBeVisible();
  await expect(textarea).toHaveValue("- [ ] Edit me");
});

test("Escape dismisses add item input without adding", async ({ page }) => {
  await page.getByTestId("checklist-add-item-button").click();
  const input = page.getByTestId("checklist-add-item-input");
  await input.fill("Should not be added");
  await input.press("Escape");

  // Input should be gone, button should be back
  await expect(input).not.toBeVisible();
  await expect(page.getByTestId("checklist-add-item-button")).toBeVisible();

  // No description should have been created
  await expect(
    page.getByTestId("card-detail-description-placeholder"),
  ).toBeVisible();
});
