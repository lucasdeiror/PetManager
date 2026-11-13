import { describe, it, expect, vi, beforeEach } from "vitest";
import { criarProduto, registrarEntrada } from "../actions";
import { createClient } from "../../../shared/supabase/server";
import { exigirDono } from "../../auth/queries";

vi.mock("../../../shared/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("../../auth/queries", () => ({ exigirDono: vi.fn() }));

const forjado = <T>(v: unknown) => v as T;
const produto = { nome: "Ração", categoria: "Alimentos", precoUnitario: 10, estoqueMinimo: 1 };

describe("estoque: entrada validada (ENT-01, ENT-03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exigirDono).mockResolvedValue({});
  });

  it.each([
    ["registrarEntrada quantidade 0", () => registrarEntrada(1, 0)],
    ["registrarEntrada quantidade fracionada", () => registrarEntrada(1, 1.5)],
    ["registrarEntrada quantidade texto", () => registrarEntrada(1, forjado("5"))],
    ["registrarEntrada produtoId inválido", () => registrarEntrada(forjado(null), 1)],
    ["criarProduto nome: 123", () => criarProduto(forjado({ ...produto, nome: 123 }))],
    ["criarProduto preço negativo", () => criarProduto({ ...produto, precoUnitario: -1 })],
    ["criarProduto preço NaN", () => criarProduto({ ...produto, precoUnitario: NaN })],
    ["criarProduto nome de 256 chars", () => criarProduto({ ...produto, nome: "a".repeat(256) })],
  ])("%s → Dados inválidos, sem papel nem Supabase", async (_n, chamar) => {
    const result = await chamar();

    expect(result.error).toMatch(/^Dados inválidos\. /);
    expect(exigirDono).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("quantidade inválida traz a mensagem de quantidade", async () => {
    expect(await registrarEntrada(1, 0)).toEqual({
      error: "Dados inválidos. Informe uma quantidade válida (maior que zero).",
    });
  });
});

describe("estoque: papel no servidor (SEG-01)", () => {
  it.each([
    ["criarProduto", () => criarProduto(produto)],
    ["registrarEntrada", () => registrarEntrada(1, 5)],
  ])("%s como recepcionista → Ação permitida só ao dono, sem Supabase", async (_n, chamar) => {
    vi.clearAllMocks();
    vi.mocked(exigirDono).mockResolvedValue({ error: "Ação permitida só ao dono." });

    expect(await chamar()).toEqual({ error: "Ação permitida só ao dono." });
    expect(createClient).not.toHaveBeenCalled();
  });
});
