import { Suspense } from "react";
import Link from "next/link";
import { getPets } from "../../../features/pets/queries";
import { getVacinas, getVacinasPorPet } from "../../../features/vacinas/queries";
import { SearchFilterBar } from "../../../shared/filters/search-filter-bar";
import { RegistrarVacinaForm } from "./registrar-vacina-form";
import { dataSimples } from "../../../shared/data/fuso";
import { TituloPagina, cartao } from "../../../shared/tela/titulo-pagina";
import { Paginacao, paginar } from "../../../shared/tela/paginacao";

const STATUS = ["em-dia", "atrasada"] as const;
const STATUS_LABELS = { "em-dia": "Em dia", atrasada: "Atrasada" };
const STATUS_CLASSE = {
  "em-dia": "border-emerald-200 bg-emerald-50 text-emerald-800",
  atrasada: "border-red-200 bg-red-50 text-red-800",
};

export default async function VacinasPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; filtro?: string; pet?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const { busca, filtro, pet } = params;
  const status = STATUS.includes(filtro as (typeof STATUS)[number])
    ? (filtro as (typeof STATUS)[number])
    : undefined;
  const petId = pet ? Number(pet) : null;

  const [vacinas, pets, historicoPet] = await Promise.all([
    getVacinas({ busca, status }),
    getPets(),
    petId ? getVacinasPorPet(petId) : Promise.resolve(null),
  ]);

  const petSelecionado = petId ? pets.find((p) => p.id === petId) : null;
  const pagina = paginar(vacinas, params.pagina);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
      <TituloPagina titulo="Vacinas" texto="Doses aplicadas e retornos previstos de cada pet" />

      <section className={`${cartao} p-4`}>
        <h2 className="text-lg font-black">Registrar vacina</h2>
        <RegistrarVacinaForm pets={pets} />
      </section>

      {petId && (
        <section className="rounded-2xl border-2 border-orange-300 bg-orange-50/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black">Ficha de {petSelecionado?.nome ?? "pet"}</h2>
            <Link href="/vacinas" className="text-sm font-bold text-orange-700 underline">
              Fechar ficha
            </Link>
          </div>
          <ul className="mt-3 grid gap-2">
            {(historicoPet ?? []).map((v) => (
              <li key={v.id} className="rounded-xl border-2 border-slate-200 bg-white p-3 text-sm">
                <span className="font-black">{v.nome}</span>
                <span className="font-semibold text-slate-600">
                  {" "}
                  · aplicada em {dataSimples(v.dataAplicacao)} · retorno previsto{" "}
                  {dataSimples(v.dataRetornoPrevista)}
                </span>
              </li>
            ))}
            {(historicoPet ?? []).length === 0 && (
              <p className="text-sm font-semibold text-slate-500">
                Nenhuma vacina registrada para este pet.
              </p>
            )}
          </ul>
        </section>
      )}

      <Suspense fallback={null}>
        <SearchFilterBar
          atributos={STATUS}
          atributoLabels={STATUS_LABELS}
          placeholder="Buscar por pet ou nome da vacina..."
          filtroLabel="Todos os status"
        />
      </Suspense>

      <section className={`${cartao} overflow-hidden`}>
        <h2 className="border-b-2 border-slate-100 px-4 py-3 text-lg font-black sm:px-5">
          Todas as vacinas
        </h2>
        <ul className="divide-y-2 divide-slate-100">
          {pagina.visiveis.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 sm:px-5">
              <div className="min-w-40 flex-1">
                <p className="font-black text-stone-950">
                  {v.nome} <span className="font-medium text-slate-600">· {v.petNome}</span>
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  Retorno previsto: {dataSimples(v.dataRetornoPrevista)}
                </p>
              </div>
              <span
                className={`rounded-full border-2 px-2.5 py-0.5 text-xs font-black ${STATUS_CLASSE[v.status]}`}
              >
                {STATUS_LABELS[v.status]}
              </span>
              <Link
                href={`/vacinas?pet=${v.petId}`}
                className="text-sm font-bold text-orange-700 underline"
              >
                Ver ficha
              </Link>
            </li>
          ))}
          {pagina.total === 0 && (
            <li className="p-5 text-sm font-semibold text-slate-500">Nenhum resultado encontrado.</li>
          )}
        </ul>
        <Paginacao pagina={pagina} params={params} />
      </section>
    </div>
  );
}
