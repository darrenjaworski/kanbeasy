import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { ThemeProvider } from "../theme/ThemeProvider";
import { BoardProvider } from "../board/BoardProvider";
import { STORAGE_KEYS } from "../constants/storage";
import { describe, it, expect, beforeEach, vi } from "vitest";

function renderApp() {
  return render(
    <ThemeProvider>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>,
  );
}

function mockMatchMedia(prefersDark: boolean) {
  type Listener = (e: MediaQueryListEvent) => void;
  const listeners: Listener[] = [];
  const mql: Omit<MediaQueryList, "matches"> & { matches: boolean } = {
    matches: prefersDark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: vi.fn((_event: string, cb: unknown) => {
      listeners.push(cb as Listener);
    }),
    removeEventListener: vi.fn((_event: string, cb: unknown) => {
      const idx = listeners.indexOf(cb as Listener);
      if (idx >= 0) listeners.splice(idx, 1);
    }),
    dispatchEvent: vi.fn(),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };

  window.matchMedia = vi.fn().mockReturnValue(mql as unknown as MediaQueryList);

  return {
    mql,
    /** Simulate an OS color-scheme change */
    toggle(dark: boolean) {
      mql.matches = dark;
      for (const cb of [...listeners]) {
        cb({ matches: dark } as MediaQueryListEvent);
      }
    },
  };
}

describe("system theme preference", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
  });

  it("applies dark theme when preference is system and OS is dark", async () => {
    mockMatchMedia(true);

    const user = userEvent.setup();
    renderApp();

    // Open settings and select System
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg = await screen.findByRole("dialog", { name: /settings/i });
    await user.click(within(dlg).getByRole("button", { name: /system/i }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("applies light theme when preference is system and OS is light", async () => {
    mockMatchMedia(false);

    const user = userEvent.setup();
    renderApp();

    // Open settings and select System
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg = await screen.findByRole("dialog", { name: /settings/i });
    await user.click(within(dlg).getByRole("button", { name: /system/i }));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("follows OS changes when preference is system", async () => {
    const { toggle } = mockMatchMedia(false);

    const user = userEvent.setup();
    renderApp();

    // Open settings and select System
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg = await screen.findByRole("dialog", { name: /settings/i });
    await user.click(within(dlg).getByRole("button", { name: /system/i }));

    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // Simulate OS switching to dark
    act(() => toggle(true));
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Simulate OS switching back to light
    act(() => toggle(false));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("does not follow OS changes when preference is light or dark", async () => {
    const { toggle } = mockMatchMedia(false);

    const user = userEvent.setup();
    renderApp();

    // Open settings and select Dark explicitly
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg = await screen.findByRole("dialog", { name: /settings/i });
    await user.click(within(dlg).getByRole("button", { name: /^dark$/i }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Simulate OS switching — should not affect fixed preference
    act(() => toggle(false));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
