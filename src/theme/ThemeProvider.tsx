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
import { kvGet, kvGetBool, kvSet, kvSetBool, kvRemove } from "../utils/db";
import { STORAGE_KEYS } from "../constants/storage";
import { updateFavicon } from "./favicon";
import type { CardType } from "../constants/cardTypes";
import { DEFAULT_PRESET_ID, CARD_TYPE_PRESETS } from "../constants/cardTypes";
import type { CardLayout } from "../constants/cardLayout";
import {
  DEFAULT_CARD_LAYOUT,
  isValidCardLayout,
} from "../constants/cardLayout";

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
  const stored = kvGet<string>(STORAGE_KEYS.THEME_PREFERENCE, "");
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  // Backward compat: infer from stored theme
  const themeStored = kvGet<string>(STORAGE_KEYS.THEME, "");
  const theme = getThemeById(themeStored);
  if (theme) return theme.mode;
  if (themeStored === "light") return "light";
  if (themeStored === "dark") return "dark";
  // No stored data at all — default to system
  return "system";
}

function getInitialThemeId(preference: ThemePreference): ThemeId {
  const stored = kvGet<string>(STORAGE_KEYS.THEME, "");

  // Already a valid theme ID
  if (getThemeById(stored)) {
    if (preference === "system") {
      // Keep the stored theme if it matches the current system mode,
      // otherwise fall back to the default for the system mode
      const systemMode = getSystemTheme();
      const storedTheme = getThemeById(stored)!;
      return storedTheme.mode === systemMode
        ? stored
        : getDefaultThemeForMode(systemMode).id;
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
  const stored = kvGet<string>(STORAGE_KEYS.CARD_DENSITY, "small");
  if (stored === "small" || stored === "medium" || stored === "large") {
    return stored;
  }
  return "small";
}

function getInitialViewMode(): ViewMode {
  const stored = kvGet<string>(STORAGE_KEYS.VIEW_MODE, "board");
  if (stored === "board" || stored === "list" || stored === "calendar") {
    return stored;
  }
  return "board";
}

function getInitialCardTypePresetId(): string {
  const stored = kvGet<string>(STORAGE_KEYS.CARD_TYPE_PRESET, "");
  if (CARD_TYPE_PRESETS.some((p) => p.id === stored) || stored === "custom") {
    return stored;
  }
  return DEFAULT_PRESET_ID;
}

function getInitialCardTypes(presetId: string): CardType[] {
  const stored = kvGet<CardType[] | null>(STORAGE_KEYS.CARD_TYPES, null);
  if (Array.isArray(stored) && stored.length > 0) {
    return stored;
  }
  const preset = CARD_TYPE_PRESETS.find((p) => p.id === presetId);
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
    () => kvGetBool(STORAGE_KEYS.COLUMN_RESIZING_ENABLED, false),
  );
  const [deleteColumnWarningEnabled, setDeleteColumnWarningEnabled] =
    useState<boolean>(() =>
      kvGetBool(STORAGE_KEYS.DELETE_COLUMN_WARNING, true),
    );
  const [owlModeEnabled, setOwlModeEnabled] = useState<boolean>(() =>
    kvGetBool(STORAGE_KEYS.OWL_MODE_ENABLED, false),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [cardTypePresetId, setCardTypePresetId] = useState<string>(
    getInitialCardTypePresetId,
  );
  const [cardTypes, setCardTypes] = useState<CardType[]>(() =>
    getInitialCardTypes(cardTypePresetId),
  );
  const [defaultCardTypeId, setDefaultCardTypeId] = useState<string | null>(
    () => kvGet<string>(STORAGE_KEYS.DEFAULT_CARD_TYPE, "") || null,
  );
  const [compactHeader, setCompactHeader] = useState<boolean>(() =>
    kvGetBool(STORAGE_KEYS.COMPACT_HEADER, false),
  );
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] =
    useState<boolean>(() =>
      kvGetBool(STORAGE_KEYS.KEYBOARD_SHORTCUTS_ENABLED, false),
    );
  const [cardLayout, setCardLayout] = useState<CardLayout>(() => {
    const stored = kvGet<unknown>(STORAGE_KEYS.CARD_LAYOUT, null);
    return isValidCardLayout(stored) ? stored : DEFAULT_CARD_LAYOUT;
  });

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
    kvSet(STORAGE_KEYS.THEME_PREFERENCE, themePreference);
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
    kvSet(STORAGE_KEYS.THEME, themeId);
  }, [themeId]);

  useEffect(() => {
    kvSet(STORAGE_KEYS.CARD_DENSITY, cardDensity);
  }, [cardDensity]);

  useEffect(() => {
    kvSetBool(STORAGE_KEYS.COLUMN_RESIZING_ENABLED, columnResizingEnabled);
  }, [columnResizingEnabled]);

  useEffect(() => {
    kvSetBool(STORAGE_KEYS.DELETE_COLUMN_WARNING, deleteColumnWarningEnabled);
  }, [deleteColumnWarningEnabled]);

  useEffect(() => {
    kvSetBool(STORAGE_KEYS.OWL_MODE_ENABLED, owlModeEnabled);
  }, [owlModeEnabled]);

  useEffect(() => {
    kvSet(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  useEffect(() => {
    kvSet(STORAGE_KEYS.CARD_TYPE_PRESET, cardTypePresetId);
  }, [cardTypePresetId]);

  useEffect(() => {
    kvSet(STORAGE_KEYS.CARD_TYPES, cardTypes);
  }, [cardTypes]);

  useEffect(() => {
    if (defaultCardTypeId) {
      kvSet(STORAGE_KEYS.DEFAULT_CARD_TYPE, defaultCardTypeId);
    } else {
      kvRemove(STORAGE_KEYS.DEFAULT_CARD_TYPE);
    }
  }, [defaultCardTypeId]);

  useEffect(() => {
    kvSetBool(STORAGE_KEYS.COMPACT_HEADER, compactHeader);
  }, [compactHeader]);

  useEffect(() => {
    kvSetBool(
      STORAGE_KEYS.KEYBOARD_SHORTCUTS_ENABLED,
      keyboardShortcutsEnabled,
    );
  }, [keyboardShortcutsEnabled]);

  useEffect(() => {
    kvSet(STORAGE_KEYS.CARD_LAYOUT, cardLayout);
  }, [cardLayout]);

  // Clear default card type if it no longer exists in the current types
  useEffect(() => {
    if (
      defaultCardTypeId &&
      !cardTypes.some((t) => t.id === defaultCardTypeId)
    ) {
      setDefaultCardTypeId(null);
    }
  }, [cardTypes, defaultCardTypeId]);

  const resetSettings = useCallback(() => {
    // Clear all settings from db
    kvRemove(STORAGE_KEYS.THEME);
    kvRemove(STORAGE_KEYS.THEME_PREFERENCE);
    kvRemove(STORAGE_KEYS.CARD_DENSITY);
    kvRemove(STORAGE_KEYS.COLUMN_RESIZING_ENABLED);
    kvRemove(STORAGE_KEYS.DELETE_COLUMN_WARNING);
    kvRemove(STORAGE_KEYS.OWL_MODE_ENABLED);
    kvRemove(STORAGE_KEYS.VIEW_MODE);
    kvRemove(STORAGE_KEYS.CARD_TYPE_PRESET);
    kvRemove(STORAGE_KEYS.CARD_TYPES);
    kvRemove(STORAGE_KEYS.DEFAULT_CARD_TYPE);
    kvRemove(STORAGE_KEYS.COMPACT_HEADER);
    kvRemove(STORAGE_KEYS.KEYBOARD_SHORTCUTS_ENABLED);
    kvRemove(STORAGE_KEYS.CARD_LAYOUT);
    kvRemove(STORAGE_KEYS.HAS_SEEN_WELCOME);

    // Reset state to defaults
    setThemePreferenceState("system");
    setThemeId(getDefaultThemeForMode(getSystemTheme()).id);
    setCardDensity("small");
    setColumnResizingEnabled(false);
    setDeleteColumnWarningEnabled(true);
    setOwlModeEnabled(false);
    setViewMode("board");
    setCardTypePresetId(DEFAULT_PRESET_ID);
    const preset = CARD_TYPE_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID);
    if (preset) setCardTypes([...preset.types]);
    setDefaultCardTypeId(null);
    setCompactHeader(false);
    setKeyboardShortcutsEnabled(false);
    setCardLayout(DEFAULT_CARD_LAYOUT);
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
      cardTypes,
      setCardTypes,
      cardTypePresetId,
      setCardTypePresetId,
      defaultCardTypeId,
      setDefaultCardTypeId,
      compactHeader,
      setCompactHeader,
      keyboardShortcutsEnabled,
      setKeyboardShortcutsEnabled,
      cardLayout,
      setCardLayout,
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
      cardTypes,
      cardTypePresetId,
      defaultCardTypeId,
      compactHeader,
      keyboardShortcutsEnabled,
      cardLayout,
      resetSettings,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
