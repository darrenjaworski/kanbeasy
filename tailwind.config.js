/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          light: "#f8fafc",
          dark: "#0b1220",
        },
        surface: {
          light: "#ffffff",
          dark: "#0f172a",
        },
        text: {
          light: "#0f172a",
          dark: "#e2e8f0",
        },
      },
    },
  },
  plugins: [],
};
