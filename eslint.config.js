import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config([
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Enforce strict equality
      eqeqeq: ["error", "always"],
      // Disallow console.log (allow warn/error for intentional logging)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Prefer const over let when variable is never reassigned
      "prefer-const": "error",
      // Require consistent type imports (type-only imports use `import type`)
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      // Tighten unused vars: error on unused vars, allow underscore-prefixed args
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Node environment for config and e2e files
  {
    files: [
      "playwright.config.{ts,js}",
      "tests-e2e/**",
      "vite.config.{ts,js}",
      "vitest.config.{ts,js}",
      "eslint.config.js",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // Disable formatting rules that conflict with Prettier
  eslintConfigPrettier,
]);
