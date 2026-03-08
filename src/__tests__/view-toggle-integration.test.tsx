import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEYS } from "../constants/storage";
import { seedBoard, seedKv } from "../utils/db";
import { renderApp } from "../test/renderApp";

describe("view toggle integration", () => {
  beforeEach(() => {
    seedBoard({
      columns: [
        {
          id: "col-1",
          title: "To Do",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          cards: [
            {
              id: "card-1",
              number: 1,
              title: "My Task",
              description: "",
              cardTypeId: null,
              dueDate: null,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              columnHistory: [{ columnId: "col-1", enteredAt: Date.now() }],
            },
          ],
        },
      ],
      archive: [],
    });
  });

  it("renders board view by default", () => {
    renderApp();
    // Board view shows column regions
    expect(screen.getByRole("region", { name: /to do/i })).toBeInTheDocument();
  });

  it("switches to list view on toggle click", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("radio", { name: /list view/i }));

    // List view shows a table with card data
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("My Task")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
  });

  it("switches back to board view", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("radio", { name: /list view/i }));
    expect(screen.getByRole("table")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /board view/i }));
    expect(screen.getByRole("region", { name: /to do/i })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("persists list preference across renders", () => {
    seedKv(STORAGE_KEYS.VIEW_MODE, "list");
    renderApp();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("hides undo/redo controls in list view", async () => {
    const user = userEvent.setup();
    renderApp();

    // Undo button visible in board view
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /list view/i }));

    // Undo button should not be present in list view
    expect(
      screen.queryByRole("button", { name: /undo/i }),
    ).not.toBeInTheDocument();
  });
});
