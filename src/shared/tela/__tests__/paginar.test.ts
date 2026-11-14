import { describe, expect, it } from "vitest";
import { paginar } from "../paginacao";

const itens = Array.from({ length: 23 }, (_, i) => i + 1);

describe("paginar (DES-06)", () => {
  it("mostra 10 por página e a faixa exibida", () => {
    const p = paginar(itens, "2");
    expect(p.visiveis).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect([p.atual, p.totalPaginas, p.de, p.ate, p.total]).toEqual([2, 3, 11, 20, 23]);
  });

  it("última página traz só o resto", () => {
    expect(paginar(itens, "3").visiveis).toEqual([21, 22, 23]);
  });

  it("página inválida ou fora do intervalo cai no limite", () => {
    expect(paginar(itens, undefined).atual).toBe(1);
    expect(paginar(itens, "abc").atual).toBe(1);
    expect(paginar(itens, "0").atual).toBe(1);
    expect(paginar(itens, "99").atual).toBe(3);
  });

  it("lista vazia tem uma página e faixa 0–0", () => {
    const p = paginar([], "1");
    expect([p.atual, p.totalPaginas, p.de, p.ate]).toEqual([1, 1, 0, 0]);
  });
});
