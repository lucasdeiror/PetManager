export const FUSO_SP = "America/Sao_Paulo";

/** Horário local de Brasília (`YYYY-MM-DDTHH:MM[:SS]`) → instante com offset, para gravar em `timestamptz`. */
export function instanteSP(local: string): string {
  // shortcut: offset fixo; o Brasil não tem horário de verão desde 2019. Se voltar, calcular o offset via Intl.
  return `${local}-03:00`;
}

/** Dia (`YYYY-MM-DD`) e hora (`HH:MM`) de um instante, em Brasília. */
export function partesSP(instante: string): { dia: string; hora: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: FUSO_SP,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(instante))
      .map((x) => [x.type, x.value]),
  );
  return { dia: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

export function dataHoraSP(instante: string): string {
  return new Date(instante).toLocaleString("pt-BR", { timeZone: FUSO_SP, dateStyle: "short", timeStyle: "short" });
}

export function dataSP(instante: string): string {
  return new Date(instante).toLocaleDateString("pt-BR", { timeZone: FUSO_SP });
}

/** Coluna `date` (`YYYY-MM-DD`) → `DD/MM/YYYY`; `new Date()` leria meia-noite UTC e voltaria um dia em Brasília. */
export function dataSimples(data: string): string {
  return data.slice(0, 10).split("-").reverse().join("/");
}
