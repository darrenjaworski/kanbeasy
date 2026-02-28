import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEYS } from "../../../constants/storage";
import { renderApp } from "../../../test/renderApp";
import type { ArchivedCard, Column } from "../../../board/types";

let cardNum = 1;

function makeColumn(
  id: string,
  title: string,
  cards: Column["cards"] = [],
): Column {
  const now = Date.now();
  return { id, title, cards, createdAt: now, updatedAt: now };
}

function makeArchivedCard(
  id: string,
  title: string,
  fromColumnId = "c1",
  number?: number,
): ArchivedCard {
  const now = Date.now();
  return {
    id,
    number: number ?? cardNum++,
    title,
    description: "",
    ticketTypeId: null,
    createdAt: now,
    updatedAt: now,
    columnHistory: [{ columnId: fromColumnId, enteredAt: now }],
    archivedAt: now,
    archivedFromColumnId: fromColumnId,
  };
}

async function openArchive(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("archive-button"));
  return screen.findByRole("dialog", { name: /archive/i });
}

describe("ArchiveModal", () => {
  beforeEach(() => {
    localStorage.clear();
    cardNum = 1;
  });

  it("shows empty state when archive is empty", async () => {
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns: [makeColumn("c1", "Todo")], archive: [] }),
    );
    const user = userEvent.setup();
    renderApp();

    const dlg = await openArchive(user);
    expect(within(dlg).getByTestId("archive-empty")).toHaveTextContent(
      "No archived cards.",
    );
  });

  it("displays archived cards in the table", async () => {
    const archive = [
      makeArchivedCard("a1", "Task A", "c1", 1),
      makeArchivedCard("a2", "Task B", "c1", 2),
    ];
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns: [makeColumn("c1", "Todo")], archive }),
    );
    const user = userEvent.setup();
    renderApp();

    const dlg = await openArchive(user);
    const rows = within(dlg).getAllByTestId("archive-card-row");
    expect(rows).toHaveLength(2);
  });

  it("select-all checkbox toggles all cards", async () => {
    const archive = [
      makeArchivedCard("a1", "Task A", "c1", 1),
      makeArchivedCard("a2", "Task B", "c1", 2),
    ];
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns: [makeColumn("c1", "Todo")], archive }),
    );
    const user = userEvent.setup();
    renderApp();

    const dlg = await openArchive(user);

    // Click select-all
    const selectAll = within(dlg).getByTestId("archive-select-all");
    await user.click(selectAll);

    // Both individual checkboxes should be checked
    const checkboxes = within(dlg).getAllByRole("checkbox");
    // checkboxes: [select-all, card-a1, card-a2]
    for (const cb of checkboxes) {
      expect(cb).toBeChecked();
    }

    // Click select-all again to deselect all
    await user.click(selectAll);
    for (const cb of checkboxes) {
      expect(cb).not.toBeChecked();
    }
  });

  it("individual card selection toggles that card", async () => {
    const archive = [makeArchivedCard("a1", "Task A", "c1", 1)];
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns: [makeColumn("c1", "Todo")], archive }),
    );
    const user = userEvent.setup();
    renderApp();

    const dlg = await openArchive(user);

    const cardCheckbox = within(dlg).getByTestId("archive-select-a1");
    expect(cardCheckbox).not.toBeChecked();

    await user.click(cardCheckbox);
    expect(cardCheckbox).toBeChecked();

    await user.click(cardCheckbox);
    expect(cardCheckbox).not.toBeChecked();
  });

  it("bulk restore button shows count and restores cards", async () => {
    const archive = [makeArchivedCard("a1", "Task A", "c1", 1)];
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({
        columns: [makeColumn("c1", "Todo")],
        archive,
      }),
    );
    const user = userEvent.setup();
    renderApp();

    const dlg = await openArchive(user);

    // Restore button is disabled with no selection
    const restoreBtn = within(dlg).getByTestId("archive-bulk-restore");
    expect(restoreBtn).toBeDisabled();

    // Select the card
    await user.click(within(dlg).getByTestId("archive-select-a1"));
    expect(restoreBtn).not.toBeDisabled();
    expect(restoreBtn).toHaveTextContent("Restore (1)");

    // Click restore
    await user.click(restoreBtn);

    // Archive should now be empty
    expect(within(dlg).getByTestId("archive-empty")).toBeInTheDocument();
  });

  it("bulk delete shows confirmation dialog", async () => {
    const archive = [makeArchivedCard("a1", "Task A", "c1", 1)];
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({
        columns: [makeColumn("c1", "Todo")],
        archive,
      }),
    );
    const user = userEvent.setup();
    renderApp();

    const dlg = await openArchive(user);

    // Select the card
    await user.click(within(dlg).getByTestId("archive-select-a1"));

    // Click delete
    const deleteBtn = within(dlg).getByTestId("archive-bulk-delete");
    expect(deleteBtn).toHaveTextContent("Delete (1)");
    await user.click(deleteBtn);

    // Confirm dialog should appear
    expect(screen.getByText(/will be deleted forever/i)).toBeInTheDocument();

    // Confirm the deletion via the confirm dialog's delete button
    await user.click(screen.getByTestId("confirm-delete-button"));

    // Archive should now be empty
    expect(within(dlg).getByTestId("archive-empty")).toBeInTheDocument();
  });

  it("delete button is disabled with no selection", async () => {
    const archive = [makeArchivedCard("a1", "Task A", "c1", 1)];
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({
        columns: [makeColumn("c1", "Todo")],
        archive,
      }),
    );
    const user = userEvent.setup();
    renderApp();

    const dlg = await openArchive(user);

    expect(within(dlg).getByTestId("archive-bulk-delete")).toBeDisabled();
  });

  it("closes when close button is clicked", async () => {
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns: [makeColumn("c1", "Todo")], archive: [] }),
    );
    const user = userEvent.setup();
    renderApp();

    await openArchive(user);
    const dlg = screen.getByRole("dialog", { name: /archive/i });

    await user.click(within(dlg).getByRole("button", { name: /close/i }));

    expect(
      screen.queryByRole("dialog", { name: /archive/i }),
    ).not.toBeInTheDocument();
  });
});
