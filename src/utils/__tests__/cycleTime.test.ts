import { describe, expect, it, beforeEach } from "vitest";
import {
  computeAverageCycleTime,
  formatDuration,
  getCardCycleTimes,
} from "../cycleTime";
import { makeCard, makeColumn, resetCardNumber } from "../../test/builders";

describe("computeAverageCycleTime", () => {
  beforeEach(() => {
    resetCardNumber();
  });

  it("returns null when there are no cards", () => {
    expect(computeAverageCycleTime([])).toBeNull();
    expect(computeAverageCycleTime([makeColumn({ id: crypto.randomUUID() })])).toBeNull();
  });

  it("returns null when all cards have only 1 history entry (never moved)", () => {
    const col = makeColumn({
      id: crypto.randomUUID(),
      cards: [
        makeCard({
          id: "c1",
          title: "Card 1",
          createdAt: 1000,
          updatedAt: 1000,
          columnHistory: [{ columnId: "col1", enteredAt: 1000 }],
        }),
      ],
    });
    expect(computeAverageCycleTime([col])).toBeNull();
  });

  it("returns null when cards have empty history (grandfathered)", () => {
    const col = makeColumn({
      id: crypto.randomUUID(),
      cards: [
        makeCard({
          id: "c1",
          title: "Card 1",
          createdAt: 1000,
          updatedAt: 1000,
        }),
      ],
    });
    expect(computeAverageCycleTime([col])).toBeNull();
  });

  it("computes cycle time for a single moved card", () => {
    const col = makeColumn({
      id: crypto.randomUUID(),
      cards: [
        makeCard({
          id: "c1",
          title: "Card 1",
          createdAt: 1000,
          updatedAt: 5000,
          columnHistory: [
            { columnId: "col1", enteredAt: 1000 },
            { columnId: "col2", enteredAt: 5000 },
          ],
        }),
      ],
    });
    expect(computeAverageCycleTime([col])).toBe(4000);
  });

  it("averages cycle times across multiple moved cards", () => {
    const col1 = makeColumn({
      id: crypto.randomUUID(),
      cards: [
        makeCard({
          id: "c1",
          title: "Card 1",
          columnHistory: [
            { columnId: "a", enteredAt: 1000 },
            { columnId: "b", enteredAt: 3000 },
          ],
        }),
      ],
    });
    const col2 = makeColumn({
      id: crypto.randomUUID(),
      cards: [
        makeCard({
          id: "c2",
          title: "Card 2",
          columnHistory: [
            { columnId: "a", enteredAt: 1000 },
            { columnId: "b", enteredAt: 5000 },
            { columnId: "c", enteredAt: 9000 },
          ],
        }),
      ],
    });
    // Card 1: 3000 - 1000 = 2000
    // Card 2: 9000 - 1000 = 8000
    // Average: (2000 + 8000) / 2 = 5000
    expect(computeAverageCycleTime([col1, col2])).toBe(5000);
  });

  it("excludes unmoved cards from the average", () => {
    const col = makeColumn({
      id: crypto.randomUUID(),
      cards: [
        makeCard({
          id: "c1",
          title: "Moved",
          columnHistory: [
            { columnId: "a", enteredAt: 1000 },
            { columnId: "b", enteredAt: 7000 },
          ],
        }),
        makeCard({
          id: "c2",
          title: "Unmoved",
          columnHistory: [{ columnId: "a", enteredAt: 1000 }],
        }),
        makeCard({
          id: "c3",
          title: "Grandfathered",
        }),
      ],
    });
    // Only c1 qualifies: 7000 - 1000 = 6000
    expect(computeAverageCycleTime([col])).toBe(6000);
  });
});

describe("getCardCycleTimes", () => {
  beforeEach(() => {
    resetCardNumber();
  });

  it("returns empty array when no cards qualify", () => {
    expect(getCardCycleTimes([])).toEqual([]);
    expect(getCardCycleTimes([makeColumn({ id: crypto.randomUUID() })])).toEqual([]);
    expect(
      getCardCycleTimes([
        makeColumn({
          id: crypto.randomUUID(),
          cards: [
            makeCard({
              id: "c1",
              title: "Unmoved",
              columnHistory: [{ columnId: "a", enteredAt: 1000 }],
            }),
          ],
        }),
      ]),
    ).toEqual([]);
  });

  it("returns cards sorted descending by cycle time", () => {
    const col = makeColumn({
      id: crypto.randomUUID(),
      cards: [
        makeCard({
          id: "c1",
          title: "Fast Card",
          columnHistory: [
            { columnId: "a", enteredAt: 1000 },
            { columnId: "b", enteredAt: 3000 },
          ],
        }),
        makeCard({
          id: "c2",
          title: "Slow Card",
          columnHistory: [
            { columnId: "a", enteredAt: 1000 },
            { columnId: "b", enteredAt: 9000 },
          ],
        }),
      ],
    });
    const result = getCardCycleTimes([col]);
    // Card titles now include #N prefix
    expect(result).toHaveLength(2);
    expect(result[0].cycleTimeMs).toBe(8000);
    expect(result[0].cardTitle).toContain("Slow Card");
    expect(result[1].cycleTimeMs).toBe(2000);
    expect(result[1].cardTitle).toContain("Fast Card");
  });

  it("excludes cards with fewer than 2 history entries", () => {
    const col = makeColumn({
      id: crypto.randomUUID(),
      cards: [
        makeCard({
          id: "c1",
          title: "Moved",
          columnHistory: [
            { columnId: "a", enteredAt: 1000 },
            { columnId: "b", enteredAt: 5000 },
          ],
        }),
        makeCard({
          id: "c2",
          title: "Unmoved",
          columnHistory: [{ columnId: "a", enteredAt: 1000 }],
        }),
        makeCard({
          id: "c3",
          title: "Grandfathered",
        }),
      ],
    });
    const result = getCardCycleTimes([col]);
    expect(result).toHaveLength(1);
    expect(result[0].cycleTimeMs).toBe(4000);
    expect(result[0].cardTitle).toContain("Moved");
  });
});

describe("getCardCycleTimes with additionalCards", () => {
  it("includes additional cards in cycle time results", () => {
    const col = makeColumn({
      id: "col-1",
      cards: [
        makeCard({
          id: "c1",
          title: "Board Card",
          columnHistory: [
            { columnId: "a", enteredAt: 1000 },
            { columnId: "b", enteredAt: 3000 },
          ],
        }),
      ],
    });
    const archivedCard = makeCard({
      id: "c2",
      title: "Archived Card",
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
    const col = makeColumn({ id: "col-1" });
    const archivedCard = makeCard({
      id: "c1",
      title: "Unmoved Archived",
      columnHistory: [{ columnId: "a", enteredAt: 1000 }],
    });

    expect(getCardCycleTimes([col], [archivedCard])).toEqual([]);
  });

  it("marks additional cards as isArchived", () => {
    const col = makeColumn({
      id: "col-1",
      cards: [
        makeCard({
          id: "c1",
          title: "Board Card",
          columnHistory: [
            { columnId: "a", enteredAt: 1000 },
            { columnId: "b", enteredAt: 3000 },
          ],
        }),
      ],
    });
    const archivedCard = makeCard({
      id: "c2",
      title: "Archived Card",
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
    const col = makeColumn({ id: "col-1" });
    const archivedCard = makeCard({
      id: "c1",
      title: "Empty history",
      columnHistory: [],
    });

    expect(getCardCycleTimes([col], [archivedCard])).toEqual([]);
  });

  it("returns results when all cards come from additionalCards", () => {
    const col = makeColumn({ id: "col-1" });
    const archivedCards = [
      makeCard({
        id: "c1",
        title: "Archived A",
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 4000 },
        ],
      }),
      makeCard({
        id: "c2",
        title: "Archived B",
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
    const col = makeColumn({
      id: "col-1",
      cards: [
        makeCard({
          id: sharedId,
          title: "Board version",
          columnHistory: [
            { columnId: "a", enteredAt: 1000 },
            { columnId: "b", enteredAt: 3000 },
          ],
        }),
      ],
    });
    const archivedCard = makeCard({
      id: sharedId,
      title: "Archived version",
      columnHistory: [
        { columnId: "a", enteredAt: 1000 },
        { columnId: "b", enteredAt: 5000 },
      ],
    });

    const result = getCardCycleTimes([col], [archivedCard]);
    expect(result).toHaveLength(2);
  });

  it("computes average including additional cards", () => {
    const col = makeColumn({
      id: "col-1",
      cards: [
        makeCard({
          id: "c1",
          title: "Board Card",
          columnHistory: [
            { columnId: "a", enteredAt: 1000 },
            { columnId: "b", enteredAt: 3000 },
          ],
        }),
      ],
    });
    const archivedCard = makeCard({
      id: "c2",
      title: "Archived Card",
      columnHistory: [
        { columnId: "a", enteredAt: 1000 },
        { columnId: "b", enteredAt: 7000 },
      ],
    });

    // Board: 2000, Archived: 6000, Average: 4000
    expect(computeAverageCycleTime([col], [archivedCard])).toBe(4000);
  });
});

describe("cycleTime edge cases", () => {
  beforeEach(() => {
    resetCardNumber();
  });

  it("produces negative cycle time for out-of-order timestamps", () => {
    const col = makeColumn({
      id: "col-1",
      cards: [
        makeCard({
          id: "c1",
          title: "Time traveler",
          columnHistory: [
            { columnId: "a", enteredAt: 5000 },
            { columnId: "b", enteredAt: 1000 },
          ],
        }),
      ],
    });
    const result = getCardCycleTimes([col]);
    expect(result).toHaveLength(1);
    expect(result[0].cycleTimeMs).toBe(-4000);
  });

  it("returns 0ms cycle time when timestamps are identical", () => {
    const col = makeColumn({
      id: "col-1",
      cards: [
        makeCard({
          id: "c1",
          title: "Instant move",
          columnHistory: [
            { columnId: "a", enteredAt: 5000 },
            { columnId: "b", enteredAt: 5000 },
          ],
        }),
      ],
    });
    const result = getCardCycleTimes([col]);
    expect(result).toHaveLength(1);
    expect(result[0].cycleTimeMs).toBe(0);
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
