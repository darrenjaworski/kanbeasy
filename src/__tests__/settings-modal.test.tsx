import { screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { seedBoard } from "../utils/db";
import { renderApp } from "../test/renderApp";
import { describe, it, expect, beforeEach } from "vitest";

describe("settings modal", () => {
  beforeEach(() => {
    seedBoard({ columns: [], archive: [] });
  });

  it("opens from header button and shows heading", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dialog = await screen.findByRole("dialog", { name: /settings/i });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it("closes when clicking the overlay", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    await screen.findByRole("dialog", { name: /settings/i });
    // overlay has aria-label "Close settings" and is outside the dialog
    const overlay = screen.getAllByRole("button", {
      name: /close settings/i,
    })[0];
    await user.click(overlay);
    expect(
      screen.queryByRole("dialog", { name: /settings/i }),
    ).not.toBeInTheDocument();
  });

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dialog = await screen.findByRole("dialog", { name: /settings/i });
    expect(dialog).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("dialog", { name: /settings/i }),
    ).not.toBeInTheDocument();
  });

  it("selects a dark theme and persists across remount", async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg = await screen.findByRole("dialog", { name: /settings/i });
    const html = document.documentElement;

    // Expand Appearance section, then switch to dark mode
    await user.click(within(dlg).getByRole("button", { name: /appearance/i }));
    await user.click(within(dlg).getByRole("button", { name: /dark/i }));
    const darkSwatch = within(dlg).getByRole("button", {
      name: /midnight theme/i,
    });
    await user.click(darkSwatch);
    expect(html.classList.contains("dark")).toBe(true);

    // Close and unmount, then re-render to ensure persistence via IndexedDB
    await user.click(
      within(dlg).getByRole("button", { name: /close settings/i }),
    );
    unmount();
    cleanup();
    renderApp();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("shows Card density control with three options and updates card height only", async () => {
    const user = userEvent.setup();
    renderApp();
    // Create a column and some cards to see spacing effect
    await user.click(screen.getByRole("button", { name: /add column/i }));
    // Add 2 cards
    const addButtons = screen.getAllByRole("button", { name: /add card/i });
    await user.click(addButtons[0]);
    await user.click(addButtons[0]);

    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg = await screen.findByRole("dialog", { name: /settings/i });

    // Expand Appearance section to access density controls
    await user.click(within(dlg).getByRole("button", { name: /appearance/i }));

    // Find the fieldset via legend text and icon buttons by title
    const compactBtn = within(dlg).getByRole("button", { name: /compact/i });
    const comfortableBtn = within(dlg).getByRole("button", {
      name: /comfortable/i,
    });
    const spaciousBtn = within(dlg).getByRole("button", { name: /spacious/i });
    expect(compactBtn).toBeInTheDocument();
    expect(comfortableBtn).toBeInTheDocument();
    expect(spaciousBtn).toBeInTheDocument();

    // Default is small (compact)
    expect(compactBtn).toHaveAttribute("aria-pressed", "true");

    // Close settings to snapshot spacing at compact default
    await user.click(
      within(dlg).getByRole("button", { name: /close settings/i }),
    );

    // default rows should be 1 (compact)
    const textareas = screen.getAllByRole("textbox", { name: /card content/i });
    expect(textareas[0]).toHaveAttribute("rows", "1");

    // Re-open and set comfortable (Appearance section stays open from persistence)
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg2 = await screen.findByRole("dialog", { name: /settings/i });
    const appBtn2 = within(dlg2).getByRole("button", { name: /appearance/i });
    if (appBtn2.getAttribute("aria-expanded") !== "true") {
      await user.click(appBtn2);
    }
    await user.click(
      within(dlg2).getByRole("button", { name: /comfortable/i }),
    );
    await user.click(
      within(dlg2).getByRole("button", { name: /close settings/i }),
    );
    const textareasAfterComfortable = screen.getAllByRole("textbox", {
      name: /card content/i,
    });
    expect(textareasAfterComfortable[0]).toHaveAttribute("rows", "2");

    // Re-open and set spacious
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg3 = await screen.findByRole("dialog", { name: /settings/i });
    const appBtn3 = within(dlg3).getByRole("button", { name: /appearance/i });
    if (appBtn3.getAttribute("aria-expanded") !== "true") {
      await user.click(appBtn3);
    }
    await user.click(within(dlg3).getByRole("button", { name: /spacious/i }));
    await user.click(
      within(dlg3).getByRole("button", { name: /close settings/i }),
    );
    const textareasAfterLarge = screen.getAllByRole("textbox", {
      name: /card content/i,
    });
    expect(textareasAfterLarge[0]).toHaveAttribute("rows", "3");
  });
});
