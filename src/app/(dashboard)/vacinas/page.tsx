import { Suspense } from "react";
import { getPets } from "../../../features/pets/queries";
import { getVacinas, getVacinasPorPet } from "../../../features/vacinas/queries";
import { SearchFilterBar } from "../../../shared/filters/search-filter-bar";
import { RegistrarVacinaForm } from "./registrar-vacina-form";
import { dataSimples } from "../../../shared/data/fuso";

const STATUS = ["em-dia", "atrasada"] as const;
const STATUS_LABELS = { "em-dia": "Em dia", atrasada: "Atrasada" };

export default async function VacinasPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; filtro?: string; pet?: string }>;
}) {
  const { busca, filtro, pet } = await searchParams;
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

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-black">Vacinas</h1>

      <RegistrarVacinaForm pets={pets} />

      {petId && (
        <section className="mt-6 rounded-lg border-2 border-orange-600 p-4">
          <h2 className="text-lg font-bold">
            Ficha de {petSelecionado?.nome ?? "pet"}
          </h2>
          <ul className="mt-2 grid gap-2">
            {(historicoPet ?? []).map((v) => (
              <li key={v.id} className="rounded-md border p-2 text-sm">
                <span className="font-bold">{v.nome}</span> — aplicada em{" "}
                {dataSimples(v.dataAplicacao)}, retorno previsto{" "}
                {dataSimples(v.dataRetornoPrevista)}
              </li>
            ))}
            {(historicoPet ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Nenhuma vacina registrada para este pet.</p>
            )}
          </ul>
        </section>
      )}

      <h2 className="mt-6 text-lg font-bold">Todas as vacinas</h2>
      <div className="mt-2">
        <Suspense fallback={null}>
          <SearchFilterBar
            atributos={STATUS}
            atributoLabels={STATUS_LABELS}
            placeholder="Buscar por pet ou nome da vacina..."
            filtroLabel="Todos os status"
          />
        </Suspense>
      </div>

      <ul className="mt-4 grid gap-2">
        {vacinas.map((v) => (
          <li key={v.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-bold">
                {v.nome} — {v.petNome}
              </p>
              <p className="text-sm text-slate-600">
                Retorno previsto: {dataSimples(v.dataRetornoPrevista)} ·{" "}
                {STATUS_LABELS[v.status]}
              </p>
            </div>
            <a href={`/vacinas?pet=${v.petId}`} className="text-sm font-bold text-orange-700 underline">
              Ver ficha
            </a>
          </li>
        ))}
        {vacinas.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum resultado encontrado.</p>
        )}
      </ul>
    </div>
  );
}
