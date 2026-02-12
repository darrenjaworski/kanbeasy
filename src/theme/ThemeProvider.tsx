import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./ThemeContext";
import type { Theme, CardDensity } from "./types";
import {
  getStringFromStorage,
  saveStringToStorage,
} from "../utils/storage";
import { STORAGE_KEYS } from "../constants/storage";

function getSystemTheme(): Theme {
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

function getInitialTheme(): Theme {
  const stored = getStringFromStorage(STORAGE_KEYS.THEME, "");
  if (stored === "dark" || stored === "light") {
    return stored;
  }
  return getSystemTheme();
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
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [cardDensity, setCardDensity] =
    useState<CardDensity>(getInitialDensity);
  const [columnResizingEnabled, setColumnResizingEnabled] = useState<boolean>(
    () => {
      const stored = getStringFromStorage(STORAGE_KEYS.COLUMN_RESIZING_ENABLED, "false");
      return stored === "true";
    }
  );

  useEffect(() => {
    saveStringToStorage(STORAGE_KEYS.THEME, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    saveStringToStorage(STORAGE_KEYS.CARD_DENSITY, cardDensity);
  }, [cardDensity]);

  useEffect(() => {
    saveStringToStorage(STORAGE_KEYS.COLUMN_RESIZING_ENABLED, String(columnResizingEnabled));
  }, [columnResizingEnabled]);

  const value = useMemo<import("./types").ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      cardDensity,
      setCardDensity,
      columnResizingEnabled,
      setColumnResizingEnabled,
    }),
    [theme, cardDensity, columnResizingEnabled]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
