import type { ThemeId, ThemeMode } from "./themes";
import type { CardType } from "../constants/cardTypes";

export type CardDensity = "small" | "medium" | "large";

export const ROWS_FOR_DENSITY: Record<CardDensity, number> = {
  small: 1,
  medium: 2,
  large: 3,
};

export type ThemePreference = "light" | "dark" | "system";

export type ViewMode = "board" | "list" | "calendar";

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
  owlModeEnabled: boolean;
  setOwlModeEnabled: (enabled: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  cardTypes: CardType[];
  setCardTypes: (types: CardType[]) => void;
  cardTypePresetId: string;
  setCardTypePresetId: (id: string) => void;
  defaultCardTypeId: string | null;
  setDefaultCardTypeId: (id: string | null) => void;
  compactHeader: boolean;
  setCompactHeader: (enabled: boolean) => void;
  keyboardShortcutsEnabled: boolean;
  setKeyboardShortcutsEnabled: (enabled: boolean) => void;
  columnOrderLocked: boolean;
  setColumnOrderLocked: (locked: boolean) => void;
  accentGradientEnabled: boolean;
  setAccentGradientEnabled: (enabled: boolean) => void;
  resetSettings: () => void;
}>;
