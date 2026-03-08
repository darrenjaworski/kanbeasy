import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEYS } from "../constants/storage";
import { renderApp } from "../test/renderApp";
import { describe, it, expect, beforeEach } from "vitest";

describe("search cards", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
  });

  it("disables search input when there are no cards", () => {
    renderApp();

    const searchInput = screen.getByRole("searchbox", {
      name: /search cards/i,
    });
    expect(searchInput).toBeDisabled();
  });

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
    const searchInput = screen.getByRole("searchbox", {
      name: /search cards/i,
    });
    expect(searchInput).toBeInTheDocument();

    // Search for "buy"
    await user.type(searchInput, "buy");

    // Check that matching cards are highlighted
    const cards = within(column).getAllByTestId(/^card-\d+$/);

    // First card should have search highlight
    expect(cards[0]).toHaveAttribute("data-search-highlight", "true");

    // Second card should NOT have highlight
    expect(cards[1]).not.toHaveAttribute("data-search-highlight");

    // Third card should have search highlight
    expect(cards[2]).toHaveAttribute("data-search-highlight", "true");

    // Check match count is displayed
    expect(screen.getByText("2 matches")).toBeInTheDocument();

    // Clear search
    await user.clear(searchInput);

    // No cards should be highlighted
    cards.forEach((card) => {
      expect(card).not.toHaveAttribute("data-search-highlight");
    });
  });

  it("performs fuzzy search on card titles", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add a column and card
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column).getByRole("button", {
      name: /add card to/i,
    });
    await user.click(addCardBtn);

    const textarea = within(column).getByRole("textbox", {
      name: /card content/i,
    });

    await user.clear(textarea);
    await user.type(textarea, "Important meeting");
    await user.tab();

    const searchInput = screen.getByRole("searchbox", {
      name: /search cards/i,
    });

    // Fuzzy search should match even with typos
    await user.type(searchInput, "meetng"); // Missing 'i'

    const card = within(column).getByTestId("card-0");
    expect(card).toHaveAttribute("data-search-highlight", "true");
    expect(screen.getByText("1 match")).toBeInTheDocument();
  });

  it("shows no matches message when search has no results", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add a column and card
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column).getByRole("button", {
      name: /add card to/i,
    });
    await user.click(addCardBtn);

    const textarea = within(column).getByRole("textbox", {
      name: /card content/i,
    });

    await user.clear(textarea);
    await user.type(textarea, "Task one");
    await user.tab();

    const searchInput = screen.getByRole("searchbox", {
      name: /search cards/i,
    });

    // Search for something that doesn't match
    await user.type(searchInput, "zzzzz");

    // No match count should be shown
    expect(screen.queryByText(/match/i)).not.toBeInTheDocument();

    // Card should not be highlighted
    const card = within(column).getByTestId("card-0");
    expect(card).not.toHaveAttribute("data-search-highlight");
  });

  it("does not search with less than 2 characters", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add a column and card
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column).getByRole("button", {
      name: /add card to/i,
    });
    await user.click(addCardBtn);

    const textarea = within(column).getByRole("textbox", {
      name: /card content/i,
    });

    await user.clear(textarea);
    await user.type(textarea, "Buy groceries");
    await user.tab();

    const searchInput = screen.getByRole("searchbox", {
      name: /search cards/i,
    });

    // Type single character that matches
    await user.type(searchInput, "B");

    // Card should NOT be highlighted with single character
    const card = within(column).getByTestId("card-0");
    expect(card).not.toHaveAttribute("data-search-highlight");

    // No match count should be shown
    expect(screen.queryByText(/match/i)).not.toBeInTheDocument();

    // Type second character to activate search
    await user.type(searchInput, "u");

    // Now card should be highlighted
    expect(card).toHaveAttribute("data-search-highlight", "true");
    expect(screen.getByText("1 match")).toBeInTheDocument();
  });

  it("performs case-insensitive search", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add a column and card
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column).getByRole("button", {
      name: /add card to/i,
    });
    await user.click(addCardBtn);

    const textarea = within(column).getByRole("textbox", {
      name: /card content/i,
    });

    await user.clear(textarea);
    await user.type(textarea, "Buy groceries");
    await user.tab();

    const searchInput = screen.getByRole("searchbox", {
      name: /search cards/i,
    });

    // Search with uppercase
    await user.type(searchInput, "GROC");

    const card = within(column).getByTestId("card-0");
    expect(card).toHaveAttribute("data-search-highlight", "true");
    expect(screen.getByText("1 match")).toBeInTheDocument();
  });

  it("searches card descriptions in addition to titles", async () => {
    const user = userEvent.setup();

    // Seed board with cards that have descriptions
    const now = Date.now();
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({
        columns: [
          {
            id: "col-1",
            title: "To Do",
            createdAt: now,
            updatedAt: now,
            cards: [
              {
                id: "card-1",
                number: 1,
                title: "Fix login bug",
                description: "Users cannot authenticate with OAuth provider",
                cardTypeId: null,
                dueDate: null,
                createdAt: now,
                updatedAt: now,
                columnHistory: [{ columnId: "col-1", enteredAt: now }],
              },
              {
                id: "card-2",
                number: 2,
                title: "Update homepage",
                description: "Change the hero banner image",
                cardTypeId: null,
                dueDate: null,
                createdAt: now,
                updatedAt: now,
                columnHistory: [{ columnId: "col-1", enteredAt: now }],
              },
            ],
          },
        ],
      }),
    );

    renderApp();

    const searchInput = screen.getByRole("searchbox", {
      name: /search cards/i,
    });

    // Search for text only in a description, not in any title
    await user.type(searchInput, "OAuth");

    // First card should match (description contains "OAuth")
    expect(screen.getByTestId("card-0")).toHaveAttribute(
      "data-search-highlight",
      "true",
    );

    // Second card should not match
    expect(screen.getByTestId("card-1")).not.toHaveAttribute(
      "data-search-highlight",
    );

    expect(screen.getByText("1 match")).toBeInTheDocument();
  });

  it("searches across multiple columns", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add two columns
    await user.click(screen.getByRole("button", { name: /add column/i }));
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const columns = screen.getAllByRole("region", { name: /new column/i });

    // Add card to first column
    const addCardBtn1 = within(columns[0]).getByRole("button", {
      name: /add card to/i,
    });
    await user.click(addCardBtn1);
    const textarea1 = within(columns[0]).getByRole("textbox", {
      name: /card content/i,
    });
    await user.clear(textarea1);
    await user.type(textarea1, "Backend task");
    await user.tab();

    // Add card to second column
    const addCardBtn2 = within(columns[1]).getByRole("button", {
      name: /add card to/i,
    });
    await user.click(addCardBtn2);
    const textarea2 = within(columns[1]).getByRole("textbox", {
      name: /card content/i,
    });
    await user.clear(textarea2);
    await user.type(textarea2, "Frontend task");
    await user.tab();

    const searchInput = screen.getByRole("searchbox", {
      name: /search cards/i,
    });

    // Search for "task" which appears in both columns
    await user.type(searchInput, "task");

    // Both cards should be highlighted
    const card1 = within(columns[0]).getByTestId("card-0");
    const card2 = within(columns[1]).getByTestId("card-0");

    expect(card1).toHaveClass("border-accent");
    expect(card2).toHaveClass("border-accent");
    expect(screen.getByText("2 matches")).toBeInTheDocument();
  });
});
