import { describe, it, expect, vi, beforeEach } from "vitest";
import { gerarRelatorioPdf } from "../actions";
import { getRelatorioMensal } from "../queries";
import { renderRelatorioPdf } from "../../../shared/pdf/relatorio-pdf";
import { exigirDono } from "../../auth/queries";

vi.mock("../queries", () => ({ getRelatorioMensal: vi.fn() }));
vi.mock("../../../shared/pdf/relatorio-pdf", () => ({ renderRelatorioPdf: vi.fn() }));
vi.mock("../../auth/queries", () => ({ exigirDono: vi.fn() }));

describe("gerarRelatorioPdf: entrada e papel (ENT-01, SEG-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exigirDono).mockResolvedValue({});
  });

  it.each([
    ["mês 13", 2026, 13],
    ["mês 0", 2026, 0],
    ["mês fracionado", 2026, 1.5],
    ["ano texto", "2026" as unknown as number, 9],
    ["ano fracionado", 2026.5, 9],
  ])("%s → Dados inválidos, nada é lido nem gerado", async (_n, ano, mes) => {
    const result = await gerarRelatorioPdf(ano, mes);

    expect(result.error).toMatch(/^Dados inválidos\. /);
    expect(exigirDono).not.toHaveBeenCalled();
    expect(getRelatorioMensal).not.toHaveBeenCalled();
    expect(renderRelatorioPdf).not.toHaveBeenCalled();
  });

  it("recepcionista não recebe o PDF nem dispara a leitura de vendas", async () => {
    vi.mocked(exigirDono).mockResolvedValue({ error: "Ação permitida só ao dono." });

    const result = await gerarRelatorioPdf(2026, 9);

    expect(result).toEqual({ error: "Ação permitida só ao dono." });
    expect(getRelatorioMensal).not.toHaveBeenCalled();
    expect(renderRelatorioPdf).not.toHaveBeenCalled();
  });
});
