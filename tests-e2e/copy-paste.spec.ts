import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("copy button is accessible on card hover", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Hover over the card to reveal controls
  await column.getByTestId("card-0").hover();
  const copyBtn = column.getByTestId("card-copy-0");
  await expect(copyBtn).toBeVisible();
  await expect(copyBtn).toHaveAttribute("aria-label", /copy card/i);
});

test("paste button appears after copying a card", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // No paste button initially
  await expect(column.getByTestId("paste-card-button-0")).not.toBeVisible();

  // Hover and copy
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-copy-0").click();

  // Paste button now visible
  await expect(column.getByTestId("paste-card-button-0")).toBeVisible();
});

test("paste duplicates a card in the same column", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Give the card a distinctive title
  const content = column.getByTestId("card-content-0");
  await content.click();
  await content.fill("Original card");
  await content.press("Enter");

  // Copy and paste
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-copy-0").click();
  await column.getByTestId("paste-card-button-0").click();

  // Two cards exist
  await expect(column.locator('[data-testid^="card-content-"]')).toHaveCount(2);

  // The pasted card has the same title
  await expect(column.getByTestId("card-content-1")).toHaveValue(
    "Original card",
  );
});

test("paste works across columns", async ({ page }) => {
  // Create two columns
  await page.getByTestId("add-column-button").click();
  await page.getByTestId("add-column-button").click();

  const col0 = page.getByTestId("column-0");
  const col1 = page.getByTestId("column-1");

  // Add card to first column with specific title
  await col0.getByTestId("add-card-button-0").click();
  const content = col0.getByTestId("card-content-0");
  await content.click();
  await content.fill("Cross-column card");
  await content.press("Enter");

  // Copy from first column
  await col0.getByTestId("card-0").hover();
  await col0.getByTestId("card-copy-0").click();

  // Paste into second column
  await col1.getByTestId("paste-card-button-1").click();

  // Original stays in first column
  await expect(col0.getByTestId("card-content-0")).toHaveValue(
    "Cross-column card",
  );

  // Copy appears in second column
  await expect(col1.getByTestId("card-content-0")).toHaveValue(
    "Cross-column card",
  );
});

test("can paste multiple times from a single copy", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Copy the card
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-copy-0").click();

  // Paste three times
  await column.getByTestId("paste-card-button-0").click();
  await column.getByTestId("paste-card-button-0").click();
  await column.getByTestId("paste-card-button-0").click();

  // 1 original + 3 pastes = 4 cards
  await expect(column.locator('[data-testid^="card-content-"]')).toHaveCount(4);
});

test("add card button changes text when card is copied", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  // Initially shows "+ Add card"
  await expect(column.getByTestId("add-card-button-0")).toHaveText(
    "+ Add card",
  );

  // Copy the card
  await column.getByTestId("card-0").hover();
  await column.getByTestId("card-copy-0").click();

  // Button text changes to "+ New"
  await expect(column.getByTestId("add-card-button-0")).toHaveText("+ New");
});
