import { createClient } from "../../shared/supabase/server";

export interface Venda {
  id: number;
  tipo: "servico" | "produto";
  itemNome: string;
  quantidade: number;
  valorTotal: number;
  criadoEm: string;
}

interface RowProduto {
  nome: string;
}

interface RowServico {
  nome: string;
}

interface RowAgendamentoServico {
  servicos: RowServico | null;
}

interface RowAgendamento {
  agendamento_servicos: RowAgendamentoServico[] | null;
}

interface VendaRow {
  id: number;
  tipo: "servico" | "produto";
  quantidade: number;
  valor_total: number | string;
  criado_em: string;
  produtos: RowProduto | null;
  agendamentos: RowAgendamento | null;
}

interface GetVendasFiltro {
  busca?: string;
  tipo?: "servico" | "produto";
  mes?: string; // "YYYY-MM"
}

function nomeDoItem(row: VendaRow): string {
  if (row.produtos?.nome) {
    return row.produtos.nome;
  }
  const nomesServicos = row.agendamentos?.agendamento_servicos
    ?.map((s) => s.servicos?.nome)
    .filter((nome): nome is string => Boolean(nome));

  return nomesServicos && nomesServicos.length > 0 ? nomesServicos.join(" + ") : "Item removido";
}

function proximoMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  return m === 12 ? `${ano + 1}-01-01` : `${ano}-${String(m + 1).padStart(2, "0")}-01`;
}

/**
 * Lista vendas (produto + serviço), mais recente primeiro (VEN-05).
 * Filtro por `tipo` e `mes` roda no banco; `busca` roda em memória
 * sobre o nome já resolvido do item — o nome de uma venda de serviço
 * vem de um join em duas camadas (agendamento -> agendamento_servicos
 * -> servicos) que não dá pra combinar num `ilike` simples no Postgres
 * sem uma view dedicada, e o volume por petshop é pequeno o bastante
 * pra isso não ser um problema de performance.
 */
export async function getVendas(filtro: GetVendasFiltro = {}): Promise<Venda[]> {
  const supabase = await createClient();

  let query = supabase
    .from("vendas")
    .select(
      "id, tipo, quantidade, valor_total, criado_em, produtos ( nome ), agendamentos ( agendamento_servicos ( servicos ( nome ) ) )",
    )
    .is("estornada_em", null)
    .order("criado_em", { ascending: false });

  if (filtro.tipo) {
    query = query.eq("tipo", filtro.tipo);
  }
  if (filtro.mes) {
    query = query.gte("criado_em", `${filtro.mes}-01`).lt("criado_em", proximoMes(filtro.mes));
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as VendaRow[];

  const vendas: Venda[] = rows.map((row) => ({
    id: row.id,
    tipo: row.tipo,
    itemNome: nomeDoItem(row),
    quantidade: row.quantidade,
    valorTotal: Number(row.valor_total),
    criadoEm: row.criado_em,
  }));

  if (!filtro.busca) {
    return vendas;
  }

  const termo = filtro.busca.toLowerCase();
  return vendas.filter((v) => v.itemNome.toLowerCase().includes(termo));
}
