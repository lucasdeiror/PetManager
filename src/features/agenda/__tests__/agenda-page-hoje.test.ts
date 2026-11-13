import { afterEach, describe, expect, it, vi } from "vitest";

const getAgendamentosPorDia = vi.fn(async () => []);

vi.mock("../queries", () => ({ getAgendamentosPorDia }));
vi.mock("../../pets/queries", () => ({ getPets: vi.fn(async () => []) }));
vi.mock("../../servicos/queries", () => ({ getServicosParaAgendamento: vi.fn(async () => []) }));

describe("página da agenda: dia padrão (DAT-01)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("às 22:30 de Brasília, sem ?data, mostra o dia de Brasília e não o de UTC", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T01:30:00Z")); // 2026-11-12 22:30 em Brasília
    const { default: AgendaPage } = await import("../../../app/(dashboard)/agenda/page");

    await AgendaPage({ searchParams: Promise.resolve({}) });

    expect(getAgendamentosPorDia).toHaveBeenCalledWith("2026-11-12");
  });
});
