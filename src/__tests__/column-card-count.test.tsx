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

describe("column card count badge", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
  });

  it("shows 0 for an empty column", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    expect(within(column as HTMLElement).getByText("0")).toBeInTheDocument();
  });

  it("shows correct count after adding cards", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });

    await user.click(addCardBtn);
    expect(within(column as HTMLElement).getByText("1")).toBeInTheDocument();

    await user.click(addCardBtn);
    expect(within(column as HTMLElement).getByText("2")).toBeInTheDocument();
  });

  it("decrements count when a card is removed", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });

    await user.click(addCardBtn);
    await user.click(addCardBtn);
    expect(within(column as HTMLElement).getByText("2")).toBeInTheDocument();

    const removeBtn = within(column as HTMLElement).getAllByRole("button", {
      name: /remove card/i,
    })[0];
    await user.click(removeBtn);

    expect(within(column as HTMLElement).getByText("1")).toBeInTheDocument();
  });

  it("has an accessible label with pluralized card count", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    expect(
      within(column as HTMLElement).getByLabelText("0 cards"),
    ).toBeInTheDocument();

    await user.click(
      within(column as HTMLElement).getByRole("button", { name: /add card/i }),
    );

    expect(
      within(column as HTMLElement).getByLabelText("1 card"),
    ).toBeInTheDocument();
  });
});
