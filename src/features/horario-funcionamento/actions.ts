"use server";

import { z } from "zod";
import { createClient } from "../../shared/supabase/server";
import { validar } from "../../shared/validacao/validar";
import { exigirDono } from "../auth/queries";

const horaSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (use HH:MM)");

const salvarHorarioSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  horaAbertura: horaSchema,
  horaFechamento: horaSchema,
});

interface SalvarHorarioInput {
  diaSemana: number; // 0 (domingo) a 6 (sábado)
  horaAbertura: string; // "HH:MM"
  horaFechamento: string; // "HH:MM"
}

interface SalvarHorarioResult {
  error?: string;
}

/**
 * Cadastra ou edita o horário de um dia da semana (upsert manual por
 * `dia_semana` — a tabela não tem constraint de unicidade nessa
 * coluna, então fazemos select-then-insert/update aqui em vez de
 * depender de `ON CONFLICT`).
 *
 * A validação de fechamento > abertura também existe como CHECK no
 * banco (defesa em profundidade) — aqui ela só evita a viagem
 * desnecessária ao banco e dá uma mensagem amigável.
 */
export async function salvarHorario(input: SalvarHorarioInput): Promise<SalvarHorarioResult> {
  const validado = validar(salvarHorarioSchema, input);
  if ("error" in validado) return validado;
  const dono = await exigirDono();
  if (dono.error) return dono;
  const { diaSemana, horaAbertura, horaFechamento } = validado.data;

  if (horaFechamento <= horaAbertura) {
    return { error: "O horário de fechamento deve ser depois do horário de abertura." };
  }

  const supabase = await createClient();

  const { data: existente } = await supabase
    .from("horarios_funcionamento")
    .select("id")
    .eq("dia_semana", diaSemana)
    .maybeSingle();

  const payload = {
    dia_semana: diaSemana,
    hora_abertura: horaAbertura,
    hora_fechamento: horaFechamento,
  };

  const { error } = existente
    ? await supabase.from("horarios_funcionamento").update(payload).eq("id", existente.id)
    : await supabase.from("horarios_funcionamento").insert(payload);

  if (error) {
    return { error: "Não foi possível salvar o horário. Tente novamente." };
  }

  return {};
}
