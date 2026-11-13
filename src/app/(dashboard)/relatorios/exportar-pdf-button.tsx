"use client";

import { useState, useTransition } from "react";
import { gerarRelatorioPdf } from "../../../features/relatorios/actions";

export function ExportarPdfButton({ ano, mes }: { ano: number; mes: number }) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError("");
    startTransition(async () => {
      const result = await gerarRelatorioPdf(ano, mes);
      if (result.error || !result.base64) {
        setError(result.error ?? "Não foi possível gerar o PDF.");
        return;
      }

      const byteChars = atob(result.base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName ?? "relatorio.pdf";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="h-10 rounded-md bg-orange-600 px-4 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Gerando..." : "Exportar PDF"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-bold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
