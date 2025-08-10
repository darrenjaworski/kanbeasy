import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";
import { BoardProvider } from "./board/BoardProvider";

function renderApp() {
  return render(
    <ThemeProvider>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>
  );
}

describe("settings modal", () => {
  it("opens from header button and shows heading", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dialog = await screen.findByRole("dialog", { name: /settings/i });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByRole("heading", { name: /settings/i })
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
      screen.queryByRole("dialog", { name: /settings/i })
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
      screen.queryByRole("dialog", { name: /settings/i })
    ).not.toBeInTheDocument();
  });

  it("toggles dark mode in modal and persists across remount", async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg = await screen.findByRole("dialog", { name: /settings/i });
    const html = document.documentElement;
    const initial = html.classList.contains("dark");
    const switchEl = within(dlg).getByRole("switch", { name: /dark mode/i });
    await user.click(switchEl);
    expect(html.classList.contains("dark")).toBe(!initial);

    // Close and unmount, then re-render to ensure persistence via localStorage
    await user.click(
      within(dlg).getByRole("button", { name: /close settings/i })
    );
    unmount();
    cleanup();
    renderApp();
    expect(document.documentElement.classList.contains("dark")).toBe(!initial);
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

    // Find the fieldset via legend text and icon buttons by title
    const compactBtn = within(dlg).getByRole("button", { name: /compact/i });
    const comfortableBtn = within(dlg).getByRole("button", {
      name: /comfortable/i,
    });
    const spaciousBtn = within(dlg).getByRole("button", { name: /spacious/i });
    expect(compactBtn).toBeInTheDocument();
    expect(comfortableBtn).toBeInTheDocument();
    expect(spaciousBtn).toBeInTheDocument();

    // Default is medium (comfortable)
    expect(comfortableBtn).toHaveAttribute("aria-pressed", "true");

    // Close settings to snapshot spacing comfortably
    await user.click(
      within(dlg).getByRole("button", { name: /close settings/i })
    );

    // default rows should be 2
    const textareas = screen.getAllByRole("textbox", { name: /card content/i });
    expect(textareas[0]).toHaveAttribute("rows", "2");

    // Re-open and set compact
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg2 = await screen.findByRole("dialog", { name: /settings/i });
    await user.click(within(dlg2).getByRole("button", { name: /compact/i }));
    await user.click(
      within(dlg2).getByRole("button", { name: /close settings/i })
    );
    const textareasAfterCompact = screen.getAllByRole("textbox", {
      name: /card content/i,
    });
    expect(textareasAfterCompact[0]).toHaveAttribute("rows", "1");

    // Re-open and set spacious
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg3 = await screen.findByRole("dialog", { name: /settings/i });
    await user.click(within(dlg3).getByRole("button", { name: /spacious/i }));
    await user.click(
      within(dlg3).getByRole("button", { name: /close settings/i })
    );
    const textareasAfterLarge = screen.getAllByRole("textbox", {
      name: /card content/i,
    });
    expect(textareasAfterLarge[0]).toHaveAttribute("rows", "3");
  });
});
