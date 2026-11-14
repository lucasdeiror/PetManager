import { defineConfig, devices } from "@playwright/test";

// PORT=3010 npm run test:e2e quando a 3000 estiver ocupada.
const PORT = process.env.PORT ?? "3000";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.spec.ts",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: "auth.setup.ts",
      use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL ?? "chrome" },
    },
    {
      // specs que não dependem de sessão: rodam deslogadas
      name: "sem-sessao",
      testMatch: ["proxy.spec.ts", "login.spec.ts", "headers.spec.ts"],
      dependencies: ["setup"], // proxy.spec usa a sessão da recepcionista (ROT-02)
      use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL ?? "chrome" },
    },
    {
      name: "chromium",
      testIgnore: ["proxy.spec.ts", "login.spec.ts", "headers.spec.ts", "auth.setup.ts"],
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PW_CHANNEL ?? "chrome",
        storageState: "e2e/.auth/dono.json",
      },
    },
  ],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // Sem .env.local, aponta para o Supabase local (`npx supabase start`); chaves padrão do stack local.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
    },
  },
});
