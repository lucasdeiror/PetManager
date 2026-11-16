// O banco local acumula agendamentos entre rodadas: cada teste usa um dia futuro só dele.
export function diaExclusivo(): string {
  const dias = 400 + Math.floor(Math.random() * 20000);
  return new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);
}

// 10:00–17:59 cabe em qualquer expediente que os specs gravam (horario-funcionamento.spec põe segunda 09–18).
export function horaUnica(): string {
  const h = String(10 + Math.floor(Math.random() * 8)).padStart(2, "0");
  const m = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  return `${h}:${m}`;
}
