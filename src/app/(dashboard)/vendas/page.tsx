import { Suspense } from "react";
import { getCurrentUserRole } from "../../../features/auth/queries";
import { getProdutos } from "../../../features/estoque/queries";
import { getVendas } from "../../../features/vendas/queries";
import { SearchFilterBar } from "../../../shared/filters/search-filter-bar";
import { RegistrarVendaProdutoForm } from "./registrar-venda-produto-form";
import { dataSP } from "../../../shared/data/fuso";

const TIPOS = ["servico", "produto"] as const;
const TIPO_LABELS = { servico: "Serviço", produto: "Produto" };

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; filtro?: string }>;
}) {
  const { busca, filtro } = await searchParams;
  const tipo = filtro === "servico" || filtro === "produto" ? filtro : undefined;

  const role = await getCurrentUserRole();
  const isDono = role === "dono";

  const [vendas, produtos] = await Promise.all([
    getVendas({ busca, tipo }),
    isDono ? getProdutos() : Promise.resolve([]),
  ]);

  const total = vendas.reduce((soma, v) => soma + v.valorTotal, 0);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-black">Vendas</h1>
      <p className="mt-2 text-sm text-slate-600">
        Toda venda concluída — de serviço (automática) ou produto — aparece aqui.
      </p>

      {isDono && <RegistrarVendaProdutoForm produtos={produtos} />}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Suspense fallback={null}>
          <SearchFilterBar
            atributos={TIPOS}
            atributoLabels={TIPO_LABELS}
            placeholder="Buscar item vendido..."
            filtroLabel="Todos os tipos"
          />
        </Suspense>
        <p className="font-black">
          Total do período:{" "}
          {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </div>

      <ul className="mt-4 grid gap-2">
        {vendas.map((v) => (
          <li key={v.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-bold">{v.itemNome}</p>
              <p className="text-sm text-slate-600">
                {TIPO_LABELS[v.tipo]} · qtd. {v.quantidade} ·{" "}
                {dataSP(v.criadoEm)}
              </p>
            </div>
            <span className="font-bold">
              {v.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </li>
        ))}
        {vendas.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma venda encontrada.</p>
        )}
      </ul>
    </div>
  );
}
