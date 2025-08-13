import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      exclude: [
        "playwright-report/**",
        "playwright.config.{ts,js,mjs,cjs}",
        "tests-e2e/**",
        "eslint.config.js",
        "vite.config.ts",
        "vitest.config.ts",
        "dist/**",
        "vite-env.d.ts",
      ],
    },
  },
});
