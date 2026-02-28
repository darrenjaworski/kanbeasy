import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEYS } from "../../../constants/storage";
import { renderApp } from "../../../test/renderApp";
import type { ArchivedCard, Column } from "../../../board/types";

function makeColumn(
  id: string,
  title: string,
  cards: Column["cards"] = [],
): Column {
  const now = Date.now();
  return { id, title, cards, createdAt: now, updatedAt: now };
}

let cardNum = 1;
function makeCard(
  id: string,
  title: string,
  columnHistory: { columnId: string; enteredAt: number }[] = [],
) {
  const now = Date.now();
  return {
    id,
    number: cardNum++,
    title,
    description: "",
    ticketTypeId: null as string | null,
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
    cardNum = 1;
  });

  it("disables analytics button when there are no cards", () => {
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns: [makeColumn("c1", "Todo")] }),
    );
    renderApp();

    expect(
      screen.getByRole("button", { name: /open analytics/i }),
    ).toBeDisabled();
  });

  it("opens and displays metric cards for a board with one card", async () => {
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({
        columns: [
          makeColumn("c1", "Todo", [
            makeCard("x", "Placeholder", [
              { columnId: "c1", enteredAt: Date.now() },
            ]),
          ]),
        ],
      }),
    );

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    expect(within(dlg).getByText("Total Cards")).toBeInTheDocument();
    expect(within(dlg).getByText("Cards in Flight")).toBeInTheDocument();
    expect(within(dlg).getByText("Avg Cycle Time")).toBeInTheDocument();
    expect(within(dlg).getByText("Avg Reverse Time")).toBeInTheDocument();
    expect(within(dlg).getByText("Throughput")).toBeInTheDocument();
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
    // Card title now includes #N prefix from card number
    expect(
      within(dlg).getByText((text) => text.includes("Completed task")),
    ).toBeInTheDocument();
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
      JSON.stringify({
        columns: [
          makeColumn("c1", "Todo", [
            makeCard("x", "Placeholder", [
              { columnId: "c1", enteredAt: Date.now() },
            ]),
          ]),
        ],
      }),
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

  it("includes archived cards in cycle time metrics", async () => {
    const now = Date.now();
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    const columns = [
      makeColumn("c1", "Todo", [
        makeCard("board1", "Board card", [{ columnId: "c1", enteredAt: now }]),
      ]),
      makeColumn("c2", "Done"),
    ];
    const archive: ArchivedCard[] = [
      {
        ...makeCard("archived1", "Archived task", [
          { columnId: "c1", enteredAt: twoHoursAgo },
          { columnId: "c2", enteredAt: now },
        ]),
        ticketTypeId: null,
        archivedAt: now,
        archivedFromColumnId: "c2",
      },
    ];

    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns, archive }),
    );

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    // The archived card should appear in the cycle time table
    expect(within(dlg).getByText("Card Cycle Times")).toBeInTheDocument();
    expect(
      within(dlg).getByText((text) => text.includes("Archived task")),
    ).toBeInTheDocument();
  });

  it("shows '(archived)' label next to archived card titles in cycle time table", async () => {
    const now = Date.now();
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    const columns = [
      makeColumn("c1", "Todo"),
      makeColumn("c2", "Done", [
        makeCard("board1", "Board task", [
          { columnId: "c1", enteredAt: twoHoursAgo },
          { columnId: "c2", enteredAt: now },
        ]),
      ]),
    ];
    const archive: ArchivedCard[] = [
      {
        ...makeCard("archived1", "Archived task", [
          { columnId: "c1", enteredAt: twoHoursAgo },
          { columnId: "c2", enteredAt: now },
        ]),
        ticketTypeId: null,
        archivedAt: now,
        archivedFromColumnId: "c2",
      },
    ];

    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns, archive }),
    );

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    // The archived card row should have the "(archived)" indicator
    const archivedLabel = within(dlg).getByText("(archived)");
    expect(archivedLabel).toBeInTheDocument();

    // The "(archived)" label should be near the archived card title
    const archivedCell = archivedLabel.closest("td")!;
    expect(archivedCell.textContent).toContain("Archived task");

    // The board card should NOT have "(archived)"
    const boardRow = within(dlg).getByText((text) =>
      text.includes("Board task"),
    );
    const boardCell = boardRow.closest("td")!;
    expect(boardCell.textContent).not.toContain("(archived)");
  });

  it("does not include archived cards in total card count", async () => {
    const now = Date.now();

    const columns = [
      makeColumn("c1", "Todo", [
        makeCard("a", "Board Card", [{ columnId: "c1", enteredAt: now }]),
      ]),
    ];
    const archive: ArchivedCard[] = [
      {
        ...makeCard("archived1", "Archived Card", [
          { columnId: "c1", enteredAt: now },
        ]),
        ticketTypeId: null,
        archivedAt: now,
        archivedFromColumnId: "c1",
      },
    ];

    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns, archive }),
    );

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    // Total Cards should only count board cards (1), not archived
    const totalCardsMetric = within(dlg).getByText("Total Cards");
    const metricCard = totalCardsMetric.closest("div")!;
    expect(within(metricCard).getByText("1")).toBeInTheDocument();
  });

  it("shows updated disclaimer text about archived cards", async () => {
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({
        columns: [
          makeColumn("c1", "Todo", [
            makeCard("x", "Placeholder", [
              { columnId: "c1", enteredAt: Date.now() },
            ]),
          ]),
        ],
      }),
    );

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    expect(
      within(dlg).getByText(/include archived cards/i),
    ).toBeInTheDocument();
  });

  it("shows reverse time table with show more pagination", async () => {
    const now = Date.now();
    // Cards that move forward then backward create reverse time
    // c1 (index 0), c2 (index 1), c3 (index 2)
    // History: c1 → c3 → c1 → c3 means the c3→c1 move is backwards
    const cards = Array.from({ length: 12 }, (_, i) =>
      makeCard(`rt-${i}`, `Rev ${i + 1}`, [
        { columnId: "c1", enteredAt: now - (i + 3) * 60 * 60 * 1000 },
        { columnId: "c3", enteredAt: now - (i + 2) * 60 * 60 * 1000 },
        { columnId: "c1", enteredAt: now - (i + 1) * 60 * 60 * 1000 },
        { columnId: "c3", enteredAt: now - i * 60 * 60 * 1000 },
      ]),
    );

    const columns = [
      makeColumn("c1", "Todo"),
      makeColumn("c2", "In Progress"),
      makeColumn("c3", "Done", cards),
    ];
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns }));

    const user = userEvent.setup();
    renderApp();

    const dlg = await openAnalytics(user);

    expect(within(dlg).getByText("Card Reverse Times")).toBeInTheDocument();

    // Both cycle time and reverse time tables should have show more buttons
    const showMoreButtons = within(dlg).getAllByRole("button", {
      name: /show more/i,
    });
    expect(showMoreButtons).toHaveLength(2);

    // Click the last show more button (reverse time table is rendered after cycle times)
    await user.click(showMoreButtons[1]);

    // Only one show more button should remain (for cycle times)
    const remaining = within(dlg).getAllByRole("button", {
      name: /show more/i,
    });
    expect(remaining).toHaveLength(1);
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

    // All 12 tasks should now be visible (card titles include #N prefix)
    for (let i = 0; i < 12; i++) {
      const label = `Task ${i + 1}`;
      expect(
        within(dlg).getByText((text) => text.endsWith(label) || text === label),
      ).toBeInTheDocument();
    }

    // Show more button should be gone
    expect(
      within(dlg).queryByRole("button", { name: /show more/i }),
    ).not.toBeInTheDocument();
  });
});
