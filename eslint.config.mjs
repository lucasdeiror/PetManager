import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // AD-010: data formatada sem timeZone sai no fuso do servidor (UTC na Vercel).
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name=/^toLocale(Date|Time)String$/]:not(:has(Property[key.name='timeZone']))",
          message: "Data sem timeZone: use src/shared/data/fuso.ts (AD-010).",
        },
        {
          // `style` libera número (moeda); data não tem a opção `style`.
          selector:
            "CallExpression[callee.property.name='toLocaleString']:not(:has(Property[key.name=/^(timeZone|style)$/]))",
          message: "toLocaleString sem timeZone (data) nem style (número): use src/shared/data/fuso.ts (AD-010).",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
