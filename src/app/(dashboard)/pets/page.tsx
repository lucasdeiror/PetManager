import { Suspense } from "react";
import { PawPrint, UserRound } from "lucide-react";
import { getPets, getTutores } from "../../../features/pets/queries";
import { SearchFilterBar } from "../../../shared/filters/search-filter-bar";
import { TituloPagina, cartao } from "../../../shared/tela/titulo-pagina";
import { Paginacao, paginar } from "../../../shared/tela/paginacao";
import { CriarPetForm } from "./criar-pet-form";
import { CriarTutorForm } from "./criar-tutor-form";

const PORTE = { pequeno: "Pequeno", medio: "Médio", grande: "Grande" } as const;

export default async function PetsPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; pagina_tutores?: string; pagina_pets?: string }>;
}) {
  const params = await searchParams;
  const { busca } = params;
  const [tutoresFiltrados, pets, todosTutores] = await Promise.all([
    getTutores(busca),
    getPets(busca),
    getTutores(),
  ]);
  const tutores = paginar(tutoresFiltrados, params.pagina_tutores);
  const petsPagina = paginar(pets, params.pagina_pets);
  const nomeTutor = new Map(todosTutores.map((t) => [t.id, t.nome]));

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
      <TituloPagina titulo="Clientes e pets" texto="Cada pet fica sempre ligado ao seu tutor" />

      <Suspense fallback={null}>
        <SearchFilterBar atributos={[]} atributoLabels={{}} placeholder="Buscar por nome ou telefone..." />
      </Suspense>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <section className={`${cartao} overflow-hidden`}>
          <div className="border-b-2 border-slate-100 p-4 sm:px-5">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <UserRound className="size-5 text-orange-700" aria-hidden /> Tutores
            </h2>
            <CriarTutorForm />
          </div>
          <ul className="divide-y-2 divide-slate-100">
            {tutores.visiveis.map((t) => (
              <li key={t.id} className="p-4 sm:px-5">
                <p className="font-black text-stone-950">{t.nome}</p>
                <p className="text-sm font-semibold text-slate-600">{t.telefone}</p>
              </li>
            ))}
            {tutores.total === 0 && (
              <li className="p-5 text-sm font-semibold text-slate-500">Nenhum resultado encontrado.</li>
            )}
          </ul>
          <Paginacao pagina={tutores} params={params} chave="pagina_tutores" />
        </section>

        <section className={`${cartao} overflow-hidden`}>
          <div className="border-b-2 border-slate-100 p-4 sm:px-5">
            <h2 className="flex items-center gap-2 text-lg font-black">
              <PawPrint className="size-5 text-orange-700" aria-hidden /> Pets
            </h2>
            <CriarPetForm tutores={todosTutores} />
          </div>
          <ul className="divide-y-2 divide-slate-100">
            {petsPagina.visiveis.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-4 sm:px-5">
                <div>
                  <p className="font-black text-stone-950">{p.nome}</p>
                  <p className="text-sm font-semibold text-slate-600">
                    {p.raca} · {nomeTutor.get(p.tutorId) ?? "Tutor removido"}
                  </p>
                </div>
                <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-black text-slate-700">
                  {PORTE[p.porte]}
                </span>
              </li>
            ))}
            {petsPagina.total === 0 && (
              <li className="p-5 text-sm font-semibold text-slate-500">Nenhum resultado encontrado.</li>
            )}
          </ul>
          <Paginacao pagina={petsPagina} params={params} chave="pagina_pets" />
        </section>
      </div>
    </div>
  );
}
