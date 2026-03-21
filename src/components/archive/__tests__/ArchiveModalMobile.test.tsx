import "@testing-library/jest-dom";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderApp } from "../../../test/renderApp";
import {
  makeColumn,
  makeArchivedCard,
  resetCardNumber,
} from "../../../test/builders";
import { seedBoard } from "../../../utils/db";

import type * as HooksModule from "../../../hooks";

vi.mock("../../../hooks", async (importOriginal) => ({
  ...(await importOriginal<HooksModule>()),
  useIsMobile: () => true,
}));

async function openArchive(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("archive-button"));
  return screen.findByRole("dialog", { name: /archive/i });
}

function seedArchive(cards: ReturnType<typeof makeArchivedCard>[]) {
  seedBoard({
    columns: [makeColumn({ id: "c1", title: "Todo" })],
    archive: cards,
  });
}

describe("ArchiveModal mobile card list", () => {
  beforeEach(() => {
    resetCardNumber();
  });

  it("renders a list, not a table", async () => {
    seedArchive([makeArchivedCard({ id: "a1", title: "Task A" })]);
    const user = userEvent.setup();
    renderApp();
    const dlg = await openArchive(user);
    expect(within(dlg).queryByRole("table")).not.toBeInTheDocument();
    expect(within(dlg).getByRole("list")).toBeInTheDocument();
  });

  it("shows the card title", async () => {
    seedArchive([makeArchivedCard({ id: "a1", title: "My task" })]);
    const user = userEvent.setup();
    renderApp();
    const dlg = await openArchive(user);
    expect(within(dlg).getByText("My task")).toBeInTheDocument();
  });

  it("shows the archived date", async () => {
    seedArchive([
      makeArchivedCard({
        id: "a1",
        title: "Task A",
        archivedAt: new Date("2025-03-10").getTime(),
      }),
    ]);
    const user = userEvent.setup();
    renderApp();
    const dlg = await openArchive(user);
    expect(within(dlg).getByText(/Archived:/)).toBeInTheDocument();
    expect(within(dlg).getByText(/Mar/)).toBeInTheDocument();
  });

  it("shows all archived cards", async () => {
    seedArchive([
      makeArchivedCard({ id: "a1", title: "Task A" }),
      makeArchivedCard({ id: "a2", title: "Task B" }),
      makeArchivedCard({ id: "a3", title: "Task C" }),
    ]);
    const user = userEvent.setup();
    renderApp();
    const dlg = await openArchive(user);
    expect(within(dlg).getAllByTestId("archive-card-row")).toHaveLength(3);
  });

  it("select-all checkbox is in the action bar on mobile", async () => {
    seedArchive([makeArchivedCard({ id: "a1", title: "Task A" })]);
    const user = userEvent.setup();
    renderApp();
    const dlg = await openArchive(user);
    const actionBar = within(dlg).getByTestId("archive-action-bar");
    expect(
      within(actionBar).getByTestId("archive-select-all"),
    ).toBeInTheDocument();
  });

  it("selecting a card enables the Restore button", async () => {
    seedArchive([makeArchivedCard({ id: "a1", title: "Task A" })]);
    const user = userEvent.setup();
    renderApp();
    const dlg = await openArchive(user);

    const restoreBtn = within(dlg).getByTestId("archive-bulk-restore");
    expect(restoreBtn).toBeDisabled();

    await user.click(within(dlg).getByTestId("archive-select-a1"));
    expect(restoreBtn).not.toBeDisabled();
    expect(restoreBtn).toHaveTextContent("Restore (1)");
  });

  it("select-all button shows 'Select all' then 'Deselect all' after selecting", async () => {
    seedArchive([makeArchivedCard({ id: "a1", title: "Task A" })]);
    const user = userEvent.setup();
    renderApp();
    const dlg = await openArchive(user);

    const btn = within(dlg).getByTestId("archive-select-all");
    expect(btn).toHaveTextContent("Select all");

    await user.click(btn);
    expect(btn).toHaveTextContent("Deselect all");

    await user.click(btn);
    expect(btn).toHaveTextContent("Select all");
  });

  it("select-all toggles all card checkboxes", async () => {
    seedArchive([
      makeArchivedCard({ id: "a1", title: "Task A" }),
      makeArchivedCard({ id: "a2", title: "Task B" }),
    ]);
    const user = userEvent.setup();
    renderApp();
    const dlg = await openArchive(user);

    await user.click(within(dlg).getByTestId("archive-select-all"));

    const checkboxes = within(dlg).getAllByRole("checkbox");
    for (const cb of checkboxes) {
      expect(cb).toBeChecked();
    }
  });

  it("shows 'Select all' (not 'Deselect all') when only some cards are selected", async () => {
    seedArchive([
      makeArchivedCard({ id: "a1", title: "Task A" }),
      makeArchivedCard({ id: "a2", title: "Task B" }),
    ]);
    const user = userEvent.setup();
    renderApp();
    const dlg = await openArchive(user);

    await user.click(within(dlg).getByTestId("archive-select-a1"));

    expect(within(dlg).getByTestId("archive-select-all")).toHaveTextContent(
      "Select all",
    );
  });

  it("restoring a card removes it from the list", async () => {
    seedArchive([makeArchivedCard({ id: "a1", title: "Task A" })]);
    const user = userEvent.setup();
    renderApp();
    const dlg = await openArchive(user);

    await user.click(within(dlg).getByTestId("archive-select-a1"));
    await user.click(within(dlg).getByTestId("archive-bulk-restore"));

    expect(within(dlg).getByTestId("archive-empty")).toBeInTheDocument();
  });
});
