import { Suspense } from "react";
import { getProdutos } from "../../../features/estoque/queries";
import { SearchFilterBar } from "../../../shared/filters/search-filter-bar";
import { Metrica, TituloPagina, cartao } from "../../../shared/tela/titulo-pagina";
import { Paginacao, paginar } from "../../../shared/tela/paginacao";
import { CriarProdutoForm } from "./criar-produto-form";
import { RegistrarEntradaForm } from "./registrar-entrada-form";

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; filtro?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const { busca, filtro } = params;
  const [produtosFiltrados, todosProdutos] = await Promise.all([
    getProdutos({ busca, categoria: filtro }),
    getProdutos(),
  ]);

  const categorias = Array.from(new Set(todosProdutos.map((p) => p.categoria))).sort();
  const baixos = todosProdutos.filter((p) => p.estoqueBaixo).length;
  const unidades = todosProdutos.reduce((soma, p) => soma + p.saldoEstoque, 0);
  const pagina = paginar(produtosFiltrados, params.pagina);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
      <TituloPagina
        titulo="Estoque"
        texto="Entradas aqui; toda saída acontece por venda"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Metrica rotulo="Produtos cadastrados" valor={String(todosProdutos.length)} />
        <Metrica rotulo="Com estoque baixo" valor={String(baixos)} />
        <Metrica rotulo="Unidades em estoque" valor={String(unidades)} />
      </div>

      <section className={`${cartao} p-4`}>
        <h2 className="text-lg font-black">Cadastrar produto</h2>
        <CriarProdutoForm />
      </section>

      <Suspense fallback={null}>
        <SearchFilterBar
          atributos={categorias}
          atributoLabels={Object.fromEntries(categorias.map((c) => [c, c]))}
          placeholder="Buscar produto..."
          filtroLabel="Todas as categorias"
        />
      </Suspense>

      <section className={`${cartao} overflow-hidden`}>
        <ul className="divide-y-2 divide-slate-100">
          {pagina.visiveis.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:px-5">
              <div className="min-w-40 flex-1">
                <p className="font-black text-stone-950">{p.nome}</p>
                <p className="text-sm font-semibold text-slate-600">{p.categoria}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-stone-950">{p.saldoEstoque} un.</p>
                {p.estoqueBaixo && (
                  <p role="status" className="text-xs font-black text-red-700">
                    Estoque baixo
                  </p>
                )}
              </div>
              <RegistrarEntradaForm produtoId={p.id} />
            </li>
          ))}
          {pagina.total === 0 && (
            <li className="p-5 text-sm font-semibold text-slate-500">Nenhum produto encontrado.</li>
          )}
        </ul>
        <Paginacao pagina={pagina} params={params} />
      </section>
    </div>
  );
}
