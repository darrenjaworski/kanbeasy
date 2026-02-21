import type { ThemeId, ThemeMode } from "./themes";

export type CardDensity = "small" | "medium" | "large";

export type ThemePreference = "light" | "dark" | "system";

export type ThemeContextValue = Readonly<{
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  isDark: boolean;
  themeMode: ThemeMode;
  themePreference: ThemePreference;
  setThemePreference: (p: ThemePreference) => void;
  cardDensity: CardDensity;
  setCardDensity: (d: CardDensity) => void;
  columnResizingEnabled: boolean;
  setColumnResizingEnabled: (enabled: boolean) => void;
  deleteColumnWarningEnabled: boolean;
  setDeleteColumnWarningEnabled: (enabled: boolean) => void;
}>;
