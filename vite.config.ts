import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { version } from "./package.json";

// https://vite.dev/config/
const config = defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
});

if (process?.env?.PUBLIC_URL) {
  config.base = process.env.PUBLIC_URL;
}

export default config;
