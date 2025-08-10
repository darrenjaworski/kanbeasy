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

describe("card delete", () => {
  it("removes a card from a column using the card's remove button", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add column
    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    // Add two cards
    const addBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addBtn);
    await user.click(addBtn);

    // Two cards exist
    expect(
      within(column as HTMLElement).getAllByText(/new card/i)
    ).toHaveLength(2);

    // Click the remove button on the first card in the column
    const firstCard = within(column as HTMLElement)
      .getAllByText(/new card/i)[0]
      .closest("div");
    const removeBtn = within(firstCard as HTMLElement).getByRole("button", {
      name: /remove card/i,
    });
    await user.click(removeBtn);

    // Only one card remains
    expect(
      within(column as HTMLElement).getAllByText(/new card/i)
    ).toHaveLength(1);
  });
});
