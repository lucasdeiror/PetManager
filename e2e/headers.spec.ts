import { test, expect } from "@playwright/test";

test("resposta de /login traz os headers de segurança (SEG-03)", async ({ request }) => {
  const resposta = await request.get("/login");
  const h = resposta.headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
