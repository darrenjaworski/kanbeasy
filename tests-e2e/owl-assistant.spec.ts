import { test, expect } from "./fixtures";

test("owl assistant is hidden by default", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: /owl buddy/i }),
  ).not.toBeVisible();
});

test("can enable owl assistant from settings", async ({ page }) => {
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();

  // Expand Preferences section, then toggle on owl assistant
  await dlg.getByRole("button", { name: /preferences/i }).click();
  await dlg.getByText(/owl assistant/i).click();
  await dlg.getByRole("button", { name: /close settings/i }).click();

  // Owl button should now be visible
  await expect(page.getByRole("button", { name: /owl buddy/i })).toBeVisible();
});

test("owl shows a tip on click and dismisses with button", async ({ page }) => {
  // Enable owl mode
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await dlg.getByRole("button", { name: /preferences/i }).click();
  await dlg.getByText(/owl assistant/i).click();
  await dlg.getByRole("button", { name: /close settings/i }).click();

  // Click the owl
  await page.getByRole("button", { name: /owl buddy/i }).click();

  // Speech bubble should appear with buttons
  await expect(page.getByRole("button", { name: /one more/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /thanks!|good night!/i }),
  ).toBeVisible();

  // Dismiss
  await page.getByRole("button", { name: /thanks!|good night!/i }).click();
  await expect(
    page.getByRole("button", { name: /thanks!|good night!/i }),
  ).not.toBeVisible();
});

test("'One more' shows the next tip without closing", async ({ page }) => {
  // Enable owl mode
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await dlg.getByRole("button", { name: /preferences/i }).click();
  await dlg.getByText(/owl assistant/i).click();
  await dlg.getByRole("button", { name: /close settings/i }).click();

  // Open and read the first tip
  await page.getByRole("button", { name: /owl buddy/i }).click();
  const tipEl = page.getByTestId("owl-tip");
  await expect(tipEl).toBeVisible();
  const firstTip = await tipEl.textContent();

  // Click "One more" and verify the tip changed
  await page.getByRole("button", { name: /one more/i }).click();
  const secondTip = await tipEl.textContent();

  expect(firstTip).not.toBe(secondTip);

  // Dialog should still be open
  await expect(
    page.getByRole("button", { name: /thanks!|good night!/i }),
  ).toBeVisible();
});
