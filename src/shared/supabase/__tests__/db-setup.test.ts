import { afterEach, describe, expect, it, vi } from "vitest";
import { setup } from "./db-setup";

const MENSAGEM = 'Supabase local não está rodando: rode "npx supabase start"';

describe("test:db sem Supabase local (TST-03)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falha com a mensagem do spec quando a conexão é recusada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(setup()).rejects.toThrow(MENSAGEM);
  });

  it("falha com a mensagem do spec quando o health check não responde 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(setup()).rejects.toThrow(MENSAGEM);
  });
});
