import { cartao } from "../../shared/tela/titulo-pagina";

export default function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando página"
      className="mx-auto grid max-w-6xl animate-pulse gap-6 p-4 sm:p-6 lg:p-8"
    >
      <div className="border-b border-slate-200/80 pb-5">
        <div className="h-3 w-40 rounded bg-orange-200/70" />
        <div className="mt-2 h-8 w-56 rounded-lg bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${cartao} h-24 p-5`} />
        <div className={`${cartao} h-24 p-5`} />
        <div className={`${cartao} h-24 p-5`} />
      </div>

      <div className={`${cartao} h-64 p-5`} />
    </div>
  );
}
