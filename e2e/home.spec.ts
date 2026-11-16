import { test, expect } from "@playwright/test";

test("/ leva à agenda (DES-04)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/agenda$/);
});
