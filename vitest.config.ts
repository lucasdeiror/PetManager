import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/features/**/__tests__/*.test.ts", "src/shared/**/__tests__/*.test.ts"],
    exclude: ["**/*.db.test.ts", "**/node_modules/**"],
    environment: "jsdom",
  },
});
