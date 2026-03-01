import type { ThemeId, ThemeMode } from "./themes";
import type { TicketType } from "../constants/ticketTypes";

export type CardDensity = "small" | "medium" | "large";

export const ROWS_FOR_DENSITY: Record<CardDensity, number> = {
  small: 1,
  medium: 2,
  large: 3,
};

export type ThemePreference = "light" | "dark" | "system";

export type ViewMode = "board" | "list";

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
  ticketTypes: TicketType[];
  setTicketTypes: (types: TicketType[]) => void;
  ticketTypePresetId: string;
  setTicketTypePresetId: (id: string) => void;
  defaultTicketTypeId: string | null;
  setDefaultTicketTypeId: (id: string | null) => void;
  resetSettings: () => void;
}>;
