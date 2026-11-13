import { describe, expect, it } from "vitest";
import { clienteAdmin, clienteComo } from "./db-sessao";

async function criarProduto(saldo = 10): Promise<number> {
  const { data, error } = await clienteAdmin()
    .from("produtos")
    .insert({ nome: "Ração", categoria: "Alimentos", preco_unitario: 50, estoque_minimo: 1, saldo_estoque: saldo })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("sem produto");
  return data.id;
}
const saldoDe = async (id: number) =>
  (await clienteAdmin().from("produtos").select("saldo_estoque").eq("id", id).single()).data!.saldo_estoque;
const entradasDe = async (id: number) =>
  (await clienteAdmin().from("movimentacoes_estoque").select("quantidade").eq("produto_id", id).eq("tipo", "entrada")).data!;

describe("RPC registrar_entrada (T24)", () => {
  it("soma ao saldo e registra a movimentação de entrada", async () => {
    const id = await criarProduto(10);
    const { error } = await (await clienteComo("dono")).rpc("registrar_entrada", { p_produto_id: id, p_quantidade: 5 });
    expect(error).toBeNull();
    expect(await saldoDe(id)).toBe(15);
    expect(await entradasDe(id)).toEqual([{ quantidade: 5 }]);
  });

  it("duas entradas simultâneas somam as duas", async () => {
    const id = await criarProduto(10);
    const [a, b] = [await clienteComo("dono"), await clienteComo("dono")];
    const r = await Promise.all([
      a.rpc("registrar_entrada", { p_produto_id: id, p_quantidade: 5 }),
      b.rpc("registrar_entrada", { p_produto_id: id, p_quantidade: 7 }),
    ]);
    expect(r.map((x) => x.error)).toEqual([null, null]);
    expect(await saldoDe(id)).toBe(22);
    expect(await entradasDe(id)).toHaveLength(2);
  });

  it("se a movimentação falha, o saldo não muda (mesma transação)", async () => {
    const id = await criarProduto(10);
    // quantidade 0 passa no update e quebra o check da movimentação
    const { error } = await (await clienteComo("dono")).rpc("registrar_entrada", { p_produto_id: id, p_quantidade: 0 });
    expect(error).not.toBeNull();
    expect(await saldoDe(id)).toBe(10);
    expect(await entradasDe(id)).toHaveLength(0);
  });

  it("recepcionista não registra entrada e o saldo não muda", async () => {
    const id = await criarProduto(10);
    const { error } = await (await clienteComo("recepcionista")).rpc("registrar_entrada", { p_produto_id: id, p_quantidade: 5 });
    expect(error?.message).toBe("Produto não encontrado");
    expect(await saldoDe(id)).toBe(10);
  });

  it("produto inexistente falha com 'Produto não encontrado'", async () => {
    const { error } = await (await clienteComo("dono")).rpc("registrar_entrada", { p_produto_id: 999999, p_quantidade: 5 });
    expect(error?.message).toBe("Produto não encontrado");
  });
});
