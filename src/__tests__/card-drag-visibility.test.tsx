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

describe("card drag handle visibility", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
  });

  it("hides drag handle when there is 1 column with only 1 card", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add a single column
    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    // Add a single card
    const addCardBtn = within(column).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addCardBtn);

    // There should be no drag handle for the only card
    expect(
      within(column).queryByRole("button", { name: /drag card/i }),
    ).toBeNull();
  });

  it("shows drag handle when there are multiple columns even if a column has a single card", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add two columns
    await user.click(screen.getByRole("button", { name: /add column/i }));
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const columns = screen.getAllByRole("region", { name: /new column/i });
    const first = columns[0];

    // Add a single card to the first column
    const addCardBtn = within(first).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addCardBtn);

    // Drag handle should be visible now (because columns > 1)
    // Scope to the single card container in the first column to avoid multiple matches
    const textareas = within(first).getAllByRole("textbox", {
      name: /card content/i,
    });
    const cardContainer = textareas[0].parentElement as HTMLElement;
    expect(
      within(cardContainer).getByRole("button", { name: /drag card/i }),
    ).toBeInTheDocument();
  });
});
