import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { test as setup, expect } from "@playwright/test";
import { EMAIL_TESTE, SENHA_TESTE } from "../src/shared/supabase/__tests__/db-setup";

export const SESSAO_DONO = "e2e/.auth/dono.json";
export const SESSAO_RECEPCIONISTA = "e2e/.auth/recepcionista.json";

// Garante o dono no Supabase local (idempotente) e salva a sessão para as demais specs.
setup("login como dono", async ({ page }) => {
  const status = JSON.parse(
    execSync("npx supabase status -o json", { stdio: ["ignore", "pipe", "ignore"] }).toString(),
  );
  const admin = clienteAdmin(status.API_URL, status.SERVICE_ROLE_KEY);
  const { data } = await admin.auth.admin.createUser({
    email: EMAIL_TESTE.dono,
    password: SENHA_TESTE,
    email_confirm: true,
  });
  if (data.user) await admin.from("profiles").upsert({ id: data.user.id, role: "dono" });

  await semear(admin);

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL_TESTE.dono);
  await page.getByLabel("Senha").fill(SENHA_TESTE);
  await page.getByRole("button", { name: /entrar no petmanager/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.context().storageState({ path: SESSAO_DONO });
});

// Recepcionista real para provar a proteção por papel do proxy (ROT-02).
setup("login como recepcionista", async ({ page }) => {
  const status = JSON.parse(
    execSync("npx supabase status -o json", { stdio: ["ignore", "pipe", "ignore"] }).toString(),
  );
  const admin = clienteAdmin(status.API_URL, status.SERVICE_ROLE_KEY);
  const { data } = await admin.auth.admin.createUser({
    email: EMAIL_TESTE.recepcionista,
    password: SENHA_TESTE,
    email_confirm: true,
  });
  if (data.user) await admin.from("profiles").upsert({ id: data.user.id, role: "recepcionista" });

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL_TESTE.recepcionista);
  await page.getByLabel("Senha").fill(SENHA_TESTE);
  await page.getByRole("button", { name: /entrar no petmanager/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.context().storageState({ path: SESSAO_RECEPCIONISTA });
});

// Dados mínimos que várias specs assumem (idempotente): expediente nos 7 dias,
// um tutor com pet e um serviço. Cada spec cria o resto com nomes únicos.
async function semear(admin: ReturnType<typeof clienteAdmin>) {
  const { data: horarios } = await admin.from("horarios_funcionamento").select("dia_semana");
  const existentes = new Set((horarios ?? []).map((h) => h.dia_semana));
  const faltando = [0, 1, 2, 3, 4, 5, 6]
    .filter((d) => !existentes.has(d))
    .map((d) => ({ dia_semana: d, hora_abertura: "00:00", hora_fechamento: "23:59" }));
  if (faltando.length) await admin.from("horarios_funcionamento").insert(faltando);

  const { count: pets } = await admin.from("pets").select("id", { count: "exact", head: true });
  if (!pets) {
    const { data: tutor } = await admin
      .from("tutores")
      .insert({ nome: "Tutor E2E", telefone: "+5579999998888" })
      .select("id")
      .single();
    await admin.from("pets").insert({ tutor_id: tutor!.id, nome: "Pet E2E", raca: "Vira-lata", porte: "medio" });
  }

  const { count: servicos } = await admin.from("servicos").select("id", { count: "exact", head: true });
  if (!servicos) await admin.from("servicos").insert({ nome: "Banho E2E", preco_interno: 50 });
}

function clienteAdmin(url: string, chave: string) {
  return createClient(url, chave, { auth: { persistSession: false } });
}
