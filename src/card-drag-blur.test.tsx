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

describe("card gets blur background while dragging", () => {
  it("toggles blur class on the dragged card container during keyboard drag", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add one column and two cards (drag handle only shows when multiple cards exist)
    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addCardBtn);
    await user.click(addCardBtn);

    // Locate the first card's textarea and its container (the card root element)
    const textareas = within(column).getAllByRole("textbox", {
      name: /card content/i,
    });
    const cardContainer = textareas[0].parentElement as HTMLElement;
    expect(cardContainer).toBeInTheDocument();

    // The drag handle inside this card
    const handle = within(cardContainer).getByRole("button", {
      name: /drag card/i,
    });
    handle.focus();
    expect(handle).toHaveFocus();

    // Start drag (space) -> blur class appears
    await user.keyboard(" ");
    expect(cardContainer.className).toMatch(/backdrop-blur-sm/);

    // Drop (space) -> blur class removed
    await user.keyboard(" ");
    expect(cardContainer.className).not.toMatch(/backdrop-blur-sm/);
  });
});
