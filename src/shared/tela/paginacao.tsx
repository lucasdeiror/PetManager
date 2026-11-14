import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const POR_PAGINA = 10;

/** Recorta a lista já filtrada; página fora do intervalo cai no limite mais próximo. */
export function paginar<T>(itens: T[], pagina: unknown, porPagina = POR_PAGINA) {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const n = Number.parseInt(String(pagina ?? "1"), 10);
  const atual = Math.min(Math.max(Number.isFinite(n) ? n : 1, 1), totalPaginas);
  const inicio = (atual - 1) * porPagina;
  return {
    visiveis: itens.slice(inicio, inicio + porPagina),
    atual,
    totalPaginas,
    de: itens.length === 0 ? 0 : inicio + 1,
    ate: Math.min(inicio + porPagina, itens.length),
    total: itens.length,
  };
}

/** Rodapé de paginação por link (`?pagina=N`), mantendo os outros parâmetros da URL. */
export function Paginacao({
  pagina,
  params,
}: {
  pagina: ReturnType<typeof paginar>;
  params: Record<string, string | undefined>;
}) {
  if (pagina.totalPaginas <= 1) return null;

  const href = (n: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "pagina") q.set(k, v);
    q.set("pagina", String(n));
    return `?${q}`;
  };
  const botao = "rounded-lg border-2 border-slate-200 bg-white p-2 text-slate-800";

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between border-t-2 border-slate-100 px-4 py-3 text-sm font-bold text-slate-600"
    >
      <span>
        {pagina.de}–{pagina.ate} de {pagina.total}
      </span>
      <div className="flex gap-2">
        {pagina.atual > 1 ? (
          <Link href={href(pagina.atual - 1)} aria-label="Página anterior" className={botao}>
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
        ) : (
          <span aria-hidden className={`${botao} opacity-40`}>
            <ChevronLeft className="size-4" />
          </span>
        )}
        <span className="flex items-center px-2 text-slate-900">
          {pagina.atual} / {pagina.totalPaginas}
        </span>
        {pagina.atual < pagina.totalPaginas ? (
          <Link href={href(pagina.atual + 1)} aria-label="Próxima página" className={botao}>
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <span aria-hidden className={`${botao} opacity-40`}>
            <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
