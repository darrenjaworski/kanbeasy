import { renderHook, act } from "@testing-library/react";
import { ThemeProvider } from "../ThemeProvider";
import { useTheme } from "../useTheme";
import { STORAGE_KEYS } from "../../constants/storage";
import { describe, beforeEach, it, expect } from "vitest";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe("defaultCardTypeId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to null when no stored value", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.defaultCardTypeId).toBeNull();
  });

  it("persists to localStorage when set", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setDefaultCardTypeId("feat"));

    expect(localStorage.getItem(STORAGE_KEYS.DEFAULT_CARD_TYPE)).toBe("feat");
  });

  it("removes from localStorage when set to null", () => {
    localStorage.setItem(STORAGE_KEYS.DEFAULT_CARD_TYPE, "feat");
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setDefaultCardTypeId(null));

    expect(localStorage.getItem(STORAGE_KEYS.DEFAULT_CARD_TYPE)).toBeNull();
  });

  it("loads initial value from localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.DEFAULT_CARD_TYPE, "feat");
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.defaultCardTypeId).toBe("feat");
  });

  it("clears when card types no longer include the selected type", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    // Set a default type that exists in the current types
    const currentTypes = result.current.cardTypes;
    expect(currentTypes.length).toBeGreaterThan(0);

    act(() => result.current.setDefaultCardTypeId(currentTypes[0].id));
    expect(result.current.defaultCardTypeId).toBe(currentTypes[0].id);

    // Remove all types - default should clear
    act(() => result.current.setCardTypes([]));
    expect(result.current.defaultCardTypeId).toBeNull();
  });

  it("retains when card types still include the selected type", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    const currentTypes = result.current.cardTypes;
    act(() => result.current.setDefaultCardTypeId(currentTypes[0].id));

    // Update types but keep the selected one
    act(() =>
      result.current.setCardTypes([
        currentTypes[0],
        { id: "new", label: "New", color: "#000" },
      ]),
    );
    expect(result.current.defaultCardTypeId).toBe(currentTypes[0].id);
  });
});
