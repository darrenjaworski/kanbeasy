import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./ThemeContext";
import type { Theme, ThemeContextValue, CardDensity } from "./types";

const STORAGE_KEY = "kanbeasy:theme";
const DENSITY_KEY = "kanbeasy:cardDensity";
const COLUMN_RESIZE_KEY = "kanbeasy:columnResizingEnabled";

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
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  return stored ?? getSystemTheme();
}

function getInitialDensity(): CardDensity {
  if (typeof window === "undefined") return "medium";
  const stored = window.localStorage.getItem(DENSITY_KEY) as CardDensity | null;
  return stored ?? "medium";
}

export function ThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [cardDensity, setCardDensity] =
    useState<CardDensity>(getInitialDensity);
  const [columnResizingEnabled, setColumnResizingEnabled] = useState<boolean>(
    () => {
      if (typeof window === "undefined") return false;
      const stored = window.localStorage.getItem(COLUMN_RESIZE_KEY);
      return stored === null ? false : stored === "true";
    }
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DENSITY_KEY, cardDensity);
    } catch {
      /* ignore */
    }
  }, [cardDensity]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        COLUMN_RESIZE_KEY,
        String(columnResizingEnabled)
      );
    } catch {
      /* ignore */
    }
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
