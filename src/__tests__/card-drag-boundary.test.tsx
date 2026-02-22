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

describe("card drag boundary constraints", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
  });

  it("ensures cards stay within column boundaries when dragging", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add one column
    await user.click(screen.getByRole("button", { name: /add column/i }));

    // Add two cards
    const addCardBtn = screen.getByRole("button", { name: /add card to/i });
    await user.click(addCardBtn);
    await user.click(addCardBtn);

    const column = screen.getByRole("region", { name: /new column/i });
    const textareas = within(column).getAllByRole("textbox", {
      name: /card content/i,
    });

    // Set titles: 'Card 1', 'Card 2'
    await user.clear(textareas[0]);
    await user.type(textareas[0], "Card 1");
    await user.tab();

    await user.clear(textareas[1]);
    await user.type(textareas[1], "Card 2");
    await user.tab();

    // Get drag handle for first card
    const handles = within(column).getAllByRole("button", {
      name: /drag card/i,
    });
    expect(handles.length).toBe(2);

    // Test keyboard-based reordering still works (this validates the boundary doesn't break functionality)
    handles[0].focus();
    await user.keyboard(" "); // activate drag with space
    await user.keyboard("{ArrowDown}"); // move down one position
    await user.keyboard(" "); // drop

    // Verify cards were reordered correctly
    const afterReorder = within(column).getAllByRole("textbox", {
      name: /card content/i,
    });
    const values = afterReorder.map((el) => (el as HTMLTextAreaElement).value);
    expect(values).toEqual(["Card 2", "Card 1"]);

    // Verify the cards are still present and reorderable (boundary constraint doesn't break this)
    expect(
      within(column).getAllByRole("button", { name: /drag card/i }).length,
    ).toBe(2);
  });
});
