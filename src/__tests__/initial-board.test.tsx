import { screen, within } from "@testing-library/react";
import { seedBoard } from "../utils/db";
import { renderApp } from "../test/renderApp";
import { describe, it, expect } from "vitest";

describe("initial board seeding", () => {
  it("renders seeded columns with example cards on first load", () => {
    renderApp();

    const todoColumn = screen.getByRole("region", { name: /to do/i });
    expect(todoColumn).toBeInTheDocument();
    expect(
      within(todoColumn as HTMLElement).getByText("Plan the project"),
    ).toBeInTheDocument();
    expect(
      within(todoColumn as HTMLElement).getByText("Write documentation"),
    ).toBeInTheDocument();

    const inProgressColumn = screen.getByRole("region", {
      name: /in progress/i,
    });
    expect(inProgressColumn).toBeInTheDocument();
    expect(
      within(inProgressColumn as HTMLElement).getByText("Build the dashboard"),
    ).toBeInTheDocument();

    const doneColumn = screen.getByRole("region", { name: /done/i });
    expect(doneColumn).toBeInTheDocument();
    expect(
      within(doneColumn as HTMLElement).getByText("Set up the repo"),
    ).toBeInTheDocument();
  });

  it("does not re-seed after board is cleared", () => {
    seedBoard({ columns: [], archive: [] });

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
