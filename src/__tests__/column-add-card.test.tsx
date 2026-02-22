import { render, screen, within } from "@testing-library/react";
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

describe("column add card", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
  });

  it("adds a card to a column using the column's Add card button", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add first column
    await user.click(screen.getByRole("button", { name: /add column/i }));

    // Find the column by its heading
    const column = screen.getByRole("region", { name: /new column/i });

    // Click the add card button
    const addCardBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addCardBtn);

    // Card appears with default title
    expect(
      within(column as HTMLElement).getByText(/new card/i),
    ).toBeInTheDocument();
  });

  it("does not retain focus on add card button after clicking it", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    const addCardBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addCardBtn);

    expect(document.activeElement).not.toBe(addCardBtn);
  });

  it("does not keep focus inside the column after adding a card", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    const addCardBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addCardBtn);

    // No element inside the column should have focus, otherwise
    // group-focus-within keeps the column action buttons visible
    expect(column.contains(document.activeElement)).toBe(false);
  });
});
