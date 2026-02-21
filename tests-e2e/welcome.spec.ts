import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI == "true" ? "/kanbeasy" : "/";
  await page.goto(target);
});

test("welcome modal is visible", async ({ page }) => {
  await expect(page.getByTestId("get-started-button")).toBeVisible();
  await expect(page.getByTestId("welcome-description")).toBeVisible();
});

test("can be closed", async ({ page }) => {
  await page.getByTestId("get-started-button").click();
  await expect(page.getByTestId("welcome-description")).not.toBeVisible();
});

test.skip("it will only show once", async () => {});
