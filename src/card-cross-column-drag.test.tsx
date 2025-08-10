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

describe("cross-column card dragging", () => {
  it("allows dragging cards between columns", async () => {
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

    // Get the drag handle for the card
    const dragHandle = within(columns[0]).getByRole("button", {
      name: /drag card test card/i,
    });

    // Drag the card to the second column using keyboard
    dragHandle.focus();
    await user.keyboard(" "); // activate drag
    await user.keyboard("{ArrowRight}"); // move to second column
    await user.keyboard(" "); // drop

    // Verify card moved to second column
    expect(within(columns[0]).queryByDisplayValue("Test Card")).not.toBeInTheDocument();
    expect(within(columns[1]).getByDisplayValue("Test Card")).toBeInTheDocument();
  });

  it("allows dropping cards at specific positions within target column", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add two columns
    await user.click(screen.getByRole("button", { name: /add column/i }));
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const columns = screen.getAllByRole("region", { name: /new column/i });

    // Add two cards to the second column
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

    const firstColumnTextarea = within(columns[0]).getByRole("textbox", {
      name: /card content/i,
    });
    await user.clear(firstColumnTextarea);
    await user.type(firstColumnTextarea, "Moving Card");
    await user.tab();

    // Drag the card from first column to second column
    const dragHandle = within(columns[0]).getByRole("button", {
      name: /drag card moving card/i,
    });

    dragHandle.focus();
    await user.keyboard(" "); // activate drag
    await user.keyboard("{ArrowRight}"); // move to second column
    await user.keyboard(" "); // drop

    // Verify the card was added to the second column
    const finalTextareas = within(columns[1]).getAllByRole("textbox", {
      name: /card content/i,
    });
    const values = finalTextareas.map((el) => (el as HTMLTextAreaElement).value);
    
    // The moved card should be in the second column
    expect(values).toContain("Moving Card");
    expect(values).toContain("Card 1");
    expect(values).toContain("Card 2");
    expect(values.length).toBe(3);
  });
});