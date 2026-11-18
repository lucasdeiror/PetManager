import { test, expect } from "@playwright/test";

test.describe("tela do painel inicial", () => {
  test.describe("sem sessão", () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test("/painel redireciona para /login (PNL-11)", async ({ page }) => {
      await page.goto("/painel");
      await expect(page).toHaveURL(/\/login$/);
    });
  });

  test("dono vê resumo operacional, faturamento, estoque baixo e atalhos (PNL-01..PNL-07)", async ({ page }) => {
    await page.goto("/painel");

    const menu = page.getByRole("navigation", { name: "Navegação principal" });
    await expect(menu.getByRole("link", { name: "Painel" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();

    await expect(page.getByText("Agendamentos hoje")).toBeVisible();
    await expect(page.getByText("Pendentes hoje")).toBeVisible();
    await expect(page.getByText("Concluídos hoje")).toBeVisible();
    await expect(page.getByText("Vacinas atrasadas", { exact: true })).toBeVisible();

    await expect(page.getByText("Faturamento hoje")).toBeVisible();
    await expect(page.getByText("Faturamento no mês")).toBeVisible();
    await expect(page.getByText("Produtos em estoque baixo")).toBeVisible();

    await expect(page.getByRole("link", { name: "Ver agenda" })).toHaveAttribute("href", "/agenda");
    await expect(page.getByRole("link", { name: "Ver vacinas atrasadas" })).toHaveAttribute(
      "href",
      "/vacinas?status=atrasada",
    );
    await expect(page.getByRole("link", { name: "Ir para estoque" })).toHaveAttribute("href", "/estoque");
  });

  test.describe("recepcionista", () => {
    test.use({ storageState: "e2e/.auth/recepcionista.json" });

    test("acessa /painel e vê resumo operacional, mas não vê faturamento nem estoque baixo (PNL-01, PNL-08)", async ({
      page,
    }) => {
      await page.goto("/painel");

      const menu = page.getByRole("navigation", { name: "Navegação principal" });
      await expect(menu.getByRole("link", { name: "Painel" })).toHaveAttribute("aria-current", "page");
      await expect(page.getByRole("heading", { name: "Painel" })).toBeVisible();
      await expect(page.getByText("Agendamentos hoje")).toBeVisible();
      await expect(page.getByText("Vacinas atrasadas", { exact: true })).toBeVisible();

      await expect(page.getByText("Faturamento hoje")).toHaveCount(0);
      await expect(page.getByText("Faturamento no mês")).toHaveCount(0);
      await expect(page.getByText("Produtos em estoque baixo")).toHaveCount(0);
    });
  });
});
