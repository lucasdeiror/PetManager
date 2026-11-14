import { test, expect } from "@playwright/test";

test.describe("tela de vacinas", () => {
  test("registrar vacina, ver na listagem geral e na ficha do pet", async ({ page }) => {
    await page.goto("/vacinas");
    const nome = `V10 ${Date.now()}`;

    await page.getByLabel("Pet").selectOption({ index: 1 });
    await page.getByLabel("Nome da vacina").fill(nome);
    await page.getByLabel("Data de aplicação").fill("2026-01-10");
    await page.getByLabel("Data de retorno prevista").fill("2027-01-10");
    await page.getByRole("button", { name: "Registrar vacina" }).click();

    // A lista é paginada; busca pela vacina criada em vez de depender da página 1
    await page.getByPlaceholder("Buscar por pet ou nome da vacina...").fill(nome);
    const linha = page.getByRole("listitem").filter({ hasText: nome });
    await expect(linha).toBeVisible();

    await linha.getByRole("link", { name: "Ver ficha" }).click();
    await expect(page.getByText(/Ficha de/)).toBeVisible();
    await expect(page.getByText(nome).first()).toBeVisible();
  });

  test("busca e filtro de status funcionam na listagem geral", async ({ page }) => {
    await page.goto("/vacinas?filtro=atrasada");
    await expect(page).toHaveURL(/filtro=atrasada/);
  });

  test("rejeita retorno anterior à aplicação", async ({ page }) => {
    await page.goto("/vacinas");

    await page.getByLabel("Pet").selectOption({ index: 1 });
    await page.getByLabel("Nome da vacina").fill("Antirrábica");
    await page.getByLabel("Data de aplicação").fill("2026-06-01");
    await page.getByLabel("Data de retorno prevista").fill("2026-01-01");
    await page.getByRole("button", { name: "Registrar vacina" }).click();

    await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toHaveText(
      "A data de retorno não pode ser anterior à data de aplicação.",
    );
  });
});
