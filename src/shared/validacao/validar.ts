import { z } from "zod";

z.config(z.locales.pt());

type ResultadoValidacao<T> = { data: T } | { error: string };

/** Aplica o schema e devolve o erro no formato `{ error }` das actions. */
export function validar<T>(schema: z.ZodType<T>, input: unknown): ResultadoValidacao<T> {
  const resultado = schema.safeParse(input);
  if (resultado.success) return { data: resultado.data };
  return { error: `Dados inválidos. ${resultado.error.issues[0].message}` };
}
