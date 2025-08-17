export type Theme = "light" | "dark";

export type CardDensity = "small" | "medium" | "large";

export type ThemeContextValue = Readonly<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  cardDensity: CardDensity;
  setCardDensity: (d: CardDensity) => void;
  columnResizingEnabled: boolean;
  setColumnResizingEnabled: (enabled: boolean) => void;
}>;
