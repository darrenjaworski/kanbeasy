import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
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
});
