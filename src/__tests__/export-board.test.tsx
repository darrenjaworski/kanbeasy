import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { ThemeProvider } from "../theme/ThemeProvider";
import { BoardProvider } from "../board/BoardProvider";
import { STORAGE_KEYS } from "../constants/storage";
import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../utils/exportBoard", () => ({
  exportBoard: vi.fn(),
}));

import { exportBoard } from "../utils/exportBoard";

function renderApp() {
  return render(
    <ThemeProvider>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>,
  );
}

describe("export board integration", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
    vi.mocked(exportBoard).mockClear();
  });

  it("shows export button in settings modal", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dialog = await screen.findByRole("dialog", { name: /settings/i });
    expect(
      within(dialog).getByRole("button", { name: /export board data/i }),
    ).toBeInTheDocument();
  });

  it("triggers export when export button is clicked", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dialog = await screen.findByRole("dialog", { name: /settings/i });
    await user.click(
      within(dialog).getByRole("button", { name: /export board data/i }),
    );
    expect(exportBoard).toHaveBeenCalledOnce();
  });
});
