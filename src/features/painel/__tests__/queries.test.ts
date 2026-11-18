import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetCurrentUserRole,
  mockGetAgendamentosPorDia,
  mockGetVacinas,
  mockGetProdutos,
  mockGetVendas,
} = vi.hoisted(() => ({
  mockGetCurrentUserRole: vi.fn(),
  mockGetAgendamentosPorDia: vi.fn(),
  mockGetVacinas: vi.fn(),
  mockGetProdutos: vi.fn(),
  mockGetVendas: vi.fn(),
}));

vi.mock("../../auth/queries", () => ({
  getCurrentUserRole: () => mockGetCurrentUserRole(),
}));

vi.mock("../../agenda/queries", () => ({
  getAgendamentosPorDia: (data: string) => mockGetAgendamentosPorDia(data),
}));

vi.mock("../../vacinas/queries", () => ({
  getVacinas: (filtro: unknown) => mockGetVacinas(filtro),
}));

vi.mock("../../estoque/queries", () => ({
  getProdutos: () => mockGetProdutos(),
}));

vi.mock("../../vendas/queries", () => ({
  getVendas: (filtro: unknown) => mockGetVendas(filtro),
}));

import { getResumoPainel } from "../queries";

describe("getResumoPainel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calcula contagens do dia, filtra cancelados, limita próximos a 5 em ordem crescente e retorna dados de dono (PNL-02, PNL-03, PNL-04, PNL-06, PNL-07)", async () => {
    mockGetCurrentUserRole.mockResolvedValue("dono");
    mockGetAgendamentosPorDia.mockResolvedValue([
      { id: 3, petId: 10, petNome: "Thor", dataHora: "2026-11-18T14:00:00-03:00", status: "agendado", servicoNomes: ["Tosa"] },
      { id: 1, petId: 11, petNome: "Mel", dataHora: "2026-11-18T09:00:00-03:00", status: "concluido", servicoNomes: ["Banho"] },
      { id: 2, petId: 12, petNome: "Rex", dataHora: "2026-11-18T10:00:00-03:00", status: "cancelado", servicoNomes: ["Banho"] },
      { id: 4, petId: 13, petNome: "Luna", dataHora: "2026-11-18T11:00:00-03:00", status: "agendado", servicoNomes: ["Banho"] },
      { id: 5, petId: 14, petNome: "Bidu", dataHora: "2026-11-18T15:00:00-03:00", status: "agendado", servicoNomes: ["Banho"] },
      { id: 6, petId: 15, petNome: "Nina", dataHora: "2026-11-18T16:00:00-03:00", status: "agendado", servicoNomes: ["Tosa"] },
      { id: 7, petId: 16, petNome: "Zeca", dataHora: "2026-11-18T17:00:00-03:00", status: "agendado", servicoNomes: ["Banho"] },
    ]);
    mockGetVacinas.mockResolvedValue([
      { id: 1, petId: 10, petNome: "Thor", nome: "V10", dataAplicacao: "2025-10-01", dataRetornoPrevista: "2026-10-01", status: "atrasada" },
      { id: 2, petId: 11, petNome: "Mel", nome: "Antirrábica", dataAplicacao: "2025-11-01", dataRetornoPrevista: "2026-11-01", status: "atrasada" },
      { id: 3, petId: 12, petNome: "Rex", nome: "Giárdia", dataAplicacao: "2025-11-02", dataRetornoPrevista: "2026-11-02", status: "atrasada" },
      { id: 4, petId: 13, petNome: "Luna", nome: "V8", dataAplicacao: "2025-11-03", dataRetornoPrevista: "2026-11-03", status: "atrasada" },
      { id: 5, petId: 14, petNome: "Bidu", nome: "Gripe", dataAplicacao: "2025-11-04", dataRetornoPrevista: "2026-11-04", status: "atrasada" },
      { id: 6, petId: 15, petNome: "Nina", nome: "Leishmaniose", dataAplicacao: "2025-11-05", dataRetornoPrevista: "2026-11-05", status: "atrasada" },
    ]);
    mockGetProdutos.mockResolvedValue([
      { id: 1, nome: "Shampoo", categoria: "Higiene", precoUnitario: 30, saldoEstoque: 2, estoqueMinimo: 5, estoqueBaixo: true },
      { id: 2, nome: "Ração", categoria: "Alimento", precoUnitario: 120, saldoEstoque: 10, estoqueMinimo: 3, estoqueBaixo: false },
      { id: 3, nome: "Coleira", categoria: "Acessório", precoUnitario: 45, saldoEstoque: 1, estoqueMinimo: 1, estoqueBaixo: true },
    ]);
    mockGetVendas.mockResolvedValue([
      { id: 10, tipo: "servico", itemNome: "Banho", quantidade: 1, valorTotal: 60, criadoEm: "2026-11-18T12:30:00Z" },
      { id: 11, tipo: "produto", itemNome: "Shampoo", quantidade: 2, valorTotal: 80, criadoEm: "2026-11-18T18:00:00Z" },
      { id: 12, tipo: "servico", itemNome: "Tosa", quantidade: 1, valorTotal: 90, criadoEm: "2026-11-10T14:00:00Z" },
    ]);

    const resultado = await getResumoPainel(new Date("2026-11-18T15:00:00Z"));

    expect(mockGetAgendamentosPorDia).toHaveBeenCalledWith("2026-11-18");
    expect(mockGetVacinas).toHaveBeenCalledWith({ status: "atrasada" });
    expect(mockGetVendas).toHaveBeenCalledWith({ mes: "2026-11" });
    expect(resultado.hoje).toBe("2026-11-18");
    expect(resultado.agendamentosHoje.total).toBe(7);
    expect(resultado.agendamentosHoje.agendados).toBe(5);
    expect(resultado.agendamentosHoje.concluidos).toBe(1);
    expect(resultado.agendamentosHoje.proximos.map((a) => a.id)).toStrictEqual([1, 4, 3, 5, 6]);
    expect(resultado.vacinasAtrasadas.total).toBe(6);
    expect(resultado.vacinasAtrasadas.itens.map((v) => v.id)).toStrictEqual([1, 2, 3, 4, 5]);
    expect(resultado.dono).toStrictEqual({
      faturamentoHoje: 140,
      faturamentoMes: 230,
      estoqueBaixoCount: 2,
    });
  });

  it("não consulta vendas nem estoque quando o papel é recepcionista (PNL-08)", async () => {
    mockGetCurrentUserRole.mockResolvedValue("recepcionista");
    mockGetAgendamentosPorDia.mockResolvedValue([
      { id: 1, petId: 11, petNome: "Mel", dataHora: "2026-11-18T09:00:00-03:00", status: "agendado", servicoNomes: ["Banho"] },
    ]);
    mockGetVacinas.mockResolvedValue([]);

    const resultado = await getResumoPainel(new Date("2026-11-18T15:00:00Z"));

    expect(mockGetProdutos).not.toHaveBeenCalled();
    expect(mockGetVendas).not.toHaveBeenCalled();
    expect(resultado.dono).toBeNull();
    expect(resultado.agendamentosHoje.agendados).toBe(1);
    expect(resultado.vacinasAtrasadas.total).toBe(0);
  });

  it("retorna zeros e listas vazias quando não há registros no dia ou mês (PNL-09)", async () => {
    mockGetCurrentUserRole.mockResolvedValue("dono");
    mockGetAgendamentosPorDia.mockResolvedValue([]);
    mockGetVacinas.mockResolvedValue([]);
    mockGetProdutos.mockResolvedValue([]);
    mockGetVendas.mockResolvedValue([]);

    const resultado = await getResumoPainel(new Date("2026-11-18T15:00:00Z"));

    expect(resultado).toStrictEqual({
      hoje: "2026-11-18",
      agendamentosHoje: {
        total: 0,
        agendados: 0,
        concluidos: 0,
        proximos: [],
      },
      vacinasAtrasadas: {
        total: 0,
        itens: [],
      },
      dono: {
        faturamentoHoje: 0,
        faturamentoMes: 0,
        estoqueBaixoCount: 0,
      },
    });
  });

  it("usa o fuso America/Sao_Paulo na virada de dia e mês às 23:30 BRT (02:30Z do dia seguinte) (PNL-10)", async () => {
    mockGetCurrentUserRole.mockResolvedValue("dono");
    mockGetAgendamentosPorDia.mockResolvedValue([]);
    mockGetVacinas.mockResolvedValue([]);
    mockGetProdutos.mockResolvedValue([]);
    mockGetVendas.mockResolvedValue([
      { id: 20, tipo: "servico", itemNome: "Banho", quantidade: 1, valorTotal: 75, criadoEm: "2026-12-01T01:30:00Z" },
    ]);

    const resultado = await getResumoPainel(new Date("2026-12-01T02:30:00Z"));

    expect(mockGetAgendamentosPorDia).toHaveBeenCalledWith("2026-11-30");
    expect(mockGetVendas).toHaveBeenCalledWith({ mes: "2026-11" });
    expect(resultado.hoje).toBe("2026-11-30");
    expect(resultado.dono).toStrictEqual({
      faturamentoHoje: 75,
      faturamentoMes: 75,
      estoqueBaixoCount: 0,
    });
  });
});
