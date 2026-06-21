import { test, expect, gotoApp } from "./fixtures";

// Leave the welcome modal open so these specs can assert on it.
test.use({ seed: { skipWelcome: true } });

test("welcome modal is visible", async ({ page }) => {
  await expect(page.getByTestId("get-started-button")).toBeVisible();
  await expect(page.getByTestId("welcome-description")).toBeVisible();
});

test("can be closed", async ({ page }) => {
  await page.getByTestId("get-started-button").click();
  await expect(page.getByTestId("welcome-description")).not.toBeVisible();
});

test("it will only show once", async ({ page }) => {
  await page.getByTestId("get-started-button").click();
  await expect(page.getByTestId("welcome-description")).not.toBeVisible();

  await gotoApp(page, { skipWelcome: true });

  await expect(page.getByTestId("welcome-description")).not.toBeVisible();
});
