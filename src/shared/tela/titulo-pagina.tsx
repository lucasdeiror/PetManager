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
