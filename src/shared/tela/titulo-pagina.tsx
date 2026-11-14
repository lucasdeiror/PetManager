/** Cabeçalho padrão das telas internas (DES-06): eyebrow laranja + título. */
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
        <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">{texto}</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-stone-950">{titulo}</h1>
      </div>
      {children}
    </div>
  );
}

export const cartao = "rounded-2xl border-2 border-slate-200 bg-white";

/** Cartão de número-resumo (DES-06). */
export function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className={`${cartao} p-5`}>
      <p className="text-sm font-bold text-slate-600">{rotulo}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-stone-950">{valor}</p>
    </div>
  );
}
