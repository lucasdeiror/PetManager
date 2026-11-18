"use client";

import { Moon, Sun } from "lucide-react";
import { useTema } from "./tema";
import { cn } from "../../lib/utils";

interface BotaoTemaProps {
  className?: string;
}

/**
 * Botão para alternar entre modo claro e escuro (estilo Gabi Modas).
 * Alvo de toque >= 44px (min-h-11 / size-11), sem layout shift e com transição suave.
 */
export function BotaoTema({ className }: BotaoTemaProps) {
  const { tema, alternarTema } = useTema();
  const escuro = tema === "escuro";

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={escuro ? "Usar modo claro" : "Usar modo escuro"}
      title={escuro ? "Usar modo claro" : "Usar modo escuro"}
      className={cn(
        "relative flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-800 transition-[background-color,border-color,color,transform] duration-150 ease-out hover:border-orange-500 hover:text-orange-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-orange-400 dark:hover:text-orange-400",
        className,
      )}
    >
      {escuro ? (
        <Sun className="size-5 text-amber-400 transition-transform duration-200" aria-hidden />
      ) : (
        <Moon className="size-5 text-slate-700 transition-transform duration-200 dark:text-slate-200" aria-hidden />
      )}
    </button>
  );
}

/**
 * Item de menu para alternar tema na barra lateral (estilo BarraLateral Gabi Modas).
 */
export function BotaoTemaMenu({ expandida }: { expandida: boolean }) {
  const { tema, alternarTema } = useTema();
  const escuro = tema === "escuro";
  const rotulo = escuro ? "Modo claro" : "Modo escuro";

  return (
    <button
      type="button"
      onClick={alternarTema}
      title={!expandida ? rotulo : undefined}
      aria-label={rotulo}
      className={cn(
        "flex min-h-11 items-center rounded-xl text-sm font-semibold outline-none transition-colors hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-orange-300",
        expandida ? "w-full gap-3 px-3 py-2.5 text-slate-300" : "size-11 justify-center p-0 mx-auto text-slate-300",
      )}
    >
      {escuro ? (
        <Sun className="size-5 shrink-0 text-amber-400" aria-hidden />
      ) : (
        <Moon className="size-5 shrink-0 text-slate-300" aria-hidden />
      )}
      <span className={cn("truncate", !expandida && "sr-only")}>{rotulo}</span>
    </button>
  );
}
