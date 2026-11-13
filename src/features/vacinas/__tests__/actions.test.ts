import { describe, it, expect, vi, beforeEach } from "vitest";
import { registrarVacina } from "../actions";
import { getVacinasPorPet } from "../queries";

const single = vi.fn();
const select = vi.fn(() => ({ single }));
const insert = vi.fn(() => ({ select }));

let result: { data: unknown };
function makeQueryBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return builder;
}

const from = vi.fn((table: string) => {
  if (table === "vacinas") return { insert, ...makeQueryBuilder() };
  throw new Error(`tabela inesperada: ${table}`);
});

vi.mock("../../auth/queries", () => ({ exigirSessao: vi.fn(async () => ({ role: "dono" })) }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from })),
}));

describe("registrarVacina", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    single.mockResolvedValue({ data: { id: 1 }, error: null });
  });

  it("salva com data de aplicação e retorno previsto válidos", async () => {
    const result = await registrarVacina({
      petId: 1,
      nome: "V10",
      dataAplicacao: "2026-09-01",
      dataRetornoPrevista: "2027-09-01",
    });

    expect(result.error).toBeUndefined();
    expect(insert).toHaveBeenCalledWith({
      pet_id: 1,
      nome: "V10",
      data_aplicacao: "2026-09-01",
      data_retorno_prevista: "2027-09-01",
    });
  });

  it("rejeita retorno anterior à aplicação sem chamar o banco", async () => {
    const result = await registrarVacina({
      petId: 1,
      nome: "V10",
      dataAplicacao: "2026-09-01",
      dataRetornoPrevista: "2026-08-01",
    });

    expect(result.error).toBe("A data de retorno não pode ser anterior à data de aplicação.");
    expect(insert).not.toHaveBeenCalled();
  });
});

describe("getVacinasPorPet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna todas as vacinas do pet, ordenadas por data", async () => {
    result = {
      data: [
        { id: 2, pet_id: 1, nome: "Antirrábica", data_aplicacao: "2026-08-01", data_retorno_prevista: "2027-08-01" },
        { id: 1, pet_id: 1, nome: "V10", data_aplicacao: "2026-01-01", data_retorno_prevista: "2027-01-01" },
      ],
    };

    const vacinas = await getVacinasPorPet(1);

    expect(vacinas).toEqual([
      { id: 2, petId: 1, nome: "Antirrábica", dataAplicacao: "2026-08-01", dataRetornoPrevista: "2027-08-01" },
      { id: 1, petId: 1, nome: "V10", dataAplicacao: "2026-01-01", dataRetornoPrevista: "2027-01-01" },
    ]);
  });
});
