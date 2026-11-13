"use server";

import { z } from "zod";
import { createClient } from "../../shared/supabase/server";
import { validar } from "../../shared/validacao/validar";
import { exigirDono } from "../auth/queries";

const registrarVendaProdutoSchema = z.object({
  produtoId: z.number().int().positive(),
  quantidade: z.number().int("Informe uma quantidade válida (maior que zero).").positive("Informe uma quantidade válida (maior que zero)."),
});

interface RegistrarVendaProdutoResult {
  error?: string;
  vendaId?: number;
}

/**
 * Chama a função Postgres transacional `registrar_venda_produto` (T20)
 * — toda a validação de saldo e a baixa de estoque acontecem atômicas
 * no banco; aqui só traduzimos os erros pra mensagens amigáveis
 * (VEN-02, VEN-03).
 */
export async function registrarVendaProduto(
  produtoIdEntrada: number,
  quantidadeEntrada: number,
): Promise<RegistrarVendaProdutoResult> {
  const validado = validar(registrarVendaProdutoSchema, { produtoId: produtoIdEntrada, quantidade: quantidadeEntrada });
  if ("error" in validado) return validado;
  const dono = await exigirDono();
  if (dono.error) return dono;
  const { produtoId, quantidade } = validado.data;

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("registrar_venda_produto", {
    p_produto_id: produtoId,
    p_quantidade: quantidade,
  });

  if (error) {
    if (error.message.includes("Saldo insuficiente")) {
      return { error: "Saldo insuficiente para essa quantidade." };
    }
    if (error.message.includes("Produto não encontrado")) {
      return { error: "Produto não encontrado." };
    }
    if (error.message.includes("Quantidade deve ser maior que zero")) {
      return { error: "Informe uma quantidade válida (maior que zero)." };
    }
    return { error: "Não foi possível registrar a venda. Tente novamente." };
  }

  return { vendaId: data as number };
}
