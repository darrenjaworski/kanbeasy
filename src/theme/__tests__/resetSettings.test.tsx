import { renderHook, act } from "@testing-library/react";
import { ThemeProvider } from "../ThemeProvider";
import { useTheme } from "../useTheme";
import { STORAGE_KEYS } from "../../constants/storage";
import { describe, beforeEach, it, expect } from "vitest";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe("resetSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

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

  it("resets ticket type preset to development", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setTicketTypePresetId("personal"));
    expect(result.current.ticketTypePresetId).toBe("personal");

    act(() => result.current.resetSettings());
    expect(result.current.ticketTypePresetId).toBe("development");
  });

  it("removes hasSeenWelcome from localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.HAS_SEEN_WELCOME, "true");
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.resetSettings());
    expect(localStorage.getItem(STORAGE_KEYS.HAS_SEEN_WELCOME)).toBeNull();
  });
});
