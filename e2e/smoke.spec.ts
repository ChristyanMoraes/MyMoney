import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("landing carrega e mostra My Money", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("My Money", { exact: true }).first()).toBeVisible();
  });
});
