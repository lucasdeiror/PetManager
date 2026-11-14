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

  // NOTA: "recepcionista não vê o menu nem acessa a rota diretamente"
  // é coberto pela lógica do middleware (T7, já testado ali) + pela
  // checagem de papel em getProdutos (T19, retorna [] pra
  // recepcionista). O cenário de ponta a ponta com uma sessão real de
  // recepcionista depende de conta de teste seedada — mesmo TODO já
  // registrado desde o T7/T8.
});
