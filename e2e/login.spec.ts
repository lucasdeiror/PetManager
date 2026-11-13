import { test, expect } from "@playwright/test";

test.describe("página de login", () => {
  test("credenciais inválidas exibem a mensagem de erro genérica", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("naoexiste@petshop.com");
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: /entrar no petmanager/i }).click();

    await expect(page.locator("p[role=alert]")).toHaveText("E-mail ou senha inválidos");
    await expect(page).toHaveURL(/\/login$/);
  });

  // NOTA: o happy path (login válido -> redireciona ao dashboard)
  // depende de uma conta de teste seedada no Supabase Auth deste
  // projeto — ver Notas de execução no tasks.md desta task.
});
