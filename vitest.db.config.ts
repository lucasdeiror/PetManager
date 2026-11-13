import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/__tests__/*.db.test.ts"],
    environment: "node",
    globalSetup: ["src/shared/supabase/__tests__/db-setup.ts"],
    // os testes compartilham um único banco; rodar arquivos em série evita interferência
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
