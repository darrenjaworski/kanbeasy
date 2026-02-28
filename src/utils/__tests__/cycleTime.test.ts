import { describe, expect, it } from "vitest";
import {
  computeAverageCycleTime,
  formatDuration,
  getCardCycleTimes,
} from "../cycleTime";
import type { Card, Column, ColumnHistoryEntry } from "../../board/types";

let cardNum = 1;
function makeCard(
  id: string,
  title: string,
  opts: {
    createdAt?: number;
    updatedAt?: number;
    columnHistory?: ColumnHistoryEntry[];
  } = {},
): Card {
  return {
    id,
    number: cardNum++,
    title,
    description: "",
    ticketTypeId: null,
    createdAt: opts.createdAt ?? 0,
    updatedAt: opts.updatedAt ?? 0,
    columnHistory: opts.columnHistory ?? [],
  };
}

function makeColumn(cards: Column["cards"]): Column {
  return {
    id: crypto.randomUUID(),
    title: "Col",
    cards,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("computeAverageCycleTime", () => {
  it("returns null when there are no cards", () => {
    expect(computeAverageCycleTime([])).toBeNull();
    expect(computeAverageCycleTime([makeColumn([])])).toBeNull();
  });

  it("returns null when all cards have only 1 history entry (never moved)", () => {
    const col = makeColumn([
      makeCard("c1", "Card 1", {
        createdAt: 1000,
        updatedAt: 1000,
        columnHistory: [{ columnId: "col1", enteredAt: 1000 }],
      }),
    ]);
    expect(computeAverageCycleTime([col])).toBeNull();
  });

  it("returns null when cards have empty history (grandfathered)", () => {
    const col = makeColumn([
      makeCard("c1", "Card 1", { createdAt: 1000, updatedAt: 1000 }),
    ]);
    expect(computeAverageCycleTime([col])).toBeNull();
  });

  it("computes cycle time for a single moved card", () => {
    const col = makeColumn([
      makeCard("c1", "Card 1", {
        createdAt: 1000,
        updatedAt: 5000,
        columnHistory: [
          { columnId: "col1", enteredAt: 1000 },
          { columnId: "col2", enteredAt: 5000 },
        ],
      }),
    ]);
    expect(computeAverageCycleTime([col])).toBe(4000);
  });

  it("averages cycle times across multiple moved cards", () => {
    const col1 = makeColumn([
      makeCard("c1", "Card 1", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 3000 },
        ],
      }),
    ]);
    const col2 = makeColumn([
      makeCard("c2", "Card 2", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 5000 },
          { columnId: "c", enteredAt: 9000 },
        ],
      }),
    ]);
    // Card 1: 3000 - 1000 = 2000
    // Card 2: 9000 - 1000 = 8000
    // Average: (2000 + 8000) / 2 = 5000
    expect(computeAverageCycleTime([col1, col2])).toBe(5000);
  });

  it("excludes unmoved cards from the average", () => {
    const col = makeColumn([
      makeCard("c1", "Moved", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 7000 },
        ],
      }),
      makeCard("c2", "Unmoved", {
        columnHistory: [{ columnId: "a", enteredAt: 1000 }],
      }),
      makeCard("c3", "Grandfathered"),
    ]);
    // Only c1 qualifies: 7000 - 1000 = 6000
    expect(computeAverageCycleTime([col])).toBe(6000);
  });
});

describe("getCardCycleTimes", () => {
  it("returns empty array when no cards qualify", () => {
    expect(getCardCycleTimes([])).toEqual([]);
    expect(getCardCycleTimes([makeColumn([])])).toEqual([]);
    expect(
      getCardCycleTimes([
        makeColumn([
          makeCard("c1", "Unmoved", {
            columnHistory: [{ columnId: "a", enteredAt: 1000 }],
          }),
        ]),
      ]),
    ).toEqual([]);
  });

  it("returns cards sorted descending by cycle time", () => {
    const col = makeColumn([
      makeCard("c1", "Fast Card", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 3000 },
        ],
      }),
      makeCard("c2", "Slow Card", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 9000 },
        ],
      }),
    ]);
    const result = getCardCycleTimes([col]);
    // Card titles now include #N prefix
    expect(result).toHaveLength(2);
    expect(result[0].cycleTimeMs).toBe(8000);
    expect(result[0].cardTitle).toContain("Slow Card");
    expect(result[1].cycleTimeMs).toBe(2000);
    expect(result[1].cardTitle).toContain("Fast Card");
  });

  it("excludes cards with fewer than 2 history entries", () => {
    const col = makeColumn([
      makeCard("c1", "Moved", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 5000 },
        ],
      }),
      makeCard("c2", "Unmoved", {
        columnHistory: [{ columnId: "a", enteredAt: 1000 }],
      }),
      makeCard("c3", "Grandfathered"),
    ]);
    const result = getCardCycleTimes([col]);
    expect(result).toHaveLength(1);
    expect(result[0].cycleTimeMs).toBe(4000);
    expect(result[0].cardTitle).toContain("Moved");
  });
});

describe("getCardCycleTimes with additionalCards", () => {
  it("includes additional cards in cycle time results", () => {
    const col = makeColumn([
      makeCard("c1", "Board Card", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 3000 },
        ],
      }),
    ]);
    const archivedCard = makeCard("c2", "Archived Card", {
      columnHistory: [
        { columnId: "a", enteredAt: 1000 },
        { columnId: "b", enteredAt: 6000 },
      ],
    });

    const result = getCardCycleTimes([col], [archivedCard]);
    expect(result).toHaveLength(2);
    // Sorted descending: archived (5000) then board (2000)
    expect(result[0].cycleTimeMs).toBe(5000);
    expect(result[0].cardTitle).toContain("Archived Card");
    expect(result[1].cycleTimeMs).toBe(2000);
    expect(result[1].cardTitle).toContain("Board Card");
  });

  it("excludes additional cards with fewer than 2 history entries", () => {
    const col = makeColumn([]);
    const archivedCard = makeCard("c1", "Unmoved Archived", {
      columnHistory: [{ columnId: "a", enteredAt: 1000 }],
    });

    expect(getCardCycleTimes([col], [archivedCard])).toEqual([]);
  });

  it("marks additional cards as isArchived", () => {
    const col = makeColumn([
      makeCard("c1", "Board Card", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 3000 },
        ],
      }),
    ]);
    const archivedCard = makeCard("c2", "Archived Card", {
      columnHistory: [
        { columnId: "a", enteredAt: 1000 },
        { columnId: "b", enteredAt: 6000 },
      ],
    });

    const result = getCardCycleTimes([col], [archivedCard]);
    const archived = result.find((r) => r.cardTitle.includes("Archived Card"));
    const board = result.find((r) => r.cardTitle.includes("Board Card"));
    expect(archived?.isArchived).toBe(true);
    expect(board?.isArchived).toBeUndefined();
  });

  it("excludes additional cards with empty columnHistory", () => {
    const col = makeColumn([]);
    const archivedCard = makeCard("c1", "Empty history", {
      columnHistory: [],
    });

    expect(getCardCycleTimes([col], [archivedCard])).toEqual([]);
  });

  it("returns results when all cards come from additionalCards", () => {
    const col = makeColumn([]);
    const archivedCards = [
      makeCard("c1", "Archived A", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 4000 },
        ],
      }),
      makeCard("c2", "Archived B", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 7000 },
        ],
      }),
    ];

    const result = getCardCycleTimes([col], archivedCards);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.isArchived === true)).toBe(true);
  });

  it("includes both board and additional cards independently even with duplicate IDs", () => {
    const sharedId = "same-id";
    const col = makeColumn([
      makeCard(sharedId, "Board version", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 3000 },
        ],
      }),
    ]);
    const archivedCard = makeCard(sharedId, "Archived version", {
      columnHistory: [
        { columnId: "a", enteredAt: 1000 },
        { columnId: "b", enteredAt: 5000 },
      ],
    });

    const result = getCardCycleTimes([col], [archivedCard]);
    expect(result).toHaveLength(2);
  });

  it("computes average including additional cards", () => {
    const col = makeColumn([
      makeCard("c1", "Board Card", {
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 3000 },
        ],
      }),
    ]);
    const archivedCard = makeCard("c2", "Archived Card", {
      columnHistory: [
        { columnId: "a", enteredAt: 1000 },
        { columnId: "b", enteredAt: 7000 },
      ],
    });

    // Board: 2000, Archived: 6000, Average: 4000
    expect(computeAverageCycleTime([col], [archivedCard])).toBe(4000);
  });
});

describe("formatDuration", () => {
  it("formats sub-minute durations as seconds", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(1_000)).toBe("1s");
    expect(formatDuration(45_000)).toBe("45s");
  });

  it("formats durations under 1 hour as minutes and seconds", () => {
    expect(formatDuration(60_000)).toBe("1m");
    expect(formatDuration(90_000)).toBe("1m 30s");
    expect(formatDuration(30 * 60_000)).toBe("30m");
    expect(formatDuration(59 * 60_000 + 15_000)).toBe("59m 15s");
  });

  it("formats durations under 1 day as hours and minutes", () => {
    expect(formatDuration(60 * 60_000)).toBe("1h");
    expect(formatDuration(90 * 60_000)).toBe("1h 30m");
    expect(formatDuration(23 * 60 * 60_000 + 45 * 60_000)).toBe("23h 45m");
  });

  it("formats durations of 1+ days as days and hours", () => {
    expect(formatDuration(24 * 60 * 60_000)).toBe("1d");
    expect(formatDuration(25 * 60 * 60_000)).toBe("1d 1h");
    expect(formatDuration(50 * 60 * 60_000)).toBe("2d 2h");
  });

  it("omits trailing zero components", () => {
    expect(formatDuration(2 * 60 * 60_000)).toBe("2h");
    expect(formatDuration(48 * 60 * 60_000)).toBe("2d");
    expect(formatDuration(5 * 60_000)).toBe("5m");
  });
});
