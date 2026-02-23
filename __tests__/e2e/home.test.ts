import { test, expect } from "@playwright/test";

test("should have the correct title and branding", async ({ page }) => {
  await page.goto("/");

  // Check that the logo text is present.
  // We use .first() because there might be multiple "Quest" strings (e.g. logo, SEO text).
  const logo = page.locator("text=Quest").first();
  await expect(logo).toBeVisible();
});
