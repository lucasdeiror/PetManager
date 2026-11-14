import { afterEach, describe, expect, it, vi } from "vitest";

const getRelatorioMensal = vi.fn(async () => ({
  agendamentosConcluidos: 0,
  agendamentosCancelados: 0,
  faturamentoTotal: 0,
  vendas: [],
}));

vi.mock("../queries", () => ({ getRelatorioMensal }));

describe("página de relatórios: mês padrão (AD-010)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("às 22:30 de 30/11 em Brasília, sem ?mes, abre novembro e não dezembro (UTC)", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-12-01T01:30:00Z")); // 2026-11-30 22:30 em Brasília
    const { default: RelatoriosPage } = await import("../../../app/(dashboard)/relatorios/page");

    await RelatoriosPage({ searchParams: Promise.resolve({}) });

    expect(getRelatorioMensal).toHaveBeenCalledWith(2026, 11);
  });
});
