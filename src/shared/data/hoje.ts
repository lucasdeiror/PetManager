/** Data de hoje (YYYY-MM-DD) no fuso de Brasília; `toISOString()` devolveria a data em UTC. */
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

/** Ano e mês correntes em Brasília: o servidor roda em UTC e viraria o mês às 21h (AD-010). */
export function mesEmSaoPaulo(agora: Date = new Date()): { ano: number; mes: number } {
  const [ano, mes] = hojeEmSaoPaulo(agora).split("-").map(Number);
  return { ano, mes };
}
