import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { ThemeProvider } from "../theme/ThemeProvider";
import { BoardProvider } from "../board/BoardProvider";
import { STORAGE_KEYS } from "../constants/storage";
import { describe, it, expect, beforeEach } from "vitest";

function renderApp() {
  return render(
    <ThemeProvider>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>,
  );
}

describe("app shell", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
  });

  it("renders header and shows minimal empty-state, allows adding a column", async () => {
    const user = userEvent.setup();
    renderApp();
    // There may be multiple headings with 'Kanbeasy' (header and welcome modal)
    const headings = screen.getAllByRole("heading", { name: /kanbeasy/i });
    expect(headings.length).toBeGreaterThan(0);
    // Empty state: only one "Add Column" button, flush-left
    const addBtn = screen.getByRole("button", { name: /add column/i });
    expect(addBtn).toBeInTheDocument();
    // Add a column via CTA
    await user.click(addBtn);
    // A new column appears with default title (region named by the column title)
    expect(
      screen.getByRole("region", { name: /new column/i }),
    ).toBeInTheDocument();
    // The persistent add tile exists after first column
    const addTile = screen.getByRole("button", { name: /add column/i });
    await user.click(addTile);
    // Two columns now
    expect(
      screen.getAllByRole("region", { name: /new column/i }).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("opens settings and selects a dark theme", async () => {
    const user = userEvent.setup();
    renderApp();
    const btn = screen.getByRole("button", { name: /open settings/i });
    await user.click(btn);
    // Switch to dark mode, then pick a dark theme
    await user.click(await screen.findByRole("button", { name: /dark/i }));
    const darkSwatch = await screen.findByRole("button", {
      name: /midnight theme/i,
    });
    await user.click(darkSwatch);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
