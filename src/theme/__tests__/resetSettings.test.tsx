import { renderHook, act } from "@testing-library/react";
import { ThemeProvider } from "../ThemeProvider";
import { useTheme } from "../useTheme";
import { STORAGE_KEYS } from "../../constants/storage";
import { describe, it, expect } from "vitest";
import type { ReactNode } from "react";
import { seedKv, kvGet } from "../../utils/db";

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe("resetSettings", () => {
  it("resets theme preference to system and theme to default for system mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setThemePreference("dark"));
    act(() => result.current.setThemeId("dark-emerald"));
    expect(result.current.themePreference).toBe("dark");
    expect(result.current.themeId).toBe("dark-emerald");

    act(() => result.current.resetSettings());
    expect(result.current.themePreference).toBe("system");
    // jsdom matchMedia defaults to light, so default theme should be light-slate
    expect(result.current.themeId).toBe("light-slate");
  });

  it("resets card density to small (compact)", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setCardDensity("large"));
    expect(result.current.cardDensity).toBe("large");

    act(() => result.current.resetSettings());
    expect(result.current.cardDensity).toBe("small");
  });

  it("resets column resizing to disabled", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setColumnResizingEnabled(true));
    expect(result.current.columnResizingEnabled).toBe(true);

    act(() => result.current.resetSettings());
    expect(result.current.columnResizingEnabled).toBe(false);
  });

  it("resets delete column warning to enabled", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setDeleteColumnWarningEnabled(false));
    expect(result.current.deleteColumnWarningEnabled).toBe(false);

    act(() => result.current.resetSettings());
    expect(result.current.deleteColumnWarningEnabled).toBe(true);
  });

  it("resets owl mode to disabled", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setOwlModeEnabled(true));
    expect(result.current.owlModeEnabled).toBe(true);

    act(() => result.current.resetSettings());
    expect(result.current.owlModeEnabled).toBe(false);
  });

  it("resets view mode to board", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setViewMode("list"));
    expect(result.current.viewMode).toBe("list");

    act(() => result.current.resetSettings());
    expect(result.current.viewMode).toBe("board");
  });

  it("resets card type preset to development", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setCardTypePresetId("personal"));
    expect(result.current.cardTypePresetId).toBe("personal");

    act(() => result.current.resetSettings());
    expect(result.current.cardTypePresetId).toBe("development");
  });

  it("resets default card type to null", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setDefaultCardTypeId("feat"));
    expect(result.current.defaultCardTypeId).toBe("feat");

    act(() => result.current.resetSettings());
    expect(result.current.defaultCardTypeId).toBeNull();
  });

  it("resets column order locked to unlocked", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setColumnOrderLocked(true));
    expect(result.current.columnOrderLocked).toBe(true);

    act(() => result.current.resetSettings());
    expect(result.current.columnOrderLocked).toBe(false);
  });

  it("removes hasSeenWelcome from db", () => {
    seedKv(STORAGE_KEYS.HAS_SEEN_WELCOME, "true");
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.resetSettings());
    expect(kvGet(STORAGE_KEYS.HAS_SEEN_WELCOME, null)).toBeNull();
  });
});
