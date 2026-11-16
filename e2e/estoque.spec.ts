import { test, expect } from "@playwright/test";

test.describe("tela de estoque", () => {
  test.describe("sem sessão", () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test("/estoque redireciona para /login", async ({ page }) => {
      await page.goto("/estoque");
      await expect(page).toHaveURL(/\/login$/);
    });
  });

  test("cadastro de produto + entrada de estoque + alerta de estoque baixo", async ({ page }) => {
    await page.goto("/estoque");
    const nome = `Ração premium ${Date.now()}`;

    await page.getByLabel("Nome").fill(nome);
    await page.getByLabel("Categoria").fill("Alimentos");
    await page.getByLabel("Preço unitário (R$)").fill("89.90");
    await page.getByLabel("Estoque mínimo").fill("5");
    await page.getByLabel("Saldo inicial").fill("2");
    await page.getByRole("button", { name: "Cadastrar produto" }).click();

    // A lista é paginada por nome; busca pelo produto criado em vez de depender da página 1
    await page.getByPlaceholder("Buscar produto...").fill(nome);
    const item = page.getByRole("listitem").filter({ hasText: nome });
    await expect(item).toBeVisible();
    await expect(item.getByText("Estoque baixo")).toBeVisible();

    await item.getByLabel("Entrada").fill("10");
    await item.getByRole("button", { name: "Registrar" }).click();

    await expect(item.getByText("12 un.")).toBeVisible();
  });

  test.describe("recepcionista", () => {
    test.use({ storageState: "e2e/.auth/recepcionista.json" });
    test("menu esconde Estoque e Relatórios (DES-02)", async ({ page }) => {
      await page.goto("/agenda");
      const menu = page.getByRole("navigation", { name: "Navegação principal" });
      await expect(menu.getByRole("link", { name: "Agenda" })).toHaveAttribute("aria-current", "page");
      await expect(menu.getByRole("link", { name: "Estoque" })).toHaveCount(0);
      await expect(menu.getByRole("link", { name: "Relatórios" })).toHaveCount(0);
    });
  });
});
