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
import { kvGet, kvSet, kvRemove } from "../utils/db";
import { STORAGE_KEYS } from "../constants/storage";
import { updateFavicon } from "./favicon";
import type { CardType } from "../constants/cardTypes";
import { DEFAULT_PRESET_ID, CARD_TYPE_PRESETS } from "../constants/cardTypes";
import { useStoredBool, useStoredString } from "./useStoredSetting";

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
  // ── Theme (complex: CSS vars, favicon, system listener) ──────────────────
  const [themePreference, setThemePreferenceState] = useStoredString(
    STORAGE_KEYS.THEME_PREFERENCE,
    getInitialThemePreference,
  );
  const [themeId, setThemeId] = useState<ThemeId>(() =>
    getInitialThemeId(themePreference),
  );

  // ── Simple string settings ────────────────────────────────────────────────
  const [cardDensity, setCardDensity] = useStoredString(
    STORAGE_KEYS.CARD_DENSITY,
    getInitialDensity,
  );
  const [viewMode, setViewMode] = useStoredString(
    STORAGE_KEYS.VIEW_MODE,
    getInitialViewMode,
  );
  const [cardTypePresetId, setCardTypePresetId] = useStoredString(
    STORAGE_KEYS.CARD_TYPE_PRESET,
    getInitialCardTypePresetId,
  );

  // ── Simple boolean settings ───────────────────────────────────────────────
  const [columnResizingEnabled, setColumnResizingEnabled] = useStoredBool(
    STORAGE_KEYS.COLUMN_RESIZING_ENABLED,
    false,
  );
  const [deleteColumnWarningEnabled, setDeleteColumnWarningEnabled] =
    useStoredBool(STORAGE_KEYS.DELETE_COLUMN_WARNING, true);
  const [owlModeEnabled, setOwlModeEnabled] = useStoredBool(
    STORAGE_KEYS.OWL_MODE_ENABLED,
    false,
  );
  const [compactHeader, setCompactHeader] = useStoredBool(
    STORAGE_KEYS.COMPACT_HEADER,
    false,
  );
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useStoredBool(
    STORAGE_KEYS.KEYBOARD_SHORTCUTS_ENABLED,
    false,
  );
  const [columnOrderLocked, setColumnOrderLocked] = useStoredBool(
    STORAGE_KEYS.COLUMN_ORDER_LOCKED,
    false,
  );

  // ── Card types (complex: preset lookup, conditional remove) ───────────────
  const [cardTypes, setCardTypes] = useState<CardType[]>(() =>
    getInitialCardTypes(cardTypePresetId),
  );
  const [defaultCardTypeId, setDefaultCardTypeId] = useState<string | null>(
    () => kvGet<string>(STORAGE_KEYS.DEFAULT_CARD_TYPE, "") || null,
  );

  // ── Theme side-effects ────────────────────────────────────────────────────

  const setThemePreference = useCallback(
    (pref: ThemePreference) => {
      setThemePreferenceState(pref);
      const newMode = pref === "system" ? getSystemTheme() : pref;
      const currentTheme = getThemeById(themeId);
      if (currentTheme?.mode !== newMode) {
        setThemeId(getDefaultThemeForMode(newMode).id);
      }
    },
    [themeId, setThemePreferenceState],
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

  // Apply CSS custom properties, dark class, color-scheme, favicon, and persist
  useEffect(() => {
    const theme = getThemeById(themeId);
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty("--color-bg", theme.colors.bg);
    root.style.setProperty("--color-surface", theme.colors.surface);
    root.style.setProperty("--color-text", theme.colors.text);
    root.style.setProperty("--color-accent", theme.colors.accent);
    root.classList.toggle("dark", theme.mode === "dark");
    root.style.colorScheme = theme.mode;
    updateFavicon(theme.colors.surface, theme.colors.accent);
    kvSet(STORAGE_KEYS.THEME, themeId);
  }, [themeId]);

  // Persist card types
  useEffect(() => {
    kvSet(STORAGE_KEYS.CARD_TYPES, cardTypes);
  }, [cardTypes]);

  // Persist default card type (remove when null)
  useEffect(() => {
    if (defaultCardTypeId) {
      kvSet(STORAGE_KEYS.DEFAULT_CARD_TYPE, defaultCardTypeId);
    } else {
      kvRemove(STORAGE_KEYS.DEFAULT_CARD_TYPE);
    }
  }, [defaultCardTypeId]);

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
    kvRemove(STORAGE_KEYS.THEME);
    kvRemove(STORAGE_KEYS.THEME_PREFERENCE);
    kvRemove(STORAGE_KEYS.CARD_TYPES);
    kvRemove(STORAGE_KEYS.DEFAULT_CARD_TYPE);
    kvRemove(STORAGE_KEYS.HAS_SEEN_WELCOME);

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
    setColumnOrderLocked(false);
  }, [
    setCardDensity,
    setCardTypePresetId,
    setColumnOrderLocked,
    setColumnResizingEnabled,
    setCompactHeader,
    setDeleteColumnWarningEnabled,
    setKeyboardShortcutsEnabled,
    setOwlModeEnabled,
    setThemePreferenceState,
    setViewMode,
  ]);

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
      columnOrderLocked,
      setColumnOrderLocked,
      resetSettings,
    }),
    [
      themeId,
      theme?.mode,
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
      cardTypePresetId,
      setCardTypePresetId,
      defaultCardTypeId,
      compactHeader,
      setCompactHeader,
      keyboardShortcutsEnabled,
      setKeyboardShortcutsEnabled,
      columnOrderLocked,
      setColumnOrderLocked,
      resetSettings,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
