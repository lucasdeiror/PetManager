"use server";

import { z } from "zod";
import { createClient } from "../../shared/supabase/server";
import { validar } from "../../shared/validacao/validar";
import { exigirDono } from "../auth/queries";

const MSG_PRECO = "O preço deve ser um número válido e não pode ser negativo.";

const criarServicoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome.").max(255, "O nome não pode ter mais de 255 caracteres."),
  precoInterno: z.number({ error: MSG_PRECO }).min(0, MSG_PRECO),
});

interface CriarServicoInput {
  nome: string;
  precoInterno: number;
}

interface CriarServicoResult {
  error?: string;
  id?: number;
}

/**
 * Cadastra um serviço com preço interno (SERV-01). O preço nunca é
 * exibido na tela de agendamento (SERV-02) — essa regra vive nas
 * queries (`getServicosParaAgendamento` x `getServicosComPreco`, T16),
 * não aqui.
 */
export async function criarServico(input: CriarServicoInput): Promise<CriarServicoResult> {
  const validado = validar(criarServicoSchema, input);
  if ("error" in validado) return validado;
  const dono = await exigirDono();
  if (dono.error) return dono;
  const { nome, precoInterno } = validado.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("servicos")
    .insert({ nome, preco_interno: precoInterno })
    .select("id")
    .single();

  if (error) {
    return { error: "Não foi possível salvar o serviço. Tente novamente." };
  }

  return { id: data.id };
}
