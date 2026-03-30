import { expect, test } from "@playwright/test";

test.describe("auth", () => {
  test("visitante em /dashboard é redirecionado para login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test.describe.serial("fluxo com conta nova (requer DB)", () => {
    const password = "e2e-secret-123456";
    const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@example.com`;

    test("registo leva ao dashboard", async ({ page }) => {
      await page.goto("/register");
      await page.getByPlaceholder("Seu nome").fill("E2E User");
      await page.getByPlaceholder("seu@email.com").fill(email);
      await page.getByPlaceholder("Mínimo 6 caracteres").fill(password);
      await page.getByRole("button", { name: "Criar conta" }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 25000 });
    });

    test("login com senha errada mostra erro", async ({ page }) => {
      await page.goto("/login");
      await page.getByPlaceholder("seu@email.com").fill(email);
      await page.locator('input[type="password"]').fill("wrong-password-xxx");
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page.getByText("Email ou senha incorretos")).toBeVisible({
        timeout: 15000,
      });
    });

    test("login com credenciais corretas alcança dashboard", async ({ page }) => {
      await page.goto("/login");
      await page.getByPlaceholder("seu@email.com").fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 25000 });
    });
  });
});
