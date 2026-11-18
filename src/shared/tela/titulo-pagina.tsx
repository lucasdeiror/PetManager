import { cn } from "../../lib/utils";

/** Escala tipográfica única das telas internas (DSG-07..DSG-09). */
export const tituloSecao = "text-base font-bold tracking-tight text-stone-950";
export const textoPrimario = "text-sm font-semibold text-stone-950";
export const textoMeta = "text-xs font-medium text-slate-600 sm:text-sm";
export const valorTabela = "text-sm font-bold text-stone-950 tabular-nums";

/** Escala única de espaçamento e superfícies das telas internas (DSG-10, DSG-11). */
export const paginaContainer = "mx-auto grid w-full max-w-6xl gap-6 p-4 sm:p-6 lg:p-8";
export const cartao = "rounded-2xl border-2 border-slate-200 bg-white";
export const cartaoForm = `${cartao} p-4 sm:p-5`;
export const cabecalhoLista =
  "flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-100 px-4 py-3.5 sm:px-5";
export const itemLista = "px-4 py-3.5 sm:px-5";

/** Controles e alvos de toque com no mínimo 44px (h-11 / min-h-11) (DSG-12). */
export const botaoPrimario =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-600 px-4 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-orange-700 active:scale-[0.98] disabled:opacity-60";
export const botaoSecundario =
  "inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 transition-[border-color,transform] duration-150 ease-out hover:border-orange-500 active:scale-[0.98] disabled:opacity-60";
export const campoInput =
  "h-11 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold text-stone-950 outline-none focus:border-orange-500";

/** Moldura padrão de página interna do dashboard (DSG-10). */
export function PaginaContainer({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn(paginaContainer, className)} {...props}>
      {children}
    </div>
  );
}

/** Cabeçalho padrão das telas internas (DES-06, DSG-07): eyebrow laranja + título. */
export function TituloPagina({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-700">{texto}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-950 sm:text-[1.75rem]">
          {titulo}
        </h1>
      </div>
      {children}
    </div>
  );
}

/** Subtítulo padronizado de seção/cartão (DSG-09). */
export function TituloSecao({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={cn(tituloSecao, className)}>{children}</h2>;
}

/** Cartão de número-resumo com dígitos tabulares e padding da escala única (DES-06, DSG-08, DSG-11). */
export function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className={cartaoForm}>
      <p className="text-xs font-semibold text-slate-600 sm:text-sm">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-stone-950 tabular-nums">{valor}</p>
    </div>
  );
}
