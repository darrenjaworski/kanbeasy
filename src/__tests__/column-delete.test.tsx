import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEYS, boardStorageKey } from "../constants/storage";
import { renderApp } from "../test/renderApp";
import { describe, it, expect, beforeEach } from "vitest";

describe("column delete", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
  });

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
      screen.queryByRole("region", { name: /new column/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Remove column?")).not.toBeInTheDocument();
  });

  it("shows confirmation dialog when deleting a column with cards", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    await user.click(
      within(column as HTMLElement).getByRole("button", { name: /add card/i }),
    );

    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /remove column/i,
      }),
    );

    expect(screen.getByText("Remove column?")).toBeInTheDocument();
    expect(screen.getByText(/this column has 1 card/i)).toBeInTheDocument();
    expect(
      screen.getByText(/cards will be archived and can be restored/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /new column/i }),
    ).toBeInTheDocument();
  });

  it("cancels column deletion when clicking cancel", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    await user.click(
      within(column as HTMLElement).getByRole("button", { name: /add card/i }),
    );
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /remove column/i,
      }),
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByText("Remove column?")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /new column/i }),
    ).toBeInTheDocument();
  });

  it("archives cards when confirming column deletion", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    await user.click(
      within(column as HTMLElement).getByRole("button", { name: /add card/i }),
    );
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /remove column/i,
      }),
    );

    await user.click(screen.getByTestId("confirm-delete-button"));

    expect(
      screen.queryByRole("region", { name: /new column/i }),
    ).not.toBeInTheDocument();

    // Verify cards were archived, not destroyed
    const stored = JSON.parse(
      localStorage.getItem(boardStorageKey("default")) ?? "{}",
    );
    expect(stored.archive).toHaveLength(1);
    expect(stored.archive[0].title).toBe("New card");
    expect(stored.archive[0].archivedAt).toBeGreaterThan(0);
    expect(stored.archive[0].archivedFromColumnId).toBeDefined();
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
      }),
    );

    expect(screen.getByText(/this column has 2 cards/i)).toBeInTheDocument();
  });

  it("deletes column with cards without confirmation when warning is disabled", async () => {
    localStorage.setItem(STORAGE_KEYS.DELETE_COLUMN_WARNING, "false");
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    await user.click(
      within(column as HTMLElement).getByRole("button", { name: /add card/i }),
    );

    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /remove column/i,
      }),
    );

    expect(screen.queryByText("Remove column?")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /new column/i }),
    ).not.toBeInTheDocument();

    // Cards should still be archived even without the warning dialog
    const stored = JSON.parse(
      localStorage.getItem(boardStorageKey("default")) ?? "{}",
    );
    expect(stored.archive).toHaveLength(1);
  });
});
