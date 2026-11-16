import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { criarAgendamento } from "./db-cenario";
import { clienteAdmin, clienteComo } from "./db-sessao";
import { SENHA_TESTE } from "./db-setup";

const opcoes = { auth: { persistSession: false, autoRefreshToken: false } };

const criados: string[] = [];

/** Cria um login real; `perfil` define se ganha linha em profiles e se fica ativo. */
async function loginExtra(email: string, perfil: "nenhum" | "inativo"): Promise<SupabaseClient> {
  const admin = clienteAdmin();
  const { data, error } = await admin.auth.admin.createUser({ email, password: SENHA_TESTE, email_confirm: true });
  if (error) throw error;
  criados.push(data.user.id);
  if (perfil === "inativo") {
    const { error: e2 } = await admin.from("profiles").insert({ id: data.user.id, role: "dono", ativo: false });
    if (e2) throw e2;
  }
  const c = createClient(process.env.SUPABASE_TEST_URL!, process.env.SUPABASE_TEST_ANON_KEY!, opcoes);
  const { error: e3 } = await c.auth.signInWithPassword({ email, password: SENHA_TESTE });
  if (e3) throw e3;
  return c;
}

// SEG-07: login sem perfil ativo (signup ligado por engano na nuvem, funcionária desligada) não vê nem grava nada
describe("acesso exige perfil ativo", () => {
  const tabelas = ["tutores", "pets", "agendamentos", "agendamento_servicos", "vacinas", "servicos", "vendas", "horarios_funcionamento"];
  let semPerfil: SupabaseClient;
  let inativo: SupabaseClient;

  beforeAll(async () => {
    await criarAgendamento([30]);
    semPerfil = await loginExtra("sem-perfil@petmanager.test", "nenhum");
    inativo = await loginExtra("inativo@petmanager.test", "inativo");
  });

  // o banco é compartilhado: o harness conta exatamente um dono e uma recepcionista
  afterAll(async () => {
    for (const id of criados) await clienteAdmin().auth.admin.deleteUser(id);
  });

  for (const tabela of tabelas) {
    it(`sem perfil e inativo não leem ${tabela}`, async () => {
      for (const c of [semPerfil, inativo]) {
        const { data } = await c.from(tabela).select("*");
        expect(data ?? []).toEqual([]);
      }
    });
  }

  it("sem perfil e inativo não cadastram tutor", async () => {
    for (const c of [semPerfil, inativo]) {
      const { error } = await c.from("tutores").insert({ nome: "Intruso", telefone: "+5579999991111" });
      expect(error).not.toBeNull();
    }
  });

  it("inativo não tem papel", async () => {
    const { data } = await inativo.rpc("current_role_petmanager");
    expect(data).toBeNull();
  });

  it("recepcionista não cria agendamento já concluído (sem venda)", async () => {
    const admin = clienteAdmin();
    const { data: pet } = await admin.from("pets").select("id").limit(1).single();
    const { error } = await (await clienteComo("recepcionista"))
      .from("agendamentos")
      .insert({ pet_id: pet!.id, data_hora: "2026-12-02T13:00:00Z", status: "concluido" });
    expect(error).not.toBeNull();
  });
});
