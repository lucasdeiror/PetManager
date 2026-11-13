import { Suspense } from "react";
import { getAgendamentosFiltrados } from "../../../../features/agenda/queries";
import { SearchFilterBar } from "../../../../shared/filters/search-filter-bar";
import { dataHoraSP } from "../../../../shared/data/fuso";

const STATUS = ["agendado", "concluido", "cancelado"] as const;
const STATUS_LABELS = { agendado: "Agendado", concluido: "Concluído", cancelado: "Cancelado" };

export default async function AgendaListaPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; filtro?: string }>;
}) {
  const { busca, filtro } = await searchParams;
  const status = STATUS.includes(filtro as (typeof STATUS)[number])
    ? (filtro as (typeof STATUS)[number])
    : undefined;

  const agendamentos = await getAgendamentosFiltrados({ busca, status });

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-black">Todos os agendamentos</h1>
      <p className="mt-2 text-sm text-slate-600">
        Busque por pet ou tutor, e filtre por status.
      </p>

      <div className="mt-4">
        <Suspense fallback={null}>
          <SearchFilterBar
            atributos={STATUS}
            atributoLabels={STATUS_LABELS}
            placeholder="Buscar por pet ou tutor..."
            filtroLabel="Todos os status"
          />
        </Suspense>
      </div>

      <ul className="mt-4 grid gap-2">
        {agendamentos.map((a) => (
          <li key={a.id} className="rounded-lg border p-3">
            <p className="font-bold">
              {a.petNome} — {a.tutorNome}
            </p>
            <p className="text-sm text-slate-600">
              {dataHoraSP(a.dataHora)} · {STATUS_LABELS[a.status]}
            </p>
          </li>
        ))}
        {agendamentos.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum resultado encontrado.</p>
        )}
      </ul>
    </div>
  );
}
