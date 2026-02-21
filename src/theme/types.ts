import type { ThemeId, ThemeMode } from "./themes";

export type CardDensity = "small" | "medium" | "large";

export type ThemeContextValue = Readonly<{
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  isDark: boolean;
  themeMode: ThemeMode;
  cardDensity: CardDensity;
  setCardDensity: (d: CardDensity) => void;
  columnResizingEnabled: boolean;
  setColumnResizingEnabled: (enabled: boolean) => void;
}>;
