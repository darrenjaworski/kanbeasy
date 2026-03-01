import { renderHook, act } from "@testing-library/react";
import { ThemeProvider } from "../ThemeProvider";
import { useTheme } from "../useTheme";
import { STORAGE_KEYS } from "../../constants/storage";
import { describe, beforeEach, it, expect } from "vitest";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe("defaultTicketTypeId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to null when no stored value", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.defaultTicketTypeId).toBeNull();
  });

  it("persists to localStorage when set", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setDefaultTicketTypeId("feat"));

    expect(localStorage.getItem(STORAGE_KEYS.DEFAULT_TICKET_TYPE)).toBe("feat");
  });

  it("removes from localStorage when set to null", () => {
    localStorage.setItem(STORAGE_KEYS.DEFAULT_TICKET_TYPE, "feat");
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.setDefaultTicketTypeId(null));

    expect(localStorage.getItem(STORAGE_KEYS.DEFAULT_TICKET_TYPE)).toBeNull();
  });

  it("loads initial value from localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.DEFAULT_TICKET_TYPE, "feat");
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.defaultTicketTypeId).toBe("feat");
  });

  it("clears when ticket types no longer include the selected type", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    // Set a default type that exists in the current types
    const currentTypes = result.current.ticketTypes;
    expect(currentTypes.length).toBeGreaterThan(0);

    act(() => result.current.setDefaultTicketTypeId(currentTypes[0].id));
    expect(result.current.defaultTicketTypeId).toBe(currentTypes[0].id);

    // Remove all types - default should clear
    act(() => result.current.setTicketTypes([]));
    expect(result.current.defaultTicketTypeId).toBeNull();
  });

  it("retains when ticket types still include the selected type", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    const currentTypes = result.current.ticketTypes;
    act(() => result.current.setDefaultTicketTypeId(currentTypes[0].id));

    // Update types but keep the selected one
    act(() =>
      result.current.setTicketTypes([
        currentTypes[0],
        { id: "new", label: "New", color: "#000" },
      ]),
    );
    expect(result.current.defaultTicketTypeId).toBe(currentTypes[0].id);
  });
});
