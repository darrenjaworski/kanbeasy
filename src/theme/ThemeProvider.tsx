import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./ThemeContext";
import type { CardDensity } from "./types";
import type { ThemeId } from "./themes";
import {
  getDefaultThemeForMode,
  getThemeById,
} from "./themes";
import {
  getStringFromStorage,
  saveStringToStorage,
} from "../utils/storage";
import { STORAGE_KEYS } from "../constants/storage";

function getSystemTheme(): "light" | "dark" {
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

function getInitialThemeId(): ThemeId {
  const stored = getStringFromStorage(STORAGE_KEYS.THEME, "");

  // Already a valid theme ID
  if (getThemeById(stored)) {
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
  const [themeId, setThemeId] = useState<ThemeId>(getInitialThemeId);
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

  const theme = getThemeById(themeId);

  const value = useMemo<import("./types").ThemeContextValue>(
    () => ({
      themeId,
      setThemeId,
      isDark: theme?.mode === "dark",
      themeMode: theme?.mode ?? "light",
      cardDensity,
      setCardDensity,
      columnResizingEnabled,
      setColumnResizingEnabled,
    }),
    [themeId, theme?.mode, cardDensity, columnResizingEnabled],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
