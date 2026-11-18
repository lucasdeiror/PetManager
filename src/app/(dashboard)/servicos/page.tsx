import { getServicosComPreco } from "../../../features/servicos/queries";
import {
  TituloPagina,
  TituloSecao,
  cartao,
  textoMeta,
  textoPrimario,
  valorTabela,
} from "../../../shared/tela/titulo-pagina";
import { CriarServicoForm } from "./criar-servico-form";

export default async function ServicosPage({}: Record<string, never>) {
  const servicos = await getServicosComPreco();

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 sm:p-6 lg:p-8">
      <TituloPagina
        titulo="Serviços"
        texto="Preço interno só aqui; a agenda mostra apenas o nome"
      />

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        <section className={`${cartao} p-4`}>
          <TituloSecao>Cadastrar serviço</TituloSecao>
          <CriarServicoForm />
        </section>

        {/* shortcut: sem paginação, o catálogo de um petshop tem poucas dezenas de itens; paginar se passar de ~50 */}
        <section className={`${cartao} overflow-hidden`}>
          <ul className="divide-y-2 divide-slate-100">
            {servicos.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 p-4 sm:px-5">
                <span className={textoPrimario}>{s.nome}</span>
                <span className={valorTabela}>
                  {s.precoInterno.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </li>
            ))}
            {servicos.length === 0 && (
              <li className={`p-5 ${textoMeta}`}>Nenhum serviço cadastrado.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
