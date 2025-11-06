import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  js.configs.recommended,
  eslintConfigPrettier,
  // ...tsEslint.configs.recommended,
  // {
  //   ...pluginReact.configs.flat.recommended,
  //   languageOptions: {
  //     ...pluginReact.configs.flat.recommended.languageOptions,
  //     globals: {
  //       ...globals.serviceworker,
  //     },
  //   },
  // },
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
