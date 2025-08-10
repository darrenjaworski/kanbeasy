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

describe("card sort icon", () => {
  it("renders a sort icon under the card's close button", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add one column
    await user.click(screen.getByRole("button", { name: /add column/i }));

    // Add three cards with different titles
    const addCardBtn = screen.getByRole("button", { name: /add card to/i });
    await user.click(addCardBtn);
    await user.click(addCardBtn);
    await user.click(addCardBtn);

    const column = screen.getByRole("region", { name: /new column/i });
    const textareas = within(column).getAllByRole("textbox", { name: /card content/i });

    // Set titles: 'C', 'A', 'B'
    await user.clear(textareas[0]);
    await user.type(textareas[0], "C");
    await user.tab();

    await user.clear(textareas[1]);
    await user.type(textareas[1], "A");
    await user.tab();

    await user.clear(textareas[2]);
    await user.type(textareas[2], "B");
    await user.tab();

  // Click Sort cards (any one sorts the whole column)
  const sortBtns = within(column).getAllByRole("button", { name: /sort cards/i });
  await user.click(sortBtns[0]);

    const after = within(column).getAllByRole("textbox", { name: /card content/i });
    const values = after.map((el) => (el as HTMLTextAreaElement).value);
    expect(values).toEqual(["A", "B", "C"]);
  });
});
