import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

// TST-01 / TST-02: migrations aplicadas num banco limpo e usuários reais criados
describe("harness do test:db", () => {
  const admin = () =>
    createClient(process.env.SUPABASE_TEST_URL!, process.env.SUPABASE_TEST_SERVICE_KEY!, {
      auth: { persistSession: false },
    });

  it("aplica as migrations: tabela vendas existe e está vazia", async () => {
    const { data, error } = await admin().from("vendas").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("cria exatamente um dono e uma recepcionista", async () => {
    const { data, error } = await admin().from("profiles").select("role").order("role");
    expect(error).toBeNull();
    expect(data).toEqual([{ role: "dono" }, { role: "recepcionista" }]);
  });
});
