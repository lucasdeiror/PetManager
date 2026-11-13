import { hojeEmSaoPaulo } from "../../shared/data/hoje";
import { createClient } from "../../shared/supabase/server";

export interface Vacina {
  id: number;
  petId: number;
  nome: string;
  dataAplicacao: string;
  dataRetornoPrevista: string;
}

export interface VacinaComStatus extends Vacina {
  petNome: string;
  status: "em-dia" | "atrasada";
}

/**
 * Histórico completo de vacinas de um pet (VAC-02), ordenado por data
 * de aplicação (mais recente primeiro). Sem limite de retenção — todo
 * histórico fica sempre disponível.
 */
export async function getVacinasPorPet(petId: number): Promise<Vacina[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("vacinas")
    .select("id, pet_id, nome, data_aplicacao, data_retorno_prevista")
    .eq("pet_id", petId)
    .order("data_aplicacao", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    petId: row.pet_id,
    nome: row.nome,
    dataAplicacao: row.data_aplicacao,
    dataRetornoPrevista: row.data_retorno_prevista,
  }));
}

interface RowPet {
  nome: string;
}

interface VacinaRow {
  id: number;
  pet_id: number;
  nome: string;
  data_aplicacao: string;
  data_retorno_prevista: string;
  pets: RowPet | null;
}

interface GetVacinasFiltro {
  busca?: string;
  status?: "em-dia" | "atrasada";
}

/**
 * Listagem geral de vacinas (distinta do histórico por pet acima),
 * com busca por pet/nome da vacina e filtro por status (FILT-01,
 * FILT-02). `status` não é uma coluna — é derivado comparando
 * `dataRetornoPrevista` com hoje ("atrasada" = já passou), então tanto
 * `status` quanto `busca` filtram em memória.
 */
export async function getVacinas(filtro: GetVacinasFiltro = {}): Promise<VacinaComStatus[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("vacinas")
    .select("id, pet_id, nome, data_aplicacao, data_retorno_prevista, pets ( nome )")
    .order("data_retorno_prevista", { ascending: true });

  const hoje = hojeEmSaoPaulo();
  const rows = (data ?? []) as unknown as VacinaRow[];

  let vacinas: VacinaComStatus[] = rows.map((row) => ({
    id: row.id,
    petId: row.pet_id,
    nome: row.nome,
    dataAplicacao: row.data_aplicacao,
    dataRetornoPrevista: row.data_retorno_prevista,
    petNome: row.pets?.nome ?? "Pet removido",
    status: row.data_retorno_prevista < hoje ? "atrasada" : "em-dia",
  }));

  if (filtro.status) {
    vacinas = vacinas.filter((v) => v.status === filtro.status);
  }

  if (filtro.busca) {
    const termo = filtro.busca.toLowerCase();
    vacinas = vacinas.filter(
      (v) => v.nome.toLowerCase().includes(termo) || v.petNome.toLowerCase().includes(termo),
    );
  }

  return vacinas;
}
