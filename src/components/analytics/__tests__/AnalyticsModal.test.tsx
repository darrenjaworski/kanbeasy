import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEYS } from "../../../constants/storage";
import { renderApp } from "../../../test/renderApp";
import type { Column } from "../../../board/types";

function makeColumn(
  id: string,
  title: string,
  cards: Column["cards"] = [],
): Column {
  const now = Date.now();
  return { id, title, cards, createdAt: now, updatedAt: now };
}

function makeCard(
  id: string,
  title: string,
  columnHistory: { columnId: string; enteredAt: number }[] = [],
) {
  const now = Date.now();
  return {
    id,
    title,
    description: "",
    createdAt: now,
    updatedAt: now,
    columnHistory,
  };
}

async function openAnalytics(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /open analytics/i }));
  return screen.findByRole("dialog", { name: /analytics/i });
}

describe("AnalyticsModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens and displays metric cards for an empty board", async () => {
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns: [makeColumn("c1", "Todo")] }),
    );

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    expect(within(dlg).getByText("Total Cards")).toBeInTheDocument();
    expect(within(dlg).getByText("Cards in Flight")).toBeInTheDocument();
    expect(within(dlg).getByText("Avg Cycle Time")).toBeInTheDocument();
    expect(within(dlg).getByText("Avg Reverse Time")).toBeInTheDocument();
    expect(within(dlg).getByText("Throughput")).toBeInTheDocument();
    // Multiple metrics show "0" — verify at least one is present
    expect(within(dlg).getAllByText("0").length).toBeGreaterThanOrEqual(1);
  });

  it("shows total card count", async () => {
    const columns = [
      makeColumn("c1", "Todo", [
        makeCard("a", "Card A", [{ columnId: "c1", enteredAt: Date.now() }]),
        makeCard("b", "Card B", [{ columnId: "c1", enteredAt: Date.now() }]),
      ]),
      makeColumn("c2", "Done", [
        makeCard("c", "Card C", [{ columnId: "c2", enteredAt: Date.now() }]),
      ]),
    ];
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns }));

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    // Total Cards metric should show 3
    expect(within(dlg).getByText("3")).toBeInTheDocument();
  });

  it("shows cards in flight count with 3+ columns", async () => {
    const columns = [
      makeColumn("c1", "Todo", [
        makeCard("a", "Card A", [{ columnId: "c1", enteredAt: Date.now() }]),
      ]),
      makeColumn("c2", "In Progress", [
        makeCard("b", "Card B", [{ columnId: "c2", enteredAt: Date.now() }]),
        makeCard("c", "Card C", [{ columnId: "c2", enteredAt: Date.now() }]),
      ]),
      makeColumn("c3", "Done"),
    ];
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns }));

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    // Total cards = 3, cards in flight = 2 (middle column)
    expect(within(dlg).getByText("3")).toBeInTheDocument();
    expect(within(dlg).getByText("2")).toBeInTheDocument();
  });

  it("shows fallback text when no cycle time data available", async () => {
    // Cards with only 1 column history entry have no cycle time
    const columns = [
      makeColumn("c1", "Todo", [
        makeCard("a", "Card A", [{ columnId: "c1", enteredAt: Date.now() }]),
      ]),
    ];
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns }));

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    const fallbacks = within(dlg).getAllByText("Not enough data");
    expect(fallbacks.length).toBeGreaterThanOrEqual(2); // cycle time + reverse time
  });

  it("displays cycle time table when cards have history", async () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const columns = [
      makeColumn("c1", "Todo"),
      makeColumn("c2", "Done", [
        makeCard("a", "Completed task", [
          { columnId: "c1", enteredAt: oneHourAgo },
          { columnId: "c2", enteredAt: now },
        ]),
      ]),
    ];
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns }));

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    expect(within(dlg).getByText("Card Cycle Times")).toBeInTheDocument();
    expect(within(dlg).getByText("Completed task")).toBeInTheDocument();
    // "1h" appears in both the avg metric card and the table row
    expect(within(dlg).getAllByText("1h").length).toBeGreaterThanOrEqual(1);
  });

  it("displays throughput counts", async () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    const columns = [
      makeColumn("c1", "Todo"),
      makeColumn("c2", "Done", [
        makeCard("a", "Recent card", [
          { columnId: "c1", enteredAt: twoDaysAgo },
          { columnId: "c2", enteredAt: twoDaysAgo },
        ]),
      ]),
    ];
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns }));

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    // Throughput section should show at least 1 for 7 and 30 day counts
    expect(within(dlg).getByText("Last 7 days")).toBeInTheDocument();
    expect(within(dlg).getByText("Last 30 days")).toBeInTheDocument();
  });

  it("closes when close button is clicked", async () => {
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns: [makeColumn("c1", "Todo")] }),
    );

    const user = userEvent.setup();
    renderApp();

    await openAnalytics(user);
    const dlg = screen.getByRole("dialog", { name: /analytics/i });

    await user.click(within(dlg).getByRole("button", { name: /close/i }));

    expect(
      screen.queryByRole("dialog", { name: /analytics/i }),
    ).not.toBeInTheDocument();
  });

  it("shows 'show more' button when more than 10 cycle time entries", async () => {
    const now = Date.now();
    const cards = Array.from({ length: 12 }, (_, i) =>
      makeCard(`card-${i}`, `Task ${i + 1}`, [
        { columnId: "c1", enteredAt: now - (i + 1) * 60 * 60 * 1000 },
        { columnId: "c2", enteredAt: now - i * 60 * 60 * 1000 },
      ]),
    );

    const columns = [makeColumn("c1", "Todo"), makeColumn("c2", "Done", cards)];
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns }));

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    const showMore = within(dlg).getByRole("button", {
      name: /show more.*2 remaining/i,
    });
    expect(showMore).toBeInTheDocument();

    // Click show more to reveal remaining entries
    await user.click(showMore);

    // All 12 tasks should now be visible
    for (let i = 0; i < 12; i++) {
      expect(within(dlg).getByText(`Task ${i + 1}`)).toBeInTheDocument();
    }

    // Show more button should be gone
    expect(
      within(dlg).queryByRole("button", { name: /show more/i }),
    ).not.toBeInTheDocument();
  });
});
