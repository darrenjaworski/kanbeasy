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

describe("column delete", () => {
  it("deletes an empty column immediately without confirmation", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });
    expect(column).toBeInTheDocument();

    const deleteBtn = within(column as HTMLElement).getByRole("button", {
      name: /remove column/i,
    });
    await user.click(deleteBtn);

    expect(
      screen.queryByRole("region", { name: /new column/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Delete column?")).not.toBeInTheDocument();
  });

  it("shows confirmation dialog when deleting a column with cards", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    await user.click(
      within(column as HTMLElement).getByRole("button", { name: /add card/i })
    );

    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /remove column/i,
      })
    );

    expect(screen.getByText("Delete column?")).toBeInTheDocument();
    expect(screen.getByText(/this column has 1 card/i)).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /new column/i })
    ).toBeInTheDocument();
  });

  it("cancels column deletion when clicking cancel", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    await user.click(
      within(column as HTMLElement).getByRole("button", { name: /add card/i })
    );
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /remove column/i,
      })
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByText("Delete column?")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /new column/i })
    ).toBeInTheDocument();
  });

  it("deletes column when confirming deletion", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    await user.click(
      within(column as HTMLElement).getByRole("button", { name: /add card/i })
    );
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /remove column/i,
      })
    );

    await user.click(screen.getByTestId("confirm-delete-button"));

    expect(
      screen.queryByRole("region", { name: /new column/i })
    ).not.toBeInTheDocument();
  });

  it("pluralizes card count in confirmation message", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    const addCardBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addCardBtn);
    await user.click(addCardBtn);

    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /remove column/i,
      })
    );

    expect(screen.getByText(/this column has 2 cards/i)).toBeInTheDocument();
  });
});
