import { test, expect } from "@playwright/test";

const ROTAS_RESTRITAS = ["/estoque", "/vendas/produto", "/relatorios"];
const ROTAS_PROTEGIDAS = ["/agenda", "/pets", "/"];

test.describe("proxy: sem sessão", () => {
  for (const rota of ROTAS_PROTEGIDAS) {
    test(`${rota} redireciona para /login`, async ({ page }) => {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("/login abre sem redirecionar", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel("E-mail")).toBeVisible();
  });
});

test.describe("proxy: proteção por papel", () => {
  for (const rota of ROTAS_RESTRITAS) {
    test(`sem sessão, ${rota} redireciona para /login`, async ({ page }) => {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});

test.describe("proxy: recepcionista logada (ROT-02)", () => {
  test.use({ storageState: "e2e/.auth/recepcionista.json" });

  for (const rota of ["/estoque", "/relatorios"]) {
    test(`${rota} redireciona para /`, async ({ page }) => {
      await page.goto(rota);
      await expect(page).toHaveURL(/localhost:3000\/$/);
    });
  }

  test("/agenda continua acessível", async ({ page }) => {
    await page.goto("/agenda");
    await expect(page).toHaveURL(/\/agenda$/);
  });
});
