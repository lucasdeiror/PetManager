"use server";

import { z } from "zod";
import { createClient } from "../../shared/supabase/server";
import { validar } from "../../shared/validacao/validar";
import { exigirSessao } from "../auth/queries";

// abort: sem ele, data malformada gera dois erros (formato + calendário).
const dataSchema = z.iso.date({ error: "Data inválida", abort: true });

const registrarVacinaSchema = z.object({
  petId: z.number().int().positive(),
  nome: z.string().trim().min(1, "Informe o nome da vacina.").max(255, "O nome não pode ter mais de 255 caracteres."),
  dataAplicacao: dataSchema,
  dataRetornoPrevista: dataSchema,
});

interface RegistrarVacinaInput {
  petId: number;
  nome: string;
  dataAplicacao: string; // "YYYY-MM-DD"
  dataRetornoPrevista: string; // "YYYY-MM-DD"
}

interface RegistrarVacinaResult {
  error?: string;
  id?: number;
}

/**
 * Registra uma vacina aplicada (VAC-01). A checagem de retorno >=
 * aplicação já existe como CHECK no banco (migration `0002`) — aqui
 * só reforça antes, pra mensagem amigável e evitar round-trip
 * desnecessário (mesmo padrão de `salvarHorario`, T9).
 */
export async function registrarVacina(input: RegistrarVacinaInput): Promise<RegistrarVacinaResult> {
  const validado = validar(registrarVacinaSchema, input);
  if ("error" in validado) return validado;
  const sessao = await exigirSessao();
  if (sessao.error) return { error: sessao.error };
  const { petId, nome, dataAplicacao, dataRetornoPrevista } = validado.data;

  if (dataRetornoPrevista < dataAplicacao) {
    return { error: "A data de retorno não pode ser anterior à data de aplicação." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vacinas")
    .insert({
      pet_id: petId,
      nome,
      data_aplicacao: dataAplicacao,
      data_retorno_prevista: dataRetornoPrevista,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Não foi possível registrar a vacina. Tente novamente." };
  }

  return { id: data.id };
}
