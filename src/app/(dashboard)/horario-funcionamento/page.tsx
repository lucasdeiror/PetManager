import { getHorarios } from "../../../features/horario-funcionamento/queries";
import { PaginaContainer, TituloPagina } from "../../../shared/tela/titulo-pagina";
import { HorarioDiaForm } from "./horario-dia-form";

const DIAS_DA_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export default async function HorarioFuncionamentoPage() {
  const horarios = await getHorarios();

  return (
    <PaginaContainer>
      <TituloPagina
        titulo="Horário de funcionamento"
        texto="Dias sem horário ficam fechados na agenda"
      />

      <div className="grid gap-4">
        {DIAS_DA_SEMANA.map((nomeDia, diaSemana) => {
          const horario = horarios.find((h) => h.diaSemana === diaSemana) ?? null;
          return (
            <HorarioDiaForm
              key={diaSemana}
              diaSemana={diaSemana}
              nomeDia={nomeDia}
              horario={horario}
            />
          );
        })}
      </div>
    </PaginaContainer>
  );
}
