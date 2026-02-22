import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./ThemeContext";
import type { CardDensity, ThemeContextValue, ThemePreference } from "./types";
import type { ThemeId, ThemeMode } from "./themes";
import { getDefaultThemeForMode, getThemeById } from "./themes";
import { getStringFromStorage, saveStringToStorage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants/storage";

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
      return getDefaultThemeForMode(getSystemTheme()).id as ThemeId;
    }
    return stored as ThemeId;
  }

  // Legacy migration: "light" / "dark"
  if (stored === "light") return "light-slate";
  if (stored === "dark") return "dark-slate";

  // System preference detection
  return getDefaultThemeForMode(getSystemTheme()).id as ThemeId;
}

function getInitialDensity(): CardDensity {
  const stored = getStringFromStorage(STORAGE_KEYS.CARD_DENSITY, "medium");
  if (stored === "small" || stored === "medium" || stored === "large") {
    return stored;
  }
  return "medium";
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

  const setThemePreference = useCallback(
    (pref: ThemePreference) => {
      setThemePreferenceState(pref);
      const newMode = pref === "system" ? getSystemTheme() : pref;
      const currentTheme = getThemeById(themeId);
      if (currentTheme?.mode !== newMode) {
        setThemeId(getDefaultThemeForMode(newMode).id as ThemeId);
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
      setThemeId(getDefaultThemeForMode(mode).id as ThemeId);
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
    }),
    [
      themeId,
      theme?.mode,
      themePreference,
      setThemePreference,
      cardDensity,
      columnResizingEnabled,
      deleteColumnWarningEnabled,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
