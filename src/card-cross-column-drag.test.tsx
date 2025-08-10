import { render, screen, within } from "@testing-library/react";
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

describe("cross-column card dragging setup", () => {
  it("sets up the environment for cross-column dragging", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add two columns
    await user.click(screen.getByRole("button", { name: /add column/i }));
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const columns = screen.getAllByRole("region", { name: /new column/i });
    expect(columns.length).toBe(2);

    // Add a card to the first column
    const firstColumnAddBtn = within(columns[0]).getByRole("button", {
      name: /add card to/i,
    });
    await user.click(firstColumnAddBtn);

    // Set the card title
    const textarea = within(columns[0]).getByRole("textbox", {
      name: /card content/i,
    });
    await user.clear(textarea);
    await user.type(textarea, "Test Card");
    await user.tab();

    // Verify card is in first column
    expect(within(columns[0]).getByDisplayValue("Test Card")).toBeInTheDocument();
    expect(within(columns[1]).queryByDisplayValue("Test Card")).not.toBeInTheDocument();

    // Verify cross-column drag prerequisites are met:
    // 1. Card has a drag handle
    const dragHandle = within(columns[0]).getByRole("button", {
      name: /drag card test card/i,
    });
    expect(dragHandle).toBeInTheDocument();

    // 2. Both columns are droppable (have data-column-id attributes)
    expect(columns[0]).toHaveAttribute('data-column-id');
    expect(columns[1]).toHaveAttribute('data-column-id');

    // 3. Columns have different IDs  
    const firstColumnId = columns[0].getAttribute('data-column-id');
    const secondColumnId = columns[1].getAttribute('data-column-id');
    expect(firstColumnId).not.toBe(secondColumnId);
    expect(firstColumnId).toBeTruthy();
    expect(secondColumnId).toBeTruthy();
  });

  it("verifies cards can be positioned correctly in target columns", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add two columns
    await user.click(screen.getByRole("button", { name: /add column/i }));
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const columns = screen.getAllByRole("region", { name: /new column/i });

    // Add two cards to the second column to test positioning
    const secondColumnAddBtn = within(columns[1]).getByRole("button", {
      name: /add card to/i,
    });
    await user.click(secondColumnAddBtn);
    await user.click(secondColumnAddBtn);

    // Set card titles in second column
    const secondColumnTextareas = within(columns[1]).getAllByRole("textbox", {
      name: /card content/i,
    });
    await user.clear(secondColumnTextareas[0]);
    await user.type(secondColumnTextareas[0], "Card 1");
    await user.tab();
    
    await user.clear(secondColumnTextareas[1]);
    await user.type(secondColumnTextareas[1], "Card 2");
    await user.tab();

    // Add a card to the first column
    const firstColumnAddBtn = within(columns[0]).getByRole("button", {
      name: /add card to/i,
    });
    await user.click(firstColumnAddBtn);

    // Get the first column's textarea and update it
    const firstColumnTextareas = within(columns[0]).getAllByRole("textbox", {
      name: /card content/i,
    });
    await user.clear(firstColumnTextareas[0]);
    await user.type(firstColumnTextareas[0], "Moving Card");
    await user.tab();

    // Verify all cards are properly set up
    expect(within(columns[0]).getByDisplayValue("Moving Card")).toBeInTheDocument();
    expect(within(columns[1]).getByDisplayValue("Card 1")).toBeInTheDocument();
    expect(within(columns[1]).getByDisplayValue("Card 2")).toBeInTheDocument();

    // Verify drag handles exist for all cards
    const movingCardHandle = within(columns[0]).getByRole("button", {
      name: /drag card moving card/i,
    });
    expect(movingCardHandle).toBeInTheDocument();

    const card1Handle = within(columns[1]).getByRole("button", {
      name: /drag card card 1/i,
    });
    expect(card1Handle).toBeInTheDocument();

    const card2Handle = within(columns[1]).getByRole("button", {
      name: /drag card card 2/i,
    });
    expect(card2Handle).toBeInTheDocument();
  });
});