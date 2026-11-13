import { describe, it, expect, vi, beforeEach } from "vitest";
import { gerarRelatorioPdf } from "../actions";
import { getRelatorioMensal } from "../queries";
import { renderRelatorioPdf } from "../../../shared/pdf/relatorio-pdf";

vi.mock("../../auth/queries", () => ({ exigirDono: vi.fn(async () => ({})) }));

vi.mock("../queries", () => ({
  getRelatorioMensal: vi.fn(),
}));

vi.mock("../../../shared/pdf/relatorio-pdf", () => ({
  renderRelatorioPdf: vi.fn(),
}));

const RELATORIO_COM_DADOS = {
  ano: 2026,
  mes: 9,
  agendamentosConcluidos: 2,
  agendamentosCancelados: 1,
  faturamentoTotal: 150,
  vendas: [],
};

const RELATORIO_VAZIO = {
  ano: 2026,
  mes: 8,
  agendamentosConcluidos: 0,
  agendamentosCancelados: 0,
  faturamentoTotal: 0,
  vendas: [],
};

describe("gerarRelatorioPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gera o PDF pra um mês com dados", async () => {
    vi.mocked(getRelatorioMensal).mockResolvedValue(RELATORIO_COM_DADOS);
    vi.mocked(renderRelatorioPdf).mockResolvedValue(Buffer.from("%PDF-1.4 conteudo"));

    const result = await gerarRelatorioPdf(2026, 9);

    expect(result.error).toBeUndefined();
    expect(result.fileName).toBe("relatorio-2026-09.pdf");
    expect(result.base64).toBe(Buffer.from("%PDF-1.4 conteudo").toString("base64"));
  });

  it("gera o PDF pra um mês vazio, sem erro", async () => {
    vi.mocked(getRelatorioMensal).mockResolvedValue(RELATORIO_VAZIO);
    vi.mocked(renderRelatorioPdf).mockResolvedValue(Buffer.from("%PDF-1.4 vazio"));

    const result = await gerarRelatorioPdf(2026, 8);

    expect(result.error).toBeUndefined();
    expect(result.fileName).toBe("relatorio-2026-08.pdf");
  });

  it("retorna erro sem lançar quando a geração falha", async () => {
    vi.mocked(getRelatorioMensal).mockResolvedValue(RELATORIO_COM_DADOS);
    vi.mocked(renderRelatorioPdf).mockRejectedValue(new Error("falha simulada"));

    const result = await gerarRelatorioPdf(2026, 9);

    expect(result.error).toBe("Não foi possível gerar o PDF. Tente novamente.");
    expect(result.base64).toBeUndefined();
  });
});
