import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetCurrentUserRole,
  mockGetAgendamentosPorDia,
  mockGetVacinas,
  mockGetProdutos,
} = vi.hoisted(() => ({
  mockGetCurrentUserRole: vi.fn(),
  mockGetAgendamentosPorDia: vi.fn(),
  mockGetVacinas: vi.fn(),
  mockGetProdutos: vi.fn(),
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

import { getNotificacoes } from "../queries";

describe("getNotificacoes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna notificações de vacinas atrasadas e agendamentos para recepcionista sem estoque", async () => {
    mockGetCurrentUserRole.mockResolvedValue("recepcionista");
    mockGetAgendamentosPorDia.mockResolvedValue([
      { id: 1, petId: 10, petNome: "Thor", status: "agendado" },
      { id: 2, petId: 11, petNome: "Mel", status: "concluido" },
    ]);
    mockGetVacinas.mockResolvedValue([
      {
        id: 1,
        petId: 10,
        petNome: "Thor",
        nome: "V10",
        dataAplicacao: "2025-11-10",
        dataRetornoPrevista: "2026-11-10",
        status: "atrasada",
      },
    ]);

    const res = await getNotificacoes(new Date("2026-11-18T12:00:00Z"));

    expect(res.total).toBe(2);
    expect(res.itens[0]).toMatchObject({
      tipo: "vacina",
      titulo: "Vacina atrasada: V10",
      detalhe: "Pet: Thor · Prevista para 10/11/2026",
      tom: "perigo",
      link: "/vacinas",
    });
    expect(res.itens[1]).toMatchObject({
      tipo: "agenda",
      titulo: "1 agendamento pendente hoje",
      tom: "aviso",
      link: "/agenda",
    });
    expect(mockGetProdutos).not.toHaveBeenCalled();
  });

  it("inclui alertas de estoque baixo quando o usuário é dono", async () => {
    mockGetCurrentUserRole.mockResolvedValue("dono");
    mockGetAgendamentosPorDia.mockResolvedValue([]);
    mockGetVacinas.mockResolvedValue([]);
    mockGetProdutos.mockResolvedValue([
      { id: 1, nome: "Ração Golden", saldoEstoque: 2, estoqueMinimo: 5, estoqueBaixo: true },
      { id: 2, nome: "Shampoo Pet", saldoEstoque: 10, estoqueMinimo: 3, estoqueBaixo: false },
    ]);

    const res = await getNotificacoes(new Date("2026-11-18T12:00:00Z"));

    expect(res.total).toBe(1);
    expect(res.itens[0]).toMatchObject({
      tipo: "estoque",
      titulo: "Estoque baixo: Ração Golden",
      detalhe: "Apenas 2 unidades (mínimo 5)",
      tom: "perigo",
      link: "/estoque",
    });
  });

  it("retorna lista vazia e total 0 quando tudo está em dia", async () => {
    mockGetCurrentUserRole.mockResolvedValue("dono");
    mockGetAgendamentosPorDia.mockResolvedValue([]);
    mockGetVacinas.mockResolvedValue([]);
    mockGetProdutos.mockResolvedValue([
      { id: "p1", nome: "Ração", estoqueAtual: 20, estoqueMinimo: 5, estoqueBaixo: false },
    ]);

    const res = await getNotificacoes(new Date("2026-11-18T12:00:00Z"));

    expect(res.total).toBe(0);
    expect(res.itens).toEqual([]);
  });
});
