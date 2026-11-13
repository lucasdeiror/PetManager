import { beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin, clienteAnon, clienteComo } from "./db-sessao";

// TST-02: cada teste roda com a sessão real do papel; CAD-02: cadastro público recusado
describe("RLS e cadastro com sessões reais", () => {
  beforeAll(async () => {
    const { error } = await clienteAdmin().from("produtos").insert({ nome: "Shampoo", preco_unitario: 10 });
    expect(error).toBeNull();
  });

  it("dono lê produtos", async () => {
    const { data, error } = await (await clienteComo("dono")).from("produtos").select("nome");
    expect(error).toBeNull();
    expect(data).toEqual([{ nome: "Shampoo" }]);
  });

  it("recepcionista não lê produtos", async () => {
    const { data, error } = await (await clienteComo("recepcionista")).from("produtos").select("nome");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("auth.signUp é recusado", async () => {
    const { data, error } = await clienteAnon().auth.signUp({
      email: "intruso@petmanager.test",
      password: "senha-de-teste-123",
    });
    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
  });
});
