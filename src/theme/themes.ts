export type ThemeMode = "light" | "dark";

interface ThemeColors {
  readonly bg: string;
  readonly surface: string;
  readonly text: string;
  readonly accent: string;
}

interface ThemeDefinition {
  readonly id: string;
  readonly name: string;
  readonly mode: ThemeMode;
  readonly colors: ThemeColors;
}

export const themes: readonly ThemeDefinition[] = [
  // ── Light themes ───────────────────────────────────────
  {
    id: "light-slate",
    name: "Slate",
    mode: "light",
    colors: {
      bg: "#f8fafc",
      surface: "#ffffff",
      text: "#0f172a",
      accent: "#6366f1",
    },
  },
  {
    id: "light-stone",
    name: "Stone",
    mode: "light",
    colors: {
      bg: "#f5f0eb",
      surface: "#faf8f5",
      text: "#1c1917",
      accent: "#d97706",
    },
  },
  {
    id: "light-rose",
    name: "Rose",
    mode: "light",
    colors: {
      bg: "#fff1f2",
      surface: "#ffffff",
      text: "#1f2937",
      accent: "#e11d48",
    },
  },
  // ── Dark themes ────────────────────────────────────────
  {
    id: "dark-slate",
    name: "Midnight",
    mode: "dark",
    colors: {
      bg: "#0b1220",
      surface: "#0f172a",
      text: "#e2e8f0",
      accent: "#818cf8",
    },
  },
  {
    id: "dark-emerald",
    name: "Forest",
    mode: "dark",
    colors: {
      bg: "#052e16",
      surface: "#064e3b",
      text: "#d1fae5",
      accent: "#34d399",
    },
  },
  {
    id: "dark-purple",
    name: "Twilight",
    mode: "dark",
    colors: {
      bg: "#1e1034",
      surface: "#2d1b4e",
      text: "#e9d5ff",
      accent: "#c084fc",
    },
  },
] as const;

export type ThemeId = (typeof themes)[number]["id"];

export function getThemeById(id: string): ThemeDefinition | undefined {
  return themes.find((t) => t.id === id);
}

export function getDefaultThemeForMode(mode: ThemeMode): ThemeDefinition {
  return themes.find((t) => t.mode === mode) ?? themes[0];
}
