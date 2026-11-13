import { createClient } from "../../shared/supabase/server";
import { instanteSP } from "../../shared/data/fuso";

export interface AgendamentoDoDia {
  id: number;
  petId: number;
  petNome: string;
  dataHora: string;
  status: "agendado" | "concluido" | "cancelado";
  servicoNomes: string[];
}

interface RowPet {
  nome: string;
}

interface RowAgendamentoServico {
  servicos: { nome: string } | null;
}

interface AgendamentoRow {
  id: number;
  pet_id: number;
  data_hora: string;
  status: "agendado" | "concluido" | "cancelado";
  pets: RowPet | null;
  agendamento_servicos: RowAgendamentoServico[] | null;
}

/**
 * Retorna todos os agendamentos de um dia (AGD-02), incluindo
 * cancelados — a exibição visual diferenciada (cor/estilo) é
 * responsabilidade do componente de calendário (T32), não desta
 * query.
 */
export async function getAgendamentosPorDia(data: string): Promise<AgendamentoDoDia[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("agendamentos")
    .select(
      "id, pet_id, data_hora, status, pets ( nome ), agendamento_servicos ( servicos ( nome ) )",
    )
    .gte("data_hora", instanteSP(`${data}T00:00:00`))
    .lte("data_hora", instanteSP(`${data}T23:59:59.999`))
    .order("data_hora");

  return ((rows ?? []) as unknown as AgendamentoRow[]).map((row) => ({
    id: row.id,
    petId: row.pet_id,
    petNome: row.pets?.nome ?? "Pet removido",
    dataHora: row.data_hora,
    status: row.status,
    servicoNomes: (row.agendamento_servicos ?? [])
      .map((s) => s.servicos?.nome)
      .filter((nome): nome is string => Boolean(nome)),
  }));
}

export interface AgendamentoFiltrado {
  id: number;
  petNome: string;
  tutorNome: string;
  dataHora: string;
  status: "agendado" | "concluido" | "cancelado";
}

interface RowTutor {
  nome: string;
}

interface RowPetComTutor {
  nome: string;
  tutores: RowTutor | null;
}

interface AgendamentoFiltradoRow {
  id: number;
  data_hora: string;
  status: "agendado" | "concluido" | "cancelado";
  pets: RowPetComTutor | null;
}

interface GetAgendamentosFiltrado {
  busca?: string;
  status?: "agendado" | "concluido" | "cancelado";
}

/**
 * Lista de agendamentos pra tela de listagem (distinta da visão diária
 * do `getAgendamentosPorDia`), com busca por pet/tutor e filtro por
 * status (AGD-09, FILT-01, FILT-02). `status` filtra via SQL; `busca`
 * roda em memória sobre o nome já resolvido — mesmo padrão de
 * `getVendas` (T23), já que o nome do tutor vem de um join em duas
 * camadas (`pets` → `tutores`).
 */
export async function getAgendamentosFiltrados(
  filtro: GetAgendamentosFiltrado = {},
): Promise<AgendamentoFiltrado[]> {
  const supabase = await createClient();

  let query = supabase
    .from("agendamentos")
    .select("id, data_hora, status, pets ( nome, tutores ( nome ) )")
    .order("data_hora", { ascending: false });

  if (filtro.status) {
    query = query.eq("status", filtro.status);
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as AgendamentoFiltradoRow[];

  const agendamentos: AgendamentoFiltrado[] = rows.map((row) => ({
    id: row.id,
    petNome: row.pets?.nome ?? "Pet removido",
    tutorNome: row.pets?.tutores?.nome ?? "Tutor removido",
    dataHora: row.data_hora,
    status: row.status,
  }));

  if (!filtro.busca) {
    return agendamentos;
  }

  const termo = filtro.busca.toLowerCase();
  return agendamentos.filter(
    (a) => a.petNome.toLowerCase().includes(termo) || a.tutorNome.toLowerCase().includes(termo),
  );
}
