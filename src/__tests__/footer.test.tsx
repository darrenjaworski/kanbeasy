import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEYS } from "../constants/storage";
import { renderApp } from "../test/renderApp";

describe("credit in settings modal", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
  });

  it("renders credit text in settings modal", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dlg = await screen.findByRole("dialog", { name: /settings/i });

    expect(within(dlg).getByText(/Made with care by/i)).toBeInTheDocument();
    const link = within(dlg).getByRole("link", { name: /darrenjaworski/i });
    expect(link).toHaveAttribute("href", "https://github.com/darrenjaworski");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(
      within(dlg).getByText(/, Copilot, and Claude\./i),
    ).toBeInTheDocument();
  });
});
