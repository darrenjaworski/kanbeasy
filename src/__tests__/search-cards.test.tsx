import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { ThemeProvider } from "../theme/ThemeProvider";
import { BoardProvider } from "../board/BoardProvider";
import { describe, it, expect } from "vitest";

function renderApp() {
  return render(
    <ThemeProvider>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>
  );
}

describe("search cards", () => {
  it("highlights matching cards when searching", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add a column
    await user.click(screen.getByRole("button", { name: /add column/i }));

    // Add three cards with different titles
    const addCardBtn = screen.getByRole("button", { name: /add card to/i });
    await user.click(addCardBtn);
    await user.click(addCardBtn);
    await user.click(addCardBtn);

    const column = screen.getByRole("region", { name: /new column/i });
    const textareas = within(column).getAllByRole("textbox", {
      name: /card content/i,
    });

    // Set card titles
    await user.clear(textareas[0]);
    await user.type(textareas[0], "Buy groceries");
    await user.tab();

    await user.clear(textareas[1]);
    await user.type(textareas[1], "Call the doctor");
    await user.tab();

    await user.clear(textareas[2]);
    await user.type(textareas[2], "Buy concert tickets");
    await user.tab();

    // Find the search input
    const searchInput = screen.getByRole("searchbox", { name: /search cards/i });
    expect(searchInput).toBeInTheDocument();

    // Search for "buy"
    await user.type(searchInput, "buy");

    // Check that matching cards are highlighted
    const cards = within(column).getAllByTestId(/^card-\d+$/);

    // First card should have search highlight classes
    expect(cards[0]).toHaveClass("border-blue-500");
    expect(cards[0]).toHaveClass("ring-2");

    // Second card should NOT have highlight
    expect(cards[1]).not.toHaveClass("border-blue-500");

    // Third card should have search highlight classes
    expect(cards[2]).toHaveClass("border-blue-500");
    expect(cards[2]).toHaveClass("ring-2");

    // Check match count is displayed
    expect(screen.getByText("2 matches")).toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // No cards should be highlighted
    cards.forEach(card => {
      expect(card).not.toHaveClass("border-blue-500");
    });
  });

  it("performs fuzzy search on card titles", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add a column and card
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column).getByRole("button", { name: /add card to/i });
    await user.click(addCardBtn);

    const textarea = within(column).getByRole("textbox", {
      name: /card content/i,
    });

    await user.clear(textarea);
    await user.type(textarea, "Important meeting");
    await user.tab();

    const searchInput = screen.getByRole("searchbox", { name: /search cards/i });

    // Fuzzy search should match even with typos
    await user.type(searchInput, "meetng"); // Missing 'i'

    const card = within(column).getByTestId("card-0");
    expect(card).toHaveClass("border-blue-500");
    expect(screen.getByText("1 match")).toBeInTheDocument();
  });

  it("shows no matches message when search has no results", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add a column and card
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column).getByRole("button", { name: /add card to/i });
    await user.click(addCardBtn);

    const textarea = within(column).getByRole("textbox", {
      name: /card content/i,
    });

    await user.clear(textarea);
    await user.type(textarea, "Task one");
    await user.tab();

    const searchInput = screen.getByRole("searchbox", { name: /search cards/i });

    // Search for something that doesn't match
    await user.type(searchInput, "zzzzz");

    // No match count should be shown
    expect(screen.queryByText(/match/i)).not.toBeInTheDocument();

    // Card should not be highlighted
    const card = within(column).getByTestId("card-0");
    expect(card).not.toHaveClass("border-blue-500");
  });

  it("does not search with less than 2 characters", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add a column and card
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column).getByRole("button", { name: /add card to/i });
    await user.click(addCardBtn);

    const textarea = within(column).getByRole("textbox", {
      name: /card content/i,
    });

    await user.clear(textarea);
    await user.type(textarea, "Buy groceries");
    await user.tab();

    const searchInput = screen.getByRole("searchbox", { name: /search cards/i });

    // Type single character that matches
    await user.type(searchInput, "B");

    // Card should NOT be highlighted with single character
    const card = within(column).getByTestId("card-0");
    expect(card).not.toHaveClass("border-blue-500");

    // No match count should be shown
    expect(screen.queryByText(/match/i)).not.toBeInTheDocument();

    // Type second character to activate search
    await user.type(searchInput, "u");

    // Now card should be highlighted
    expect(card).toHaveClass("border-blue-500");
    expect(screen.getByText("1 match")).toBeInTheDocument();
  });
});
