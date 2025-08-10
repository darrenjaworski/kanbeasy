export type Theme = "light" | "dark";

export type ThemeContextValue = Readonly<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}>;
