/** Data de hoje (YYYY-MM-DD) no fuso de Brasília; `toISOString()` devolveria a data em UTC. */
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}
