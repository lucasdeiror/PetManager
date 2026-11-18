import { Suspense } from "react";
import { getCurrentUserRole } from "../../../features/auth/queries";
import { getProdutos } from "../../../features/estoque/queries";
import { getVendas } from "../../../features/vendas/queries";
import { SearchFilterBar } from "../../../shared/filters/search-filter-bar";
import { RegistrarVendaProdutoForm } from "./registrar-venda-produto-form";
import { dataSP } from "../../../shared/data/fuso";
import {
  Metrica,
  PaginaContainer,
  TituloPagina,
  TituloSecao,
  cartao,
  cartaoForm,
  itemLista,
  textoMeta,
  textoPrimario,
  valorTabela,
} from "../../../shared/tela/titulo-pagina";
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

  const [role, vendas] = await Promise.all([
    getCurrentUserRole(),
    getVendas({ busca, tipo }),
  ]);
  const isDono = role === "dono";
  const produtos = isDono ? await getProdutos() : [];

  // Métricas somam a lista filtrada inteira, não só a página visível.
  const total = vendas.reduce((soma, v) => soma + v.valorTotal, 0);
  const itens = vendas.reduce((soma, v) => soma + v.quantidade, 0);
  const produtosVendidos = vendas
    .filter((v) => v.tipo === "produto")
    .reduce((soma, v) => soma + v.quantidade, 0);
  const pagina = paginar(vendas, params.pagina);

  return (
    <PaginaContainer>
      <TituloPagina
        titulo="Vendas"
        texto="Serviços concluídos entram sozinhos; produtos, pelo registro abaixo"
      />

      {isDono && (
        <section className={cartaoForm}>
          <TituloSecao>Registrar venda de produto</TituloSecao>
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
            <li key={v.id} className={`flex flex-wrap items-center justify-between gap-3 ${itemLista}`}>
              <div>
                <p className={textoPrimario}>{v.itemNome}</p>
                <p className={`${textoMeta} tabular-nums`}>
                  {TIPO_LABELS[v.tipo]} · qtd. {v.quantidade} · {dataSP(v.criadoEm)}
                </p>
              </div>
              <span className={valorTabela}>{brl(v.valorTotal)}</span>
            </li>
          ))}
          {pagina.total === 0 && (
            <li className={`${itemLista} ${textoMeta}`}>Nenhuma venda encontrada.</li>
          )}
        </ul>
        <Paginacao pagina={pagina} params={params} />
      </section>
    </PaginaContainer>
  );
}
