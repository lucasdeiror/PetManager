import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validar } from "../validar";

const schema = z.object({
  nome: z.string().trim().max(5, "Nome longo demais"),
  qtd: z.number().int("Quantidade deve ser inteira"),
});

describe("validar", () => {
  it("entrada válida devolve data com o texto aparado (ENT-04)", () => {
    expect(validar(schema, { nome: "  ab  ", qtd: 1 })).toStrictEqual({ data: { nome: "ab", qtd: 1 } });
  });

  it("tamanho é checado depois de aparar (ENT-04)", () => {
    expect(validar(schema, { nome: "  abcde  ", qtd: 1 })).toStrictEqual({ data: { nome: "abcde", qtd: 1 } });
  });

  it("entrada inválida devolve 'Dados inválidos.' + mensagem do 1º issue (ENT-02)", () => {
    expect(validar(schema, { nome: "abcdefgh", qtd: 1.5 })).toStrictEqual({
      error: "Dados inválidos. Nome longo demais",
    });
  });

  it("tipo errado devolve erro em vez de lançar (ENT-02)", () => {
    const r = validar(schema, { nome: 123, qtd: 1 });
    expect("error" in r && r.error.startsWith("Dados inválidos. ")).toBe(true);
  });
});
