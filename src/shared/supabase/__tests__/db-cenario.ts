import { clienteAdmin } from "./db-sessao";

/** Cria tutor + pet + agendamento (status agendado) com serviços de preços dados. */
export async function criarAgendamento(precos: number[] = [30, 20]): Promise<number> {
  const admin = clienteAdmin();
  const ok = <T>(r: { data: T; error: unknown }): NonNullable<T> => {
    if (r.error || r.data == null) throw r.error ?? new Error("sem dados");
    return r.data;
  };
  const tutor = ok(await admin.from("tutores").insert({ nome: "Ana", telefone: "+5579999990000" }).select("id").single());
  const pet = ok(
    await admin.from("pets").insert({ tutor_id: tutor.id, nome: "Rex", raca: "SRD", porte: "medio" }).select("id").single(),
  );
  const ag = ok(
    await admin.from("agendamentos").insert({ pet_id: pet.id, data_hora: "2026-12-01T13:00:00Z" }).select("id").single(),
  );
  for (const preco of precos) {
    const s = ok(await admin.from("servicos").insert({ nome: "Banho", preco_interno: preco }).select("id").single());
    const { error } = await admin.from("agendamento_servicos").insert({ agendamento_id: ag.id, servico_id: s.id });
    if (error) throw error;
  }
  return ag.id;
}
