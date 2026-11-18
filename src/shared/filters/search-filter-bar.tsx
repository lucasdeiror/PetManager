"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useListFilters } from "./use-list-filters";

interface SearchFilterBarProps<T extends string> {
  atributos: readonly T[];
  atributoLabels: Record<T, string>;
  placeholder?: string;
  filtroLabel?: string;
  debounceMs?: number;
}

/**
 * Barra de busca + filtro reutilizada em toda tela de listagem. A busca
 * é debounced localmente (não escreve na URL a cada tecla); o filtro de
 * atributo (select) escreve na URL imediatamente.
 */
export function SearchFilterBar<T extends string>({
  atributos,
  atributoLabels,
  placeholder = "Buscar...",
  filtroLabel = "Todos",
  debounceMs = 300,
}: SearchFilterBarProps<T>) {
  const { busca, filtro, setBusca, setFiltro } = useListFilters(atributos);
  const [inputValue, setInputValue] = useState(busca);

  // Sincroniza o input quando a URL muda por fora (ex.: botão voltar) —
  // ajuste de estado durante o render, padrão recomendado pelo React
  // em vez de setState dentro de useEffect.
  const [buscaAnterior, setBuscaAnterior] = useState(busca);
  if (busca !== buscaAnterior) {
    setBuscaAnterior(busca);
    setInputValue(busca);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (inputValue !== busca) {
        setBusca(inputValue);
      }
    }, debounceMs);
    return () => clearTimeout(timeout);
    // busca/setBusca nas deps: um timer com setBusca antiga montaria a URL sem o filtro recém-escolhido
  }, [inputValue, busca, setBusca, debounceMs]);

  return (
    <div className="flex flex-wrap gap-2">
      <label className="flex h-11 min-w-0 flex-1 basis-64 items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 focus-within:border-orange-500 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-orange-400">
        <Search className="size-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar"
          className="w-full bg-transparent text-sm font-semibold outline-none text-stone-950 dark:text-stone-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
      </label>
      {atributos.length > 0 && (
        <select
          value={filtro ?? ""}
          onChange={(e) => setFiltro((e.target.value || null) as T | null)}
          className="h-11 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-stone-950 dark:border-slate-800 dark:bg-slate-900 dark:text-stone-100"
        >
          <option value="">{filtroLabel}</option>
          {atributos.map((a) => (
            <option key={a} value={a}>
              {atributoLabels[a]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
