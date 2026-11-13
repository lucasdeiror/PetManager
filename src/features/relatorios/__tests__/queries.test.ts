import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRelatorioMensal } from "../queries";
import { getCurrentUserRole } from "../../auth/queries";
import { getVendas } from "../../vendas/queries";

vi.mock("../../auth/queries", () => ({
  getCurrentUserRole: vi.fn(),
}));

vi.mock("../../vendas/queries", () => ({
  getVendas: vi.fn(),
}));

let counts: number[];
let callIndex: number;

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.gte = vi.fn(chain);
  builder.lt = vi.fn(chain);
  builder.then = (resolve: (value: unknown) => unknown) => {
    const count = counts[callIndex];
    callIndex += 1;
    return resolve({ count });
  };
  return builder;
}

let builders: Record<string, ReturnType<typeof vi.fn>>[] = [];
const from = vi.fn(() => {
  const b = makeBuilder() as Record<string, ReturnType<typeof vi.fn>>;
  builders.push(b);
  return b;
});

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

describe("getRelatorioMensal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callIndex = 0;
  });

  it("retorna relatório zerado pra quem não é dono, sem consultar o banco", async () => {
    vi.mocked(getCurrentUserRole).mockResolvedValue("recepcionista");

    const relatorio = await getRelatorioMensal(2026, 9);

    expect(relatorio).toEqual({
      ano: 2026,
      mes: 9,
      agendamentosConcluidos: 0,
      agendamentosCancelados: 0,
      faturamentoTotal: 0,
      vendas: [],
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("agrega contagens separadas e faturamento único a partir de vendas", async () => {
    vi.mocked(getCurrentUserRole).mockResolvedValue("dono");
    counts = [2, 1]; // concluidos, cancelados
    vi.mocked(getVendas).mockResolvedValue([
      { id: 1, tipo: "servico", itemNome: "Banho", quantidade: 1, valorTotal: 40, criadoEm: "2026-09-05" },
      { id: 2, tipo: "produto", itemNome: "Ração", quantidade: 2, valorTotal: 50, criadoEm: "2026-09-10" },
    ]);

    const relatorio = await getRelatorioMensal(2026, 9);

    expect(relatorio.agendamentosConcluidos).toBe(2);
    expect(relatorio.agendamentosCancelados).toBe(1);
    expect(relatorio.faturamentoTotal).toBe(90);
    expect(relatorio.vendas).toHaveLength(2);
    expect(getVendas).toHaveBeenCalledWith({ mes: "2026-09" });
  });

  it.each([
    [11, "2026-11-01T00:00:00-03:00", "2026-12-01T00:00:00-03:00"],
    [12, "2026-12-01T00:00:00-03:00", "2027-01-01T00:00:00-03:00"],
  ])("mês %i conta agendamentos entre os limites de Brasília (FUS-06)", async (mes, inicio, fim) => {
    vi.mocked(getCurrentUserRole).mockResolvedValue("dono");
    vi.mocked(getVendas).mockResolvedValue([]);
    counts = [0, 0];
    builders = [];

    await getRelatorioMensal(2026, mes);

    expect(builders).toHaveLength(2);
    for (const b of builders) {
      expect(b.gte).toHaveBeenCalledWith("data_hora", inicio);
      expect(b.lt).toHaveBeenCalledWith("data_hora", fim);
    }
  });

  it("mês sem nenhum dado retorna zero em todos os campos, sem erro", async () => {
    vi.mocked(getCurrentUserRole).mockResolvedValue("dono");
    counts = [0, 0];
    vi.mocked(getVendas).mockResolvedValue([]);

    const relatorio = await getRelatorioMensal(2026, 1);

    expect(relatorio.agendamentosConcluidos).toBe(0);
    expect(relatorio.agendamentosCancelados).toBe(0);
    expect(relatorio.faturamentoTotal).toBe(0);
    expect(relatorio.vendas).toEqual([]);
  });
});
