import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { version } from "./package.json";

// https://vite.dev/config/
const config = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.ANALYZE === "true"
      ? [visualizer({ filename: "dist/bundle-stats.html", open: true })]
      : []),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
});

if (process?.env?.PUBLIC_URL) {
  config.base = process.env.PUBLIC_URL;
}

export default config;
