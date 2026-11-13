"use server";

import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { createClient } from "../../shared/supabase/server";
import { validar } from "../../shared/validacao/validar";
import { exigirSessao } from "../auth/queries";

interface CriarTutorInput {
  nome: string;
  telefone: string;
}

interface CriarTutorResult {
  error?: string;
  id?: number;
}

const NOME_MAX_LENGTH = 255;

const nomeSchema = z
  .string()
  .trim()
  .min(1, "Informe o nome.")
  .max(NOME_MAX_LENGTH, `O nome não pode ter mais de ${NOME_MAX_LENGTH} caracteres.`);

const criarTutorSchema = z.object({
  nome: nomeSchema,
  telefone: z
    .string()
    .refine(
      (t) => parsePhoneNumberFromString(t, "BR")?.isValid() === true,
      "Informe um telefone válido no formato brasileiro, com DDD (ex.: (79) 99999-9999).",
    ),
});

const criarPetSchema = z.object({
  tutorId: z.number().int().positive(),
  nome: nomeSchema,
  raca: z.string().trim(),
  porte: z.enum(["pequeno", "medio", "grande"]),
});

type Porte = "pequeno" | "medio" | "grande";

interface CriarPetInput {
  tutorId: number;
  nome: string;
  raca: string;
  porte: Porte;
}

interface CriarPetResult {
  error?: string;
  id?: number;
}

/**
 * Cadastra um pet vinculado a um tutor já existente. A FK
 * `pets.tutor_id -> tutores.id` já garante isso no banco (código de
 * erro Postgres `23503`) — aqui só traduzimos pra uma mensagem
 * amigável em vez de vazar o erro cru do banco.
 */
export async function criarPet(input: CriarPetInput): Promise<CriarPetResult> {
  const validado = validar(criarPetSchema, input);
  if ("error" in validado) return validado;
  const sessao = await exigirSessao();
  if (sessao.error) return { error: sessao.error };
  const { tutorId, nome, raca, porte } = validado.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pets")
    .insert({ tutor_id: tutorId, nome, raca, porte })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23503") {
      return { error: "Tutor não encontrado. Selecione um tutor já cadastrado." };
    }
    return { error: "Não foi possível salvar o pet. Tente novamente." };
  }

  return { id: data.id };
}


/**
 * Cadastra um tutor, validando telefone BR (com DDD) via
 * `libphonenumber-js` (CAD-02) e limitando o nome a 255 caracteres
 * (CAD-04). O telefone é salvo já normalizado em formato E.164
 * (`+55DDXXXXXXXXX`), consistente independente de como foi digitado.
 */
export async function criarTutor(input: CriarTutorInput): Promise<CriarTutorResult> {
  const validado = validar(criarTutorSchema, input);
  if ("error" in validado) return validado;
  const sessao = await exigirSessao();
  if (sessao.error) return { error: sessao.error };
  const { nome, telefone } = validado.data;
  const phone = parsePhoneNumberFromString(telefone, "BR")!; // validado pelo schema

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutores")
    .insert({ nome, telefone: phone.number })
    .select("id")
    .single();

  if (error) {
    return { error: "Não foi possível salvar o tutor. Tente novamente." };
  }

  return { id: data.id };
}
