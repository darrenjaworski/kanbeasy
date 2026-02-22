import { render, screen, within } from "@testing-library/react";
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

describe("initial board seeding", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEYS.BOARD);
  });

  it("renders seeded columns with example cards on first load", () => {
    renderApp();

    const todoColumn = screen.getByRole("region", { name: /to do/i });
    expect(todoColumn).toBeInTheDocument();
    expect(
      within(todoColumn as HTMLElement).getByText("My first task"),
    ).toBeInTheDocument();
    expect(
      within(todoColumn as HTMLElement).getByText("Another task"),
    ).toBeInTheDocument();

    const inProgressColumn = screen.getByRole("region", {
      name: /in progress/i,
    });
    expect(inProgressColumn).toBeInTheDocument();
    expect(
      within(inProgressColumn as HTMLElement).getByText("A task in progress"),
    ).toBeInTheDocument();

    const doneColumn = screen.getByRole("region", { name: /done/i });
    expect(doneColumn).toBeInTheDocument();
    expect(
      within(doneColumn as HTMLElement).getByText("A completed task"),
    ).toBeInTheDocument();
  });

  it("does not re-seed after board is cleared", () => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));

    renderApp();

    expect(
      screen.queryByRole("region", { name: /to do/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /in progress/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /done/i }),
    ).not.toBeInTheDocument();
  });
});
