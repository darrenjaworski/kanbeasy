import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { ThemeProvider } from "../theme/ThemeProvider";
import { BoardProvider } from "../board/BoardProvider";

function renderApp() {
  return render(
    <ThemeProvider>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>
  );
}

describe("column add card", () => {
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
      within(column as HTMLElement).getByText(/new card/i)
    ).toBeInTheDocument();
  });
});
