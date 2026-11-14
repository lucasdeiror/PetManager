import { test, expect } from "@playwright/test";

// Horário único por execução (o banco local acumula dados entre rodadas).
function horaUnica(): string {
  const h = String(10 + Math.floor(Math.random() * 12)).padStart(2, "0");
  const m = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  return `${h}:${m}`;
}

test.describe("tela de agenda - fluxo completo de estados", () => {
  test("criar, editar, cancelar, reabrir, concluir e efeito em Vendas", async ({ page }) => {
    await page.goto("/agenda");
    const hora = horaUnica();
    const horaNova = horaUnica();

    // Criar
    await page.getByLabel("Pet").selectOption({ index: 1 });
    await page.getByLabel("Horário").fill(hora);
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Criar agendamento" }).click();

    // O calendário mostra a mesma hora sem botões; o card de ações é o item que tem botão.
    const item = page.locator('[data-status]:has(button)', { hasText: hora }).first();
    await expect(item).toBeVisible();
    await expect(item).toHaveAttribute("data-status", "agendado");

    // Editar
    await item.getByRole("button", { name: "Editar" }).click();
    await item.locator('input[type="time"]').fill(horaNova);
    await item.getByRole("button", { name: "Salvar" }).click();
    await expect(page.locator('[data-status]:has(button)', { hasText: horaNova })).toBeVisible();

    // Cancelar
    const itemEditado = page.locator('[data-status]:has(button)', { hasText: horaNova }).first();
    await itemEditado.getByRole("button", { name: "Cancelar" }).click();
    await expect(itemEditado).toHaveAttribute("data-status", "cancelado");

    // Reabrir (volta a agendado)
    await itemEditado.getByRole("button", { name: "Reabrir" }).click();
    await expect(itemEditado).toHaveAttribute("data-status", "agendado");

    // Concluir -> deve gerar venda
    await itemEditado.getByRole("button", { name: "Concluir" }).click();
    await expect(itemEditado).toHaveAttribute("data-status", "concluido");

    await page.goto("/vendas");
    await expect(page.getByText("Total do período")).toBeVisible();
  });

  test("botão de ação desabilita imediatamente após o clique", async ({ page }) => {
    await page.goto("/agenda");

    await page.getByLabel("Pet").selectOption({ index: 1 });
    await page.getByLabel("Horário").fill(horaUnica());
    await page.getByRole("checkbox").first().check();

    // Atrasa a Server Action (POST) para o estado "pendente" ser observável: no banco local ela termina em ms.
    await page.route("**/agenda*", async (route) => {
      if (route.request().method() === "POST") await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });

    // O rótulo muda para "Salvando..." enquanto pendente, então o seletor aceita os dois.
    const botao = page.getByRole("button", { name: /Criar agendamento|Salvando/ });
    await botao.click();

    await expect(botao).toBeDisabled();
  });
});
