import { Suspense } from "react";
import Link from "next/link";
import { getAgendamentosFiltrados } from "../../../../features/agenda/queries";
import { SearchFilterBar } from "../../../../shared/filters/search-filter-bar";
import { dataHoraSP } from "../../../../shared/data/fuso";
import {
  PaginaContainer,
  TituloPagina,
  botaoSecundario,
  cartao,
  itemLista,
  textoMeta,
  textoPrimario,
} from "../../../../shared/tela/titulo-pagina";
import { Paginacao, paginar } from "../../../../shared/tela/paginacao";

const STATUS = ["agendado", "concluido", "cancelado"] as const;
const STATUS_LABELS = { agendado: "Agendado", concluido: "Concluído", cancelado: "Cancelado" };

export default async function AgendaListaPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; filtro?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const { busca, filtro } = params;
  const status = STATUS.includes(filtro as (typeof STATUS)[number])
    ? (filtro as (typeof STATUS)[number])
    : undefined;

  const pagina = paginar(await getAgendamentosFiltrados({ busca, status }), params.pagina);

  return (
    <PaginaContainer>
      <TituloPagina titulo="Todos os agendamentos" texto="Busque por pet ou tutor e filtre por status">
        <Link href="/agenda" className={botaoSecundario}>
          Voltar para a agenda
        </Link>
      </TituloPagina>

      <Suspense fallback={null}>
        <SearchFilterBar
          atributos={STATUS}
          atributoLabels={STATUS_LABELS}
          placeholder="Buscar por pet ou tutor..."
          filtroLabel="Todos os status"
        />
      </Suspense>

      <section className={`${cartao} overflow-hidden`}>
        <ul className="divide-y-2 divide-slate-100">
          {pagina.visiveis.map((a) => (
            <li key={a.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${itemLista}`}>
              <div className="min-w-40 flex-1">
                <p className={textoPrimario}>
                  {a.petNome} <span className="font-medium text-slate-600">· {a.tutorNome}</span>
                </p>
                <p className={`${textoMeta} tabular-nums`}>{dataHoraSP(a.dataHora)}</p>
              </div>
              <span className="text-sm font-semibold text-slate-700">{STATUS_LABELS[a.status]}</span>
            </li>
          ))}
          {pagina.total === 0 && (
            <li className={`${itemLista} ${textoMeta}`}>Nenhum resultado encontrado.</li>
          )}
        </ul>
        <Paginacao pagina={pagina} params={params} />
      </section>
    </PaginaContainer>
  );
}
