import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/features/**/__tests__/*.test.{ts,tsx}", "src/shared/**/__tests__/*.test.{ts,tsx}", "src/app/**/__tests__/*.test.{ts,tsx}"],
    exclude: ["**/*.db.test.ts", "**/node_modules/**"],
    environment: "jsdom",
  },
});
