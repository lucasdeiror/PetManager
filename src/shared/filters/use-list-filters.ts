"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/**
 * Lê/escreve os parâmetros `busca` e `filtro` na URL (searchParams), sem
 * recarregar a página. Usado por toda tela de listagem (agenda, pets,
 * vacinas, produtos, vendas) para manter busca textual + filtro por
 * atributo combinados (E lógico) e compartilháveis via URL.
 *
 * `atributos` é só a lista de valores válidos para `filtro` nesta lista
 * (ex.: status de agendamento, categoria de produto) — usada para
 * validar o valor lido da URL, nunca para gerar a UI do select (isso é
 * responsabilidade de quem renderiza `<SearchFilterBar />`).
 */
export function useListFilters<T extends string>(atributos: readonly T[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Últimos parâmetros escritos e ainda não refletidos na URL: a navegação do Next é assíncrona
  // e o debounce da busca pode disparar antes dela, o que apagaria um filtro recém-escolhido.
  const pendentes = useRef<URLSearchParams | null>(null);
  useEffect(() => {
    pendentes.current = null;
  }, [searchParams]);

  const buscaParam = searchParams.get("busca") ?? "";
  const filtroParam = searchParams.get("filtro");
  const filtro = atributos.includes(filtroParam as T) ? (filtroParam as T) : null;

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(pendentes.current ?? searchParams.toString());
      // busca/filtro novo sempre volta para a página 1 (inclui `pagina_<lista>`)
      for (const key of [...params.keys()]) if (key.startsWith("pagina")) params.delete(key);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      pendentes.current = params;
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setBusca = useCallback((valor: string) => updateParams({ busca: valor }), [updateParams]);
  const setFiltro = useCallback((valor: T | null) => updateParams({ filtro: valor }), [updateParams]);

  return { busca: buscaParam, filtro, setBusca, setFiltro };
}
