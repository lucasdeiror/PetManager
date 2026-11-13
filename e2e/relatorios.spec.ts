import { test, expect } from "@playwright/test";

test.describe("tela de relatório mensal", () => {
  test.describe("sem sessão", () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test("/relatorios redireciona para /login", async ({ page }) => {
      await page.goto("/relatorios");
      await expect(page).toHaveURL(/\/login$/);
    });
  });

  test("navegação entre meses atualiza os dados exibidos", async ({ page }) => {
    await page.goto("/relatorios?ano=2026&mes=6");
    await expect(page.getByText("Junho de 2026")).toBeVisible();

    await page.getByRole("link", { name: "Próximo mês →" }).click();
    await expect(page).toHaveURL(/ano=2026&mes=7/);
    await expect(page.getByText("Julho de 2026")).toBeVisible();

    await page.getByRole("link", { name: "← Mês anterior" }).click();
    await expect(page).toHaveURL(/ano=2026&mes=6/);
  });

  test("exportar PDF baixa um arquivo", async ({ page }) => {
    await page.goto("/relatorios?ano=2026&mes=6");

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar PDF" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("relatorio-2026-06.pdf");
  });
});
