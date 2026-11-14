import { describe, it, expect, vi } from "vitest";
import { signOut } from "../actions";
import { redirect } from "next/navigation";

const authSignOut = vi.fn(async () => ({ error: null }));

vi.mock("../../../shared/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { signOut: authSignOut } })),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("signOut", () => {
  it("encerra a sessão e redireciona para /login", async () => {
    await signOut();
    expect(authSignOut).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
