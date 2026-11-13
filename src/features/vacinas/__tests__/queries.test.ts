import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getVacinas } from "../queries";

let result: { data: unknown };

function makeBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return builder;
}

const from = vi.fn(() => makeBuilder());

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

const ROWS = [
  {
    id: 1,
    pet_id: 1,
    nome: "V10",
    data_aplicacao: "2026-01-01",
    data_retorno_prevista: "2026-09-01", // no passado em relação a "hoje" fixado
    pets: { nome: "Rex" },
  },
  {
    id: 2,
    pet_id: 2,
    nome: "Antirrábica",
    data_aplicacao: "2026-08-01",
    data_retorno_prevista: "2027-08-01", // no futuro
    pets: { nome: "Bidu" },
  },
];

describe("getVacinas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-20T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("busca vazia calcula o status de cada vacina", async () => {
    result = { data: ROWS };

    const vacinas = await getVacinas();

    expect(vacinas).toEqual([
      {
        id: 1,
        petId: 1,
        nome: "V10",
        dataAplicacao: "2026-01-01",
        dataRetornoPrevista: "2026-09-01",
        petNome: "Rex",
        status: "atrasada",
      },
      {
        id: 2,
        petId: 2,
        nome: "Antirrábica",
        dataAplicacao: "2026-08-01",
        dataRetornoPrevista: "2027-08-01",
        petNome: "Bidu",
        status: "em-dia",
      },
    ]);
  });

  it("combina busca por nome da vacina com filtro de status", async () => {
    result = { data: ROWS };

    const vacinas = await getVacinas({ busca: "v10", status: "atrasada" });

    expect(vacinas).toEqual([
      {
        id: 1,
        petId: 1,
        nome: "V10",
        dataAplicacao: "2026-01-01",
        dataRetornoPrevista: "2026-09-01",
        petNome: "Rex",
        status: "atrasada",
      },
    ]);
  });

  it("busca também encontra por nome do pet", async () => {
    result = { data: ROWS };

    const vacinas = await getVacinas({ busca: "bidu" });

    expect(vacinas.map((v) => v.id)).toEqual([2]);
  });
});

describe("getVacinas: hoje no fuso de Brasília (DAT-01)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("às 22:30 de Brasília, retorno previsto para hoje ainda está em dia", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T01:30:00Z")); // 2026-11-12 22:30 em Brasília
    result = { data: [{ ...ROWS[0], data_retorno_prevista: "2026-11-12" }] };

    const [vacina] = await getVacinas();

    expect(vacina.status).toBe("em-dia");
  });
});
