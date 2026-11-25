// ESLint: the strictest type-aware presets of typescript-eslint for every TypeScript and
// JavaScript file, plus selected core rules. CI runs `eslint --max-warnings 0`, so every
// finding is an error; an exception needs an inline disable with a reason (`-- why`).
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import playwright from "eslint-plugin-playwright";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/", "core/", "node_modules/", "test-results/", "playwright-report/", "spec/"] },
  { linterOptions: { reportUnusedDisableDirectives: "error", reportUnusedInlineConfigs: "error" } },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.e2e.json", "./tsconfig.tools.json", "./tsconfig.sw.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Core rules beyond the recommended set.
      eqeqeq: ["error", "always"],
      curly: ["error", "multi-line"],
      "no-implicit-coercion": "error",
      "no-param-reassign": "error",
      "no-console": ["error", { allow: ["log"] }],
      "no-eval": "error",
      "no-new-func": "error",
      "no-implied-eval": "off",
      "no-var": "error",
      "prefer-const": "error",
      "no-shadow": "off",
      "no-unneeded-ternary": "error",
      "no-nested-ternary": "off",
      "require-unicode-regexp": "error",
      radix: "error",
      // typescript-eslint rules beyond strictTypeChecked.
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true, allowTypedFunctionExpressions: true }],
      "@typescript-eslint/strict-boolean-expressions": ["error", { allowString: false, allowNumber: false, allowNullableObject: false }],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/no-unnecessary-qualifier": "error",
      "@typescript-eslint/no-useless-empty-export": "error",
      "@typescript-eslint/method-signature-style": "error",
      "@typescript-eslint/default-param-last": "error",
      "@typescript-eslint/no-loop-func": "error",
      "@typescript-eslint/prefer-enum-initializers": "error",
      "@typescript-eslint/no-unsafe-type-assertion": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    // JavaScript files declare their types in JSDoc, checked by tsc (checkJs); these two rules
    // only see TypeScript annotations.
    files: ["**/*.js", "**/*.mjs"],
    rules: { "@typescript-eslint/explicit-function-return-type": "off", "@typescript-eslint/explicit-module-boundary-types": "off" },
  },
  {
    files: ["web/src/**/*.ts"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["web/sw.js"],
    languageOptions: { globals: globals.serviceworker, sourceType: "script" },
  },
  {
    files: ["scripts/**/*.mjs", "eslint.config.mjs", "playwright.config.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["e2e/**/*.ts"],
    ...playwright.configs["flat/recommended"],
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "playwright/no-skipped-test": "error",
      "playwright/no-focused-test": "error",
      "playwright/no-wait-for-timeout": "error",
      "playwright/no-conditional-in-test": "error",
      "playwright/no-conditional-expect": "error",
      "playwright/expect-expect": "error",
      "playwright/valid-title": "off",
    },
  },
);
