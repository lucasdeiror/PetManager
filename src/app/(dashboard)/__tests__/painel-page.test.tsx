import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { mockGetResumoPainel } = vi.hoisted(() => ({
  mockGetResumoPainel: vi.fn(),
}));

vi.mock("../../../features/painel/queries", () => ({
  getResumoPainel: () => mockGetResumoPainel(),
}));

import PainelPage from "../painel/page";

afterEach(cleanup);

describe("PainelPage (PNL-01..PNL-09)", () => {
  it("exibe métricas operacionais, próximos agendamentos, vacinas atrasadas e indicadores do dono (PNL-01..PNL-07)", async () => {
    mockGetResumoPainel.mockResolvedValue({
      hoje: "2026-11-18",
      agendamentosHoje: {
        total: 3,
        agendados: 2,
        concluidos: 1,
        proximos: [
          {
            id: 10,
            petId: 1,
            petNome: "Thor",
            dataHora: "2026-11-18T14:30:00-03:00",
            status: "agendado",
            servicoNomes: ["Banho", "Tosa"],
          },
        ],
      },
      vacinasAtrasadas: {
        total: 1,
        itens: [
          {
            id: 20,
            petId: 2,
            petNome: "Mel",
            nome: "V10",
            dataAplicacao: "2025-10-01",
            dataRetornoPrevista: "2026-10-01",
            status: "atrasada",
          },
        ],
      },
      dono: {
        faturamentoHoje: 120,
        faturamentoMes: 1450.5,
        estoqueBaixoCount: 4,
      },
    });

    render(await PainelPage());

    expect(screen.getByRole("heading", { name: "Painel" })).toBeTruthy();
    expect(screen.getByText("Thor")).toBeTruthy();
    expect(screen.getByText("Mel")).toBeTruthy();
    expect(screen.getByText(/14:30/)).toBeTruthy();
    expect(screen.getByText(/Banho \+ Tosa/)).toBeTruthy();
    expect(screen.getByText(/V10/)).toBeTruthy();
    expect(screen.getByText(/01\/10\/2026/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver agenda" }).getAttribute("href")).toBe("/agenda");
    expect(screen.getByRole("link", { name: "Ver vacinas atrasadas" }).getAttribute("href")).toBe(
      "/vacinas?status=atrasada",
    );
    expect(screen.getByText("Faturamento hoje")).toBeTruthy();
    expect(screen.getByText(/120,00/)).toBeTruthy();
    expect(screen.getByText("Faturamento no mês")).toBeTruthy();
    expect(screen.getByText(/1\.450,50/)).toBeTruthy();
    expect(screen.getByText("Produtos em estoque baixo")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ir para vendas" }).getAttribute("href")).toBe("/vendas");
    expect(screen.getByRole("link", { name: "Ir para relatórios" }).getAttribute("href")).toBe("/relatorios");
    expect(screen.getByRole("link", { name: "Ir para estoque" }).getAttribute("href")).toBe("/estoque");
  });

  it("oculta faturamento e estoque baixo quando o usuário é recepcionista e exibe estados vazios (PNL-08, PNL-09)", async () => {
    mockGetResumoPainel.mockResolvedValue({
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
      dono: null,
    });

    render(await PainelPage());

    expect(screen.getByRole("heading", { name: "Painel" })).toBeTruthy();
    expect(screen.getByText("Nenhum atendimento previsto para hoje.")).toBeTruthy();
    expect(screen.getByText("Nenhuma vacina atrasada.")).toBeTruthy();
    expect(screen.queryByText("Faturamento hoje")).toBeNull();
    expect(screen.queryByText("Faturamento no mês")).toBeNull();
    expect(screen.queryByText("Produtos em estoque baixo")).toBeNull();
  });
});
