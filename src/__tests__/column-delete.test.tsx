import { render, screen } from "@testing-library/react";
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
  it("removes a column when clicking the delete button", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add a column
    await user.click(screen.getByRole("button", { name: /add column/i }));

    // Column should exist
    const column = screen.getByRole("region", { name: /new column/i });
    expect(column).toBeInTheDocument();

    // Delete button should be present and accessible by its label
    const deleteBtn = screen.getByRole("button", {
      name: /remove column/i,
    });
    await user.click(deleteBtn);

    // Column is removed
    expect(
      screen.queryByRole("region", { name: /new column/i })
    ).not.toBeInTheDocument();
  });
});
