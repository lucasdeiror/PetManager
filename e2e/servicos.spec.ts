import { test, expect } from "@playwright/test";

test.describe("cadastro de serviços", () => {
  test("cadastro completo com preço válido", async ({ page }) => {
    await page.goto("/servicos");

    const nome = `Banho e tosa ${Date.now()}`;
    await page.getByLabel("Nome do serviço").fill(nome);
    await page.getByLabel("Preço interno (R$)").fill("55.90");
    await page.getByRole("button", { name: "Cadastrar serviço" }).click();

    await expect(page.getByText(nome)).toBeVisible();
  });

  test("preço negativo é rejeitado com mensagem de erro", async ({ page }) => {
    await page.goto("/servicos");

    await page.getByLabel("Nome do serviço").fill("Serviço inválido");
    await page.getByLabel("Preço interno (R$)").fill("-10");
    await page.getByRole("button", { name: "Cadastrar serviço" }).click();

    await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toHaveText(
      "Dados inválidos. O preço deve ser um número válido e não pode ser negativo.",
    );
  });
});
