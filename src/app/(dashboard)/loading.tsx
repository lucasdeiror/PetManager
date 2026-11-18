import { PaginaContainer, cartaoForm } from "../../shared/tela/titulo-pagina";

export default function DashboardLoading() {
  return (
    <PaginaContainer aria-busy="true" aria-label="Carregando página" className="animate-pulse">
      <div className="border-b border-slate-200/80 pb-5">
        <div className="h-3 w-40 rounded bg-orange-200/70" />
        <div className="mt-2 h-8 w-56 rounded-lg bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`${cartaoForm} h-24`} />
        <div className={`${cartaoForm} h-24`} />
        <div className={`${cartaoForm} h-24`} />
      </div>

      <div className={`${cartaoForm} h-64`} />
    </PaginaContainer>
  );
}
