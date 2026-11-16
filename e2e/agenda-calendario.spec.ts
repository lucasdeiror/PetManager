import { test, expect } from "@playwright/test";
import { diaExclusivo, horaUnica } from "./agenda-dados";

// Este teste exercita <AgendaCalendario /> através da rota /agenda,
// que só existe a partir do T33 — até lá, ele falha por rota
// inexistente (404), não por bug no componente. Fica aqui porque o
// componente (T32) é a unidade sendo testada; a montagem final da
// tela é responsabilidade do T33.
test.describe("componente AgendaCalendario", () => {
  test("horários ocupados e cancelados aparecem visualmente distintos", async ({ page }) => {
    await page.goto(`/agenda?data=${diaExclusivo()}`);

    // Cria os próprios dados: um agendamento que fica ocupado e outro que é cancelado.
    const ocupado = horaUnica();
    let cancelado = horaUnica();
    while (cancelado === ocupado) cancelado = horaUnica();
    for (const hora of [ocupado, cancelado]) {
      await page.getByLabel("Pet").selectOption({ index: 1 });
      await page.getByLabel("Horário").fill(hora);
      await page.getByRole("checkbox").first().check();
      await page.getByRole("button", { name: "Criar agendamento" }).click();
      await expect(page.locator("[data-status]", { hasText: hora }).first()).toBeVisible();
    }
    await page.locator("[data-status]:has(button)", { hasText: cancelado }).first().getByRole("button", { name: "Cancelar" }).click();

    await expect(page.getByText("Ocupado").first()).toBeVisible();
    await expect(page.getByText("Cancelado").first()).toBeVisible();
  });
});
