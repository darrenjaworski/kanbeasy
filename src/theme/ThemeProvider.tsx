import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./ThemeContext";
import type {
  CardDensity,
  ThemeContextValue,
  ThemePreference,
  ViewMode,
} from "./types";
import type { ThemeId, ThemeMode } from "./themes";
import { getDefaultThemeForMode, getThemeById } from "./themes";
import {
  getStringFromStorage,
  saveStringToStorage,
  getFromStorage,
  saveToStorage,
} from "../utils/storage";
import { STORAGE_KEYS } from "../constants/storage";
import { updateFavicon } from "./favicon";
import type { TicketType } from "../constants/ticketTypes";
import {
  DEFAULT_PRESET_ID,
  TICKET_TYPE_PRESETS,
} from "../constants/ticketTypes";

function getSystemTheme(): ThemeMode {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialThemePreference(): ThemePreference {
  const stored = getStringFromStorage(STORAGE_KEYS.THEME_PREFERENCE, "");
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  // Backward compat: infer from stored theme
  const themeStored = getStringFromStorage(STORAGE_KEYS.THEME, "");
  const theme = getThemeById(themeStored);
  if (theme) return theme.mode;
  if (themeStored === "light") return "light";
  if (themeStored === "dark") return "dark";
  // No stored data at all — default to system
  return "system";
}

function getInitialThemeId(preference: ThemePreference): ThemeId {
  const stored = getStringFromStorage(STORAGE_KEYS.THEME, "");

  // Already a valid theme ID
  if (getThemeById(stored)) {
    // If preference is "system", resolve to the OS-appropriate default
    if (preference === "system") {
      return getDefaultThemeForMode(getSystemTheme()).id;
    }
    return stored;
  }

  // Legacy migration: "light" / "dark"
  if (stored === "light") return "light-slate";
  if (stored === "dark") return "dark-slate";

  // System preference detection
  return getDefaultThemeForMode(getSystemTheme()).id;
}

function getInitialDensity(): CardDensity {
  const stored = getStringFromStorage(STORAGE_KEYS.CARD_DENSITY, "small");
  if (stored === "small" || stored === "medium" || stored === "large") {
    return stored;
  }
  return "small";
}

function getInitialViewMode(): ViewMode {
  const stored = getStringFromStorage(STORAGE_KEYS.VIEW_MODE, "board");
  if (stored === "board" || stored === "list") {
    return stored;
  }
  return "board";
}

function getInitialTicketTypePresetId(): string {
  const stored = getStringFromStorage(STORAGE_KEYS.TICKET_TYPE_PRESET, "");
  if (TICKET_TYPE_PRESETS.some((p) => p.id === stored) || stored === "custom") {
    return stored;
  }
  return DEFAULT_PRESET_ID;
}

function getInitialTicketTypes(presetId: string): TicketType[] {
  const stored = getFromStorage<TicketType[] | null>(
    STORAGE_KEYS.TICKET_TYPES,
    null,
  );
  if (Array.isArray(stored) && stored.length > 0) {
    return stored;
  }
  const preset = TICKET_TYPE_PRESETS.find((p) => p.id === presetId);
  return preset ? [...preset.types] : [];
}

export function ThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    getInitialThemePreference,
  );
  const [themeId, setThemeId] = useState<ThemeId>(() =>
    getInitialThemeId(themePreference),
  );
  const [cardDensity, setCardDensity] =
    useState<CardDensity>(getInitialDensity);
  const [columnResizingEnabled, setColumnResizingEnabled] = useState<boolean>(
    () => {
      const stored = getStringFromStorage(
        STORAGE_KEYS.COLUMN_RESIZING_ENABLED,
        "false",
      );
      return stored === "true";
    },
  );
  const [deleteColumnWarningEnabled, setDeleteColumnWarningEnabled] =
    useState<boolean>(() => {
      const stored = getStringFromStorage(
        STORAGE_KEYS.DELETE_COLUMN_WARNING,
        "true",
      );
      return stored === "true";
    });
  const [owlModeEnabled, setOwlModeEnabled] = useState<boolean>(() => {
    const stored = getStringFromStorage(STORAGE_KEYS.OWL_MODE_ENABLED, "false");
    return stored === "true";
  });
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [ticketTypePresetId, setTicketTypePresetId] = useState<string>(
    getInitialTicketTypePresetId,
  );
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>(() =>
    getInitialTicketTypes(ticketTypePresetId),
  );
  const [defaultTicketTypeId, setDefaultTicketTypeId] = useState<string | null>(
    () => getStringFromStorage(STORAGE_KEYS.DEFAULT_TICKET_TYPE, "") || null,
  );

  const setThemePreference = useCallback(
    (pref: ThemePreference) => {
      setThemePreferenceState(pref);
      const newMode = pref === "system" ? getSystemTheme() : pref;
      const currentTheme = getThemeById(themeId);
      if (currentTheme?.mode !== newMode) {
        setThemeId(getDefaultThemeForMode(newMode).id);
      }
    },
    [themeId],
  );

  // Listen for OS color-scheme changes when preference is "system"
  useEffect(() => {
    if (themePreference !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const mode: ThemeMode = e.matches ? "dark" : "light";
      setThemeId(getDefaultThemeForMode(mode).id);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [themePreference]);

  // Persist theme preference
  useEffect(() => {
    saveStringToStorage(STORAGE_KEYS.THEME_PREFERENCE, themePreference);
  }, [themePreference]);

  useEffect(() => {
    const theme = getThemeById(themeId);
    if (!theme) return;

    const root = document.documentElement;

    // Apply CSS custom properties
    root.style.setProperty("--color-bg", theme.colors.bg);
    root.style.setProperty("--color-surface", theme.colors.surface);
    root.style.setProperty("--color-text", theme.colors.text);
    root.style.setProperty("--color-accent", theme.colors.accent);

    // Toggle dark class for opacity-based patterns
    root.classList.toggle("dark", theme.mode === "dark");

    // Set color-scheme for native browser UI
    root.style.colorScheme = theme.mode;

    // Update favicon to match theme
    updateFavicon(theme.colors.surface, theme.colors.accent);

    // Persist
    saveStringToStorage(STORAGE_KEYS.THEME, themeId);
  }, [themeId]);

  useEffect(() => {
    saveStringToStorage(STORAGE_KEYS.CARD_DENSITY, cardDensity);
  }, [cardDensity]);

  useEffect(() => {
    saveStringToStorage(
      STORAGE_KEYS.COLUMN_RESIZING_ENABLED,
      String(columnResizingEnabled),
    );
  }, [columnResizingEnabled]);

  useEffect(() => {
    saveStringToStorage(
      STORAGE_KEYS.DELETE_COLUMN_WARNING,
      String(deleteColumnWarningEnabled),
    );
  }, [deleteColumnWarningEnabled]);

  useEffect(() => {
    saveStringToStorage(STORAGE_KEYS.OWL_MODE_ENABLED, String(owlModeEnabled));
  }, [owlModeEnabled]);

  useEffect(() => {
    saveStringToStorage(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  useEffect(() => {
    saveStringToStorage(STORAGE_KEYS.TICKET_TYPE_PRESET, ticketTypePresetId);
  }, [ticketTypePresetId]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TICKET_TYPES, ticketTypes);
  }, [ticketTypes]);

  useEffect(() => {
    if (defaultTicketTypeId) {
      saveStringToStorage(
        STORAGE_KEYS.DEFAULT_TICKET_TYPE,
        defaultTicketTypeId,
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.DEFAULT_TICKET_TYPE);
    }
  }, [defaultTicketTypeId]);

  // Clear default ticket type if it no longer exists in the current types
  useEffect(() => {
    if (
      defaultTicketTypeId &&
      !ticketTypes.some((t) => t.id === defaultTicketTypeId)
    ) {
      setDefaultTicketTypeId(null);
    }
  }, [ticketTypes, defaultTicketTypeId]);

  const resetSettings = useCallback(() => {
    // Clear all localStorage keys
    localStorage.removeItem(STORAGE_KEYS.THEME);
    localStorage.removeItem(STORAGE_KEYS.THEME_PREFERENCE);
    localStorage.removeItem(STORAGE_KEYS.CARD_DENSITY);
    localStorage.removeItem(STORAGE_KEYS.COLUMN_RESIZING_ENABLED);
    localStorage.removeItem(STORAGE_KEYS.DELETE_COLUMN_WARNING);
    localStorage.removeItem(STORAGE_KEYS.OWL_MODE_ENABLED);
    localStorage.removeItem(STORAGE_KEYS.VIEW_MODE);
    localStorage.removeItem(STORAGE_KEYS.TICKET_TYPE_PRESET);
    localStorage.removeItem(STORAGE_KEYS.TICKET_TYPES);
    localStorage.removeItem(STORAGE_KEYS.DEFAULT_TICKET_TYPE);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS_SECTIONS);
    localStorage.removeItem(STORAGE_KEYS.HAS_SEEN_WELCOME);

    // Reset state to defaults
    setThemePreferenceState("system");
    setThemeId(getDefaultThemeForMode(getSystemTheme()).id);
    setCardDensity("small");
    setColumnResizingEnabled(false);
    setDeleteColumnWarningEnabled(true);
    setOwlModeEnabled(false);
    setViewMode("board");
    setTicketTypePresetId(DEFAULT_PRESET_ID);
    const preset = TICKET_TYPE_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID);
    if (preset) setTicketTypes([...preset.types]);
    setDefaultTicketTypeId(null);
  }, []);

  const theme = getThemeById(themeId);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      setThemeId,
      isDark: theme?.mode === "dark",
      themeMode: theme?.mode ?? "light",
      themePreference,
      setThemePreference,
      cardDensity,
      setCardDensity,
      columnResizingEnabled,
      setColumnResizingEnabled,
      deleteColumnWarningEnabled,
      setDeleteColumnWarningEnabled,
      owlModeEnabled,
      setOwlModeEnabled,
      viewMode,
      setViewMode,
      ticketTypes,
      setTicketTypes,
      ticketTypePresetId,
      setTicketTypePresetId,
      defaultTicketTypeId,
      setDefaultTicketTypeId,
      resetSettings,
    }),
    [
      themeId,
      theme?.mode,
      themePreference,
      setThemePreference,
      cardDensity,
      columnResizingEnabled,
      deleteColumnWarningEnabled,
      owlModeEnabled,
      viewMode,
      ticketTypes,
      ticketTypePresetId,
      defaultTicketTypeId,
      resetSettings,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
