import { test, expect } from "@playwright/test";

test("signup to timer smoke path", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await page.goto("/timer");
  await expect(page).toHaveURL(/login|timer/);
});
