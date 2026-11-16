import { test, expect } from "@playwright/test";
import { EMAIL_TESTE, SENHA_TESTE } from "../src/shared/supabase/__tests__/db-setup";

test.describe("página de login", () => {
  test("credenciais inválidas exibem a mensagem de erro genérica", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("naoexiste@petshop.com");
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: /entrar no petmanager/i }).click();

    await expect(page.locator("p[role=alert]")).toHaveText("E-mail ou senha inválidos");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login válido mostra o card Área segura e leva à agenda (DES-04, DES-05)", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Área segura")).toBeVisible();
    await page.getByLabel("E-mail").fill(EMAIL_TESTE.dono);
    await page.getByLabel("Senha").fill(SENHA_TESTE);
    await page.getByRole("button", { name: /entrar no petmanager/i }).click();

    await expect(page).toHaveURL(/\/agenda$/);
  });
});
