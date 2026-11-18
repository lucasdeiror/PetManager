import { getServicosComPreco } from "../../../features/servicos/queries";
import {
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
import { CriarServicoForm } from "./criar-servico-form";

export default async function ServicosPage({}: Record<string, never>) {
  const servicos = await getServicosComPreco();

  return (
    <PaginaContainer>
      <TituloPagina
        titulo="Serviços"
        texto="Preço interno só aqui; a agenda mostra apenas o nome"
      />

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        <section className={cartaoForm}>
          <TituloSecao>Cadastrar serviço</TituloSecao>
          <CriarServicoForm />
        </section>

        {/* shortcut: sem paginação, o catálogo de um petshop tem poucas dezenas de itens; paginar se passar de ~50 */}
        <section className={`${cartao} overflow-hidden`}>
          <ul className="divide-y-2 divide-slate-100">
            {servicos.map((s) => (
              <li key={s.id} className={`flex items-center justify-between gap-3 ${itemLista}`}>
                <span className={textoPrimario}>{s.nome}</span>
                <span className={valorTabela}>
                  {s.precoInterno.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </li>
            ))}
            {servicos.length === 0 && (
              <li className={`${itemLista} ${textoMeta}`}>Nenhum serviço cadastrado.</li>
            )}
          </ul>
        </section>
      </div>
    </PaginaContainer>
  );
}
