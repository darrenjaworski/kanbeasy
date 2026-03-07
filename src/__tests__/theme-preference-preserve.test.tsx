import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEYS } from "../constants/storage";
import { renderApp } from "../test/renderApp";
import { describe, it, expect, beforeEach, vi } from "vitest";

function mockMatchMedia(prefersDark: boolean) {
  const mql: Omit<MediaQueryList, "matches"> & { matches: boolean } = {
    matches: prefersDark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };

  window.matchMedia = vi.fn().mockReturnValue(mql as unknown as MediaQueryList);
  return mql;
}

async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /open settings/i }));
  const dlg = await screen.findByRole("dialog", { name: /settings/i });
  await user.click(within(dlg).getByRole("button", { name: /appearance/i }));
  return dlg;
}

describe("theme preference preserves theme choice when mode unchanged", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
  });

  it("preserves theme when switching from system to matching explicit mode (OS=dark)", async () => {
    mockMatchMedia(true);

    const user = userEvent.setup();
    renderApp();

    const dlg = await openSettings(user);

    // Select system preference (OS is dark → dark mode)
    await user.click(within(dlg).getByRole("button", { name: /system/i }));

    // Pick a non-default dark theme (Twilight = dark-purple)
    await user.click(
      within(dlg).getByRole("button", { name: /twilight theme/i }),
    );
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark-purple");

    // Switch to explicit "dark" — same mode, theme should be preserved
    await user.click(within(dlg).getByRole("button", { name: /^dark$/i }));
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark-purple");
  });

  it("preserves theme when switching from explicit mode to system when OS matches (dark)", async () => {
    mockMatchMedia(true);

    const user = userEvent.setup();
    renderApp();

    const dlg = await openSettings(user);

    // Select dark preference
    await user.click(within(dlg).getByRole("button", { name: /^dark$/i }));

    // Pick Twilight theme
    await user.click(
      within(dlg).getByRole("button", { name: /twilight theme/i }),
    );
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark-purple");

    // Switch to system (OS is dark) — same mode, theme should be preserved
    await user.click(within(dlg).getByRole("button", { name: /system/i }));
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark-purple");
  });

  it("preserves theme when switching from system to matching explicit mode (OS=light)", async () => {
    mockMatchMedia(false);

    const user = userEvent.setup();
    renderApp();

    const dlg = await openSettings(user);

    // Select system preference (OS is light → light mode)
    await user.click(within(dlg).getByRole("button", { name: /system/i }));

    // Pick Stone theme (light-stone)
    await user.click(within(dlg).getByRole("button", { name: /stone theme/i }));
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("light-stone");

    // Switch to explicit "light" — same mode, theme should be preserved
    await user.click(within(dlg).getByRole("button", { name: /^light$/i }));
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("light-stone");
  });

  it("resets theme when switching between different modes", async () => {
    mockMatchMedia(false);

    const user = userEvent.setup();
    renderApp();

    const dlg = await openSettings(user);

    // Start in light mode, pick Stone theme
    await user.click(within(dlg).getByRole("button", { name: /^light$/i }));
    await user.click(within(dlg).getByRole("button", { name: /stone theme/i }));
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("light-stone");

    // Switch to dark — different mode, should reset to default dark theme
    await user.click(within(dlg).getByRole("button", { name: /^dark$/i }));
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark-slate");
  });

  it("resets theme when switching from system (OS=dark) to light", async () => {
    mockMatchMedia(true);

    const user = userEvent.setup();
    renderApp();

    const dlg = await openSettings(user);

    // System preference with OS=dark, pick Twilight
    await user.click(within(dlg).getByRole("button", { name: /system/i }));
    await user.click(
      within(dlg).getByRole("button", { name: /twilight theme/i }),
    );
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark-purple");

    // Switch to light — different mode, should reset to default light theme
    await user.click(within(dlg).getByRole("button", { name: /^light$/i }));
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("light-slate");
  });

  it("preserves non-default theme on reload when preference is system", async () => {
    mockMatchMedia(true);

    const user = userEvent.setup();
    renderApp();

    const dlg = await openSettings(user);

    // Select system preference (OS is dark)
    await user.click(within(dlg).getByRole("button", { name: /system/i }));

    // Pick Twilight (non-default dark theme)
    await user.click(
      within(dlg).getByRole("button", { name: /twilight theme/i }),
    );
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark-purple");
    expect(localStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)).toBe("system");

    // Simulate reload: re-render with same localStorage
    renderApp();

    // Theme should still be Twilight, not reset to default dark-slate
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark-purple");
  });
});
