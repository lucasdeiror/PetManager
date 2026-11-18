"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registrarVacina } from "../../../features/vacinas/actions";
import type { Pet } from "../../../features/pets/queries";
import { botaoPrimario, campoInput } from "../../../shared/tela/titulo-pagina";

export function RegistrarVacinaForm({ pets }: { pets: Pet[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const petId = Number(formData.get("petId"));
    const nome = String(formData.get("nome"));
    const dataAplicacao = String(formData.get("dataAplicacao"));
    const dataRetornoPrevista = String(formData.get("dataRetornoPrevista"));

    startTransition(async () => {
      const result = await registrarVacina({ petId, nome, dataAplicacao, dataRetornoPrevista });
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-bold">
        Pet
        <select name="petId" required className={campoInput}>
          <option value="">Selecione um pet</option>
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Nome da vacina
        <input name="nome" required className={campoInput} />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Data de aplicação
        <input name="dataAplicacao" type="date" required className={`${campoInput} tabular-nums`} />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Data de retorno prevista
        <input
          name="dataRetornoPrevista"
          type="date"
          required
          className={`${campoInput} tabular-nums`}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm font-bold text-red-700 sm:col-span-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className={`${botaoPrimario} sm:col-span-2`}
      >
        {isPending ? "Salvando..." : "Registrar vacina"}
      </button>
    </form>
  );
}
