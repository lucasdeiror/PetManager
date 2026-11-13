"use server";

import { z } from "zod";
import { createClient } from "../../shared/supabase/server";
import { validar } from "../../shared/validacao/validar";
import { exigirDono } from "../auth/queries";

const textoSchema = (campo: string) =>
  z.string().trim().min(1, `Informe ${campo}.`).max(255, `${campo[0].toUpperCase()}${campo.slice(1)} não pode ter mais de 255 caracteres.`);

const criarProdutoSchema = z.object({
  nome: textoSchema("o nome"),
  categoria: textoSchema("a categoria"),
  precoUnitario: z.number().min(0, "O preço deve ser um número válido e não pode ser negativo."),
  estoqueMinimo: z.number().min(0, "O estoque mínimo deve ser um número válido e não pode ser negativo."),
  saldoInicial: z.number().min(0, "O saldo inicial não pode ser negativo.").default(0),
});

const registrarEntradaSchema = z.object({
  produtoId: z.number().int().positive(),
  quantidade: z.number().int("Informe uma quantidade válida (maior que zero).").positive("Informe uma quantidade válida (maior que zero)."),
});

interface CriarProdutoInput {
  nome: string;
  categoria: string;
  precoUnitario: number;
  estoqueMinimo: number;
  saldoInicial?: number;
}

interface CriarProdutoResult {
  error?: string;
  id?: number;
}

/** Cadastra um produto (EST-01). Acesso restrito a `dono` via RLS. */
export async function criarProduto(input: CriarProdutoInput): Promise<CriarProdutoResult> {
  const validado = validar(criarProdutoSchema, input);
  if ("error" in validado) return validado;
  const dono = await exigirDono();
  if (dono.error) return dono;
  const { nome, categoria, precoUnitario, estoqueMinimo, saldoInicial } = validado.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("produtos")
    .insert({
      nome,
      categoria,
      preco_unitario: precoUnitario,
      estoque_minimo: estoqueMinimo,
      saldo_estoque: saldoInicial,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Não foi possível salvar o produto. Tente novamente." };
  }

  return { id: data.id };
}

interface RegistrarEntradaResult {
  error?: string;
}

/**
 * Soma `quantidade` ao saldo do produto e registra a movimentação
 * (EST-01). Select-then-update, não atômico — mesmo risco de
 * concorrência já aceito em outras partes do projeto (ex.: agenda),
 * baixo impacto real com 1-2 usuários internos por petshop.
 */
export async function registrarEntrada(produtoIdEntrada: number, quantidadeEntrada: number): Promise<RegistrarEntradaResult> {
  const validado = validar(registrarEntradaSchema, { produtoId: produtoIdEntrada, quantidade: quantidadeEntrada });
  if ("error" in validado) return validado;
  const dono = await exigirDono();
  if (dono.error) return dono;
  const { produtoId, quantidade } = validado.data;

  const supabase = await createClient();

  const { data: produto, error: fetchError } = await supabase
    .from("produtos")
    .select("saldo_estoque")
    .eq("id", produtoId)
    .single();

  if (fetchError || !produto) {
    return { error: "Produto não encontrado." };
  }

  const { error: updateError } = await supabase
    .from("produtos")
    .update({ saldo_estoque: produto.saldo_estoque + quantidade })
    .eq("id", produtoId);

  if (updateError) {
    return { error: "Não foi possível registrar a entrada. Tente novamente." };
  }

  await supabase.from("movimentacoes_estoque").insert({
    produto_id: produtoId,
    tipo: "entrada",
    quantidade,
  });

  return {};
}
