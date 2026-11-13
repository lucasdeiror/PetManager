"use server";

import { z } from "zod";
import { createClient } from "../../shared/supabase/server";
import { validar } from "../../shared/validacao/validar";
import { exigirSessao } from "../auth/queries";
import { getHorarios } from "../horario-funcionamento/queries";

interface CriarAgendamentoInput {
  petId: number;
  servicoIds: number[];
  dataHora: string; // ISO 8601
}

interface CriarAgendamentoResult {
  error?: string;
  id?: number;
}

const idSchema = z.number().int().positive();
const dataHoraSchema = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Data e hora inválidas");

const criarAgendamentoSchema = z.object({
  petId: idSchema,
  servicoIds: z.array(idSchema),
  dataHora: dataHoraSchema,
});

const editarAgendamentoSchema = z.object({
  id: idSchema,
  petId: idSchema.optional(),
  servicoIds: z.array(idSchema).optional(),
  dataHora: dataHoraSchema.optional(),
});

function extrairDiaEHora(dataHoraIso: string): { diaSemana: number; hora: string } {
  const data = new Date(dataHoraIso);
  return { diaSemana: data.getDay(), hora: data.toTimeString().slice(0, 5) };
}

/**
 * Cria um agendamento com status inicial "agendado" (default do
 * banco), validando que o horário está dentro do expediente
 * cadastrado (AGD-01). Sem trava de concorrência de propósito — dois
 * agendamentos simultâneos no mesmo horário são ambos aceitos (risco
 * aceito na spec, AD já documentado no MVP original).
 */
export async function criarAgendamento(input: CriarAgendamentoInput): Promise<CriarAgendamentoResult> {
  const validado = validar(criarAgendamentoSchema, input);
  if ("error" in validado) return validado;
  const sessao = await exigirSessao();
  if (sessao.error) return { error: sessao.error };
  const { petId, servicoIds, dataHora } = validado.data;

  if (servicoIds.length === 0) {
    return { error: "Selecione ao menos um serviço." };
  }

  const { diaSemana, hora } = extrairDiaEHora(dataHora);
  const horarios = await getHorarios();
  const horarioDoDia = horarios.find((h) => h.diaSemana === diaSemana);

  if (!horarioDoDia || hora < horarioDoDia.horaAbertura || hora >= horarioDoDia.horaFechamento) {
    return { error: "Esse horário está fora do expediente cadastrado para esse dia." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: agendamento, error } = await supabase
    .from("agendamentos")
    .insert({ pet_id: petId, data_hora: dataHora, criado_por: user?.id ?? null })
    .select("id")
    .single();

  if (error || !agendamento) {
    return { error: "Não foi possível criar o agendamento. Tente novamente." };
  }

  const { error: servicosError } = await supabase
    .from("agendamento_servicos")
    .insert(servicoIds.map((servicoId) => ({ agendamento_id: agendamento.id, servico_id: servicoId })));

  if (servicosError) {
    return { error: "Agendamento criado, mas não foi possível vincular os serviços. Tente novamente." };
  }

  return { id: agendamento.id };
}

interface EditarAgendamentoInput {
  id: number;
  petId?: number;
  servicoIds?: number[];
  dataHora?: string;
}

interface EditarAgendamentoResult {
  error?: string;
}

/**
 * Edita um agendamento existente, preservando o `id` (AGD-04). Quando
 * `servicoIds` é informado, substitui o vínculo inteiro (delete +
 * insert) em vez de tentar diff — mais simples e sem risco de duplicar
 * linha na tabela de junção.
 */
export async function editarAgendamento(input: EditarAgendamentoInput): Promise<EditarAgendamentoResult> {
  const validado = validar(editarAgendamentoSchema, input);
  if ("error" in validado) return validado;
  const sessao = await exigirSessao();
  if (sessao.error) return { error: sessao.error };
  const { id, petId, servicoIds, dataHora } = validado.data;

  const supabase = await createClient();

  const { data: atual, error: fetchError } = await supabase
    .from("agendamentos")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !atual) {
    return { error: "Agendamento não encontrado." };
  }
  if (atual.status !== "agendado") {
    return { error: "Só é possível editar agendamentos agendados" };
  }

  const updates: Record<string, unknown> = {};
  if (petId !== undefined) updates.pet_id = petId;
  if (dataHora !== undefined) updates.data_hora = dataHora;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("agendamentos").update(updates).eq("id", id);
    if (error) {
      return { error: "Não foi possível editar o agendamento. Tente novamente." };
    }
  }

  if (servicoIds !== undefined) {
    await supabase.from("agendamento_servicos").delete().eq("agendamento_id", id);

    if (servicoIds.length > 0) {
      const { error: insertError } = await supabase
        .from("agendamento_servicos")
        .insert(servicoIds.map((servicoId) => ({ agendamento_id: id, servico_id: servicoId })));

      if (insertError) {
        return { error: "Não foi possível atualizar os serviços do agendamento. Tente novamente." };
      }
    }
  }

  return {};
}

interface CancelarAgendamentoResult {
  error?: string;
}

/**
 * Cancela um agendamento (soft delete — só muda o status, nunca exclui
 * o registro) e nunca cria venda (AGD-05).
 */
export async function cancelarAgendamento(idEntrada: number): Promise<CancelarAgendamentoResult> {
  const validado = validar(idSchema, idEntrada);
  if ("error" in validado) return validado;
  const sessao = await exigirSessao();
  if (sessao.error) return { error: sessao.error };
  const id = validado.data;

  const supabase = await createClient();
  const { error } = await supabase.from("agendamentos").update({ status: "cancelado" }).eq("id", id);

  if (error) {
    if (error.message.includes("Reabra o agendamento antes de cancelar")) {
      return { error: "Reabra o agendamento antes de cancelar" };
    }
    return { error: "Não foi possível cancelar o agendamento. Tente novamente." };
  }

  return {};
}

interface ReabrirAgendamentoResult {
  error?: string;
}

/**
 * Reabre um agendamento cancelado, voltando ao status "agendado"
 * (AGD-06). Rejeita se o agendamento não estiver cancelado — reabrir
 * um "concluído" é um fluxo diferente (ver `reabrirAgendamentoConcluido`,
 * T29, que também estorna a venda associada).
 */
export async function reabrirAgendamento(idEntrada: number): Promise<ReabrirAgendamentoResult> {
  const validado = validar(idSchema, idEntrada);
  if ("error" in validado) return validado;
  const sessao = await exigirSessao();
  if (sessao.error) return { error: sessao.error };
  const id = validado.data;

  const supabase = await createClient();

  const { data: agendamento, error: fetchError } = await supabase
    .from("agendamentos")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !agendamento) {
    return { error: "Agendamento não encontrado." };
  }

  if (agendamento.status !== "cancelado") {
    return { error: "Só é possível reabrir um agendamento cancelado." };
  }

  const { error } = await supabase.from("agendamentos").update({ status: "agendado" }).eq("id", id);

  if (error) {
    return { error: "Não foi possível reabrir o agendamento. Tente novamente." };
  }

  return {};
}

interface ConcluirAgendamentoResult {
  error?: string;
  vendaId?: number;
}

/**
 * Marca o agendamento como "concluído" e cria automaticamente 1 venda
 * de serviço (AGD-07, VEN-01) — tudo dentro da função Postgres
 * transacional `concluir_agendamento` (migration 0006). Permitido
 * mesmo se a data já passou (a spec exige isso explicitamente).
 */
export async function concluirAgendamento(idEntrada: number): Promise<ConcluirAgendamentoResult> {
  const validado = validar(idSchema, idEntrada);
  if ("error" in validado) return validado;
  const sessao = await exigirSessao();
  if (sessao.error) return { error: sessao.error };
  const id = validado.data;

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("concluir_agendamento", {
    p_agendamento_id: id,
  });

  if (error) {
    if (error.message.includes("Agendamento não encontrado")) {
      return { error: "Agendamento não encontrado." };
    }
    if (error.message.includes("Agendamento não está agendado")) {
      return { error: "Agendamento não está agendado" };
    }
    if (error.code === "23505") {
      return { error: "Este agendamento já foi concluído." };
    }
    return { error: "Não foi possível concluir o agendamento. Tente novamente." };
  }

  return { vendaId: data as number };
}

interface ReabrirAgendamentoConcluidoResult {
  error?: string;
}

/**
 * Reabre um agendamento concluído, estornando a venda associada
 * (nunca apaga; o trigger de status marca estornada_em) via a função
 * Postgres transacional `reabrir_agendamento_concluido` (migration
 * 0007). Existe pra AGD-08 nunca deixar o faturamento inflado.
 */
export async function reabrirAgendamentoConcluido(idEntrada: number): Promise<ReabrirAgendamentoConcluidoResult> {
  const validado = validar(idSchema, idEntrada);
  if ("error" in validado) return validado;
  const sessao = await exigirSessao();
  if (sessao.error) return { error: sessao.error };
  const id = validado.data;

  const supabase = await createClient();

  const { error } = await supabase.rpc("reabrir_agendamento_concluido", {
    p_agendamento_id: id,
  });

  if (error) {
    if (error.message.includes("Agendamento não encontrado")) {
      return { error: "Agendamento não encontrado." };
    }
    if (error.message.includes("Agendamento não está concluído")) {
      return { error: "Agendamento não está concluído" };
    }
    return { error: "Não foi possível reabrir o agendamento. Tente novamente." };
  }

  return {};
}
