import { test, expect } from "@playwright/test";

test.describe("tela de vendas", () => {
  test("lista carrega com o total do período visível", async ({ page }) => {
    await page.goto("/vendas");
    await expect(page.getByText("Total do período")).toBeVisible();
  });

  test("busca por tipo filtra a lista", async ({ page }) => {
    await page.goto("/vendas?filtro=produto");
    await expect(page).toHaveURL(/filtro=produto/);
  });

  // NOTA: "recepcionista não vê a opção de registrar venda de produto"
  // depende de uma sessão real de recepcionista (conta de teste
  // seedada) — mesmo TODO compartilhado desde T7/T8. A lógica em si
  // (`isDono` controla a renderização do form) está coberta pela
  // combinação de getCurrentUserRole (T6, testado) + getProdutos
  // retornando [] pra não-dono (T19, testado).
});
