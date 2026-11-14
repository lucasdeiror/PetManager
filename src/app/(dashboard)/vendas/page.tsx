import { Suspense } from "react";
import { getCurrentUserRole } from "../../../features/auth/queries";
import { getProdutos } from "../../../features/estoque/queries";
import { getVendas } from "../../../features/vendas/queries";
import { SearchFilterBar } from "../../../shared/filters/search-filter-bar";
import { RegistrarVendaProdutoForm } from "./registrar-venda-produto-form";
import { dataSP } from "../../../shared/data/fuso";
import { Metrica, TituloPagina, cartao } from "../../../shared/tela/titulo-pagina";
import { Paginacao, paginar } from "../../../shared/tela/paginacao";

const TIPOS = ["servico", "produto"] as const;
const TIPO_LABELS = { servico: "Serviço", produto: "Produto" };
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; filtro?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const { busca, filtro } = params;
  const tipo = filtro === "servico" || filtro === "produto" ? filtro : undefined;

  const role = await getCurrentUserRole();
  const isDono = role === "dono";

  const [vendas, produtos] = await Promise.all([
    getVendas({ busca, tipo }),
    isDono ? getProdutos() : Promise.resolve([]),
  ]);

  // Métricas somam a lista filtrada inteira, não só a página visível.
  const total = vendas.reduce((soma, v) => soma + v.valorTotal, 0);
  const itens = vendas.reduce((soma, v) => soma + v.quantidade, 0);
  const produtosVendidos = vendas
    .filter((v) => v.tipo === "produto")
    .reduce((soma, v) => soma + v.quantidade, 0);
  const pagina = paginar(vendas, params.pagina);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
      <TituloPagina
        titulo="Vendas"
        texto="Serviços concluídos entram sozinhos; produtos, pelo registro abaixo"
      />

      {isDono && (
        <section className={`${cartao} p-4`}>
          <h2 className="text-lg font-black">Registrar venda de produto</h2>
          <RegistrarVendaProdutoForm produtos={produtos} />
        </section>
      )}

      <Suspense fallback={null}>
        <SearchFilterBar
          atributos={TIPOS}
          atributoLabels={TIPO_LABELS}
          placeholder="Buscar item vendido..."
          filtroLabel="Todos os tipos"
        />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metrica rotulo="Total do período" valor={brl(total)} />
        <Metrica rotulo="Itens vendidos" valor={String(itens)} />
        <Metrica rotulo="Produtos vendidos" valor={String(produtosVendidos)} />
      </div>

      <section className={`${cartao} overflow-hidden`}>
        <ul className="divide-y-2 divide-slate-100">
          {pagina.visiveis.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
              <div>
                <p className="font-black text-stone-950">{v.itemNome}</p>
                <p className="text-sm font-semibold text-slate-600">
                  {TIPO_LABELS[v.tipo]} · qtd. {v.quantidade} · {dataSP(v.criadoEm)}
                </p>
              </div>
              <span className="font-black text-stone-950">{brl(v.valorTotal)}</span>
            </li>
          ))}
          {pagina.total === 0 && (
            <li className="p-5 text-sm font-semibold text-slate-500">Nenhuma venda encontrada.</li>
          )}
        </ul>
        <Paginacao pagina={pagina} params={params} />
      </section>
    </div>
  );
}
