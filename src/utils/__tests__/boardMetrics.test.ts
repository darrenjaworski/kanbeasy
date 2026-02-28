import { describe, expect, it } from "vitest";
import {
  computeAverageReverseTime,
  getCardReverseTimes,
  getCardsInFlight,
  getThroughput,
  getTotalCards,
} from "../boardMetrics";
import type { Card, Column, ColumnHistoryEntry } from "../../board/types";

let cardNum = 1;
function makeCard(
  id: string,
  title: string,
  columnHistory: ColumnHistoryEntry[] = [],
): Card {
  return {
    id,
    number: cardNum++,
    title,
    description: "",
    ticketTypeId: null,
    createdAt: 0,
    updatedAt: 0,
    columnHistory,
  };
}

function makeColumn(cards: Column["cards"], id?: string): Column {
  return {
    id: id ?? crypto.randomUUID(),
    title: "Col",
    cards,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("getTotalCards", () => {
  it("returns 0 for no columns", () => {
    expect(getTotalCards([])).toBe(0);
  });

  it("returns 0 for empty columns", () => {
    expect(getTotalCards([makeColumn([]), makeColumn([])])).toBe(0);
  });

  it("sums cards across all columns", () => {
    const col1 = makeColumn([makeCard("c1", "A"), makeCard("c2", "B")]);
    const col2 = makeColumn([makeCard("c3", "C")]);
    expect(getTotalCards([col1, col2])).toBe(3);
  });
});

describe("getCardsInFlight", () => {
  it("returns 0 for 0 columns", () => {
    expect(getCardsInFlight([])).toBe(0);
  });

  it("returns 0 for 1 column", () => {
    const col = makeColumn([makeCard("c1", "A")]);
    expect(getCardsInFlight([col])).toBe(0);
  });

  it("returns 0 for 2 columns", () => {
    const col1 = makeColumn([makeCard("c1", "A")]);
    const col2 = makeColumn([makeCard("c2", "B")]);
    expect(getCardsInFlight([col1, col2])).toBe(0);
  });

  it("returns 0 for 3 columns with empty middle", () => {
    const first = makeColumn([makeCard("c1", "A")]);
    const middle = makeColumn([]);
    const last = makeColumn([makeCard("c2", "B")]);
    expect(getCardsInFlight([first, middle, last])).toBe(0);
  });

  it("counts cards in middle columns for 3+ columns", () => {
    const first = makeColumn([makeCard("c1", "A")]);
    const middle1 = makeColumn([makeCard("c2", "B"), makeCard("c3", "C")]);
    const middle2 = makeColumn([makeCard("c4", "D")]);
    const last = makeColumn([makeCard("c5", "E")]);
    expect(getCardsInFlight([first, middle1, middle2, last])).toBe(3);
  });
});

describe("getThroughput", () => {
  it("returns zeros for empty columns", () => {
    expect(getThroughput([])).toEqual({ last7Days: 0, last30Days: 0 });
  });

  it("returns zeros when final column is empty", () => {
    const col = makeColumn([], "done");
    expect(getThroughput([col])).toEqual({ last7Days: 0, last30Days: 0 });
  });

  it("counts cards completed within 7 and 30 days", () => {
    const now = 100_000_000;
    const ms1Day = 24 * 60 * 60 * 1000;
    const doneId = "done";

    const col = makeColumn(
      [
        makeCard("c1", "Recent", [
          { columnId: doneId, enteredAt: now - ms1Day * 3 },
        ]),
        makeCard("c2", "This month", [
          { columnId: doneId, enteredAt: now - ms1Day * 20 },
        ]),
        makeCard("c3", "Old", [
          { columnId: doneId, enteredAt: now - ms1Day * 60 },
        ]),
      ],
      doneId,
    );

    expect(getThroughput([col], now)).toEqual({ last7Days: 1, last30Days: 2 });
  });

  it("ignores cards whose last history entry does not match the final column", () => {
    const now = 100_000_000;
    const doneId = "done";

    const col = makeColumn(
      [
        makeCard("c1", "Wrong column ref", [
          { columnId: "other", enteredAt: now - 1000 },
        ]),
      ],
      doneId,
    );

    expect(getThroughput([col], now)).toEqual({ last7Days: 0, last30Days: 0 });
  });

  it("ignores cards with empty history", () => {
    const doneId = "done";
    const col = makeColumn([makeCard("c1", "No history")], doneId);

    expect(getThroughput([col], Date.now())).toEqual({
      last7Days: 0,
      last30Days: 0,
    });
  });

  it("only counts cards in the final column, not other columns", () => {
    const now = 100_000_000;
    const ms1Day = 24 * 60 * 60 * 1000;
    const doneId = "done";

    const todo = makeColumn(
      [
        makeCard("c1", "In todo", [
          { columnId: doneId, enteredAt: now - ms1Day },
        ]),
      ],
      "todo",
    );
    const done = makeColumn(
      [makeCard("c2", "Done", [{ columnId: doneId, enteredAt: now - ms1Day }])],
      doneId,
    );

    expect(getThroughput([todo, done], now)).toEqual({
      last7Days: 1,
      last30Days: 1,
    });
  });

  it("includes cards at exactly the 7-day boundary", () => {
    const now = 100_000_000;
    const ms7Days = 7 * 24 * 60 * 60 * 1000;
    const doneId = "done";

    const col = makeColumn(
      [
        makeCard("c1", "Exact boundary", [
          { columnId: doneId, enteredAt: now - ms7Days },
        ]),
      ],
      doneId,
    );

    expect(getThroughput([col], now)).toEqual({ last7Days: 1, last30Days: 1 });
  });
});

describe("getCardReverseTimes", () => {
  it("returns empty array when no cards have history", () => {
    const col = makeColumn([makeCard("c1", "A")]);
    expect(getCardReverseTimes([col])).toEqual([]);
  });

  it("returns empty array when all moves are forward", () => {
    const colA = makeColumn([], "colA");
    const colB = makeColumn([], "colB");
    const colC = makeColumn(
      [
        makeCard("c1", "Forward", [
          { columnId: "colA", enteredAt: 1000 },
          { columnId: "colB", enteredAt: 2000 },
          { columnId: "colC", enteredAt: 3000 },
        ]),
      ],
      "colC",
    );
    expect(getCardReverseTimes([colA, colB, colC])).toEqual([]);
  });

  it("detects a single backward move", () => {
    const now = 10000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        makeCard("c1", "Bounced", [
          { columnId: "colA", enteredAt: 1000 },
          { columnId: "colB", enteredAt: 2000 },
          { columnId: "colA", enteredAt: 3000 }, // backward
          { columnId: "colB", enteredAt: 5000 },
        ]),
      ],
      "colB",
    );

    const result = getCardReverseTimes([colA, colB], now);
    // Backward at index 1→2: colB(1) → colA(0). Time in colA = 5000 - 3000 = 2000
    expect(result).toEqual([
      {
        cardTitle: "#" + result[0].cardTitle.match(/\d+/)![0] + " Bounced",
        reverseTimeMs: 2000,
      },
    ]);
  });

  it("accumulates multiple backward moves in one card", () => {
    const now = 20000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn([], "colB");
    const colC = makeColumn(
      [
        makeCard("c1", "Multi-bounce", [
          { columnId: "colA", enteredAt: 1000 },
          { columnId: "colC", enteredAt: 2000 },
          { columnId: "colB", enteredAt: 3000 }, // backward C→B
          { columnId: "colC", enteredAt: 6000 },
          { columnId: "colA", enteredAt: 7000 }, // backward C→A
          { columnId: "colC", enteredAt: 10000 },
        ]),
      ],
      "colC",
    );

    const result = getCardReverseTimes([colA, colB, colC], now);
    // Backward at 1→2: colC(2) → colB(1), time = 6000 - 3000 = 3000
    // Backward at 3→4: colC(2) → colA(0), time = 10000 - 7000 = 3000
    expect(result).toHaveLength(1);
    expect(result[0].reverseTimeMs).toBe(6000);
  });

  it("uses now for last entry when it is a backward move", () => {
    const now = 15000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        makeCard("c1", "Still reversed", [
          { columnId: "colB", enteredAt: 1000 },
          { columnId: "colA", enteredAt: 5000 }, // backward, last entry
        ]),
      ],
      "colB",
    );

    const result = getCardReverseTimes([colA, colB], now);
    // Backward: colB(1) → colA(0), time = now - 5000 = 10000
    expect(result).toHaveLength(1);
    expect(result[0].reverseTimeMs).toBe(10000);
  });

  it("skips transitions referencing deleted columns", () => {
    const now = 10000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        makeCard("c1", "Deleted col ref", [
          { columnId: "colA", enteredAt: 1000 },
          { columnId: "deleted", enteredAt: 2000 },
          { columnId: "colA", enteredAt: 3000 },
          { columnId: "colB", enteredAt: 4000 },
        ]),
      ],
      "colB",
    );

    const result = getCardReverseTimes([colA, colB], now);
    expect(result).toEqual([]);
  });

  it("sorts results descending by reverse time", () => {
    const now = 20000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        makeCard("c1", "Short reverse", [
          { columnId: "colB", enteredAt: 1000 },
          { columnId: "colA", enteredAt: 2000 }, // backward
          { columnId: "colB", enteredAt: 3000 },
        ]),
        makeCard("c2", "Long reverse", [
          { columnId: "colB", enteredAt: 1000 },
          { columnId: "colA", enteredAt: 2000 }, // backward
          { columnId: "colB", enteredAt: 8000 },
        ]),
      ],
      "colB",
    );

    const result = getCardReverseTimes([colA, colB], now);
    expect(result).toHaveLength(2);
    expect(result[0].reverseTimeMs).toBe(6000);
    expect(result[1].reverseTimeMs).toBe(1000);
  });
});

describe("computeAverageReverseTime", () => {
  it("returns null when no cards have reverse time", () => {
    expect(computeAverageReverseTime([])).toBeNull();
    expect(
      computeAverageReverseTime([makeColumn([makeCard("c1", "A")])]),
    ).toBeNull();
  });

  it("averages reverse times correctly", () => {
    const now = 20000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        makeCard("c1", "Card 1", [
          { columnId: "colB", enteredAt: 1000 },
          { columnId: "colA", enteredAt: 2000 },
          { columnId: "colB", enteredAt: 4000 }, // 2000ms reverse
        ]),
        makeCard("c2", "Card 2", [
          { columnId: "colB", enteredAt: 1000 },
          { columnId: "colA", enteredAt: 2000 },
          { columnId: "colB", enteredAt: 8000 }, // 6000ms reverse
        ]),
      ],
      "colB",
    );

    // Average: (2000 + 6000) / 2 = 4000
    expect(computeAverageReverseTime([colA, colB], now)).toBe(4000);
  });
});

describe("additionalCards", () => {
  it("getThroughput includes additional cards referencing the final column", () => {
    const now = 100_000_000;
    const ms1Day = 24 * 60 * 60 * 1000;
    const doneId = "done";

    const col = makeColumn(
      [
        makeCard("c1", "Board card", [
          { columnId: doneId, enteredAt: now - ms1Day * 3 },
        ]),
      ],
      doneId,
    );

    const archivedCard = makeCard("c2", "Archived card", [
      { columnId: doneId, enteredAt: now - ms1Day * 5 },
    ]);

    expect(getThroughput([col], now, [archivedCard])).toEqual({
      last7Days: 2,
      last30Days: 2,
    });
  });

  it("getThroughput ignores additional cards not referencing the final column", () => {
    const now = 100_000_000;
    const doneId = "done";

    const col = makeColumn([], doneId);
    const archivedCard = makeCard("c1", "Wrong col ref", [
      { columnId: "other", enteredAt: now - 1000 },
    ]);

    expect(getThroughput([col], now, [archivedCard])).toEqual({
      last7Days: 0,
      last30Days: 0,
    });
  });

  it("getCardReverseTimes marks additional cards as isArchived", () => {
    const now = 10000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        makeCard("c1", "Board card", [
          { columnId: "colB", enteredAt: 1000 },
          { columnId: "colA", enteredAt: 2000 },
          { columnId: "colB", enteredAt: 4000 },
        ]),
      ],
      "colB",
    );

    const archivedCard = makeCard("c2", "Archived card", [
      { columnId: "colB", enteredAt: 1000 },
      { columnId: "colA", enteredAt: 2000 },
      { columnId: "colB", enteredAt: 5000 },
    ]);

    const result = getCardReverseTimes([colA, colB], now, [archivedCard]);
    const archived = result.find((r) => r.cardTitle.includes("Archived card"));
    const board = result.find((r) => r.cardTitle.includes("Board card"));
    expect(archived?.isArchived).toBe(true);
    expect(board?.isArchived).toBeUndefined();
  });

  it("getThroughput excludes archived card outside 30-day window", () => {
    const now = 100_000_000;
    const ms1Day = 24 * 60 * 60 * 1000;
    const doneId = "done";

    const col = makeColumn([], doneId);
    const archivedCard = makeCard("c1", "Old archived", [
      { columnId: doneId, enteredAt: now - ms1Day * 60 },
    ]);

    expect(getThroughput([col], now, [archivedCard])).toEqual({
      last7Days: 0,
      last30Days: 0,
    });
  });

  it("getThroughput includes archived card at exactly 30-day boundary", () => {
    const now = 100_000_000;
    const ms30Days = 30 * 24 * 60 * 60 * 1000;
    const doneId = "done";

    const col = makeColumn([], doneId);
    const archivedCard = makeCard("c1", "Boundary archived", [
      { columnId: doneId, enteredAt: now - ms30Days },
    ]);

    expect(getThroughput([col], now, [archivedCard])).toEqual({
      last7Days: 0,
      last30Days: 1,
    });
  });

  it("getCardReverseTimes gracefully skips archived card referencing nonexistent columns", () => {
    const now = 10000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn([], "colB");

    const archivedCard = makeCard("c1", "Orphan refs", [
      { columnId: "deleted1", enteredAt: 1000 },
      { columnId: "deleted2", enteredAt: 2000 },
      { columnId: "deleted1", enteredAt: 3000 },
    ]);

    const result = getCardReverseTimes([colA, colB], now, [archivedCard]);
    expect(result).toEqual([]);
  });

  it("getCardReverseTimes excludes archived card with only forward moves", () => {
    const now = 10000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn([], "colB");
    const colC = makeColumn([], "colC");

    const archivedCard = makeCard("c1", "Forward only", [
      { columnId: "colA", enteredAt: 1000 },
      { columnId: "colB", enteredAt: 2000 },
      { columnId: "colC", enteredAt: 3000 },
    ]);

    const result = getCardReverseTimes([colA, colB, colC], now, [archivedCard]);
    expect(result).toEqual([]);
  });

  it("empty additionalCards array produces same results as omitting parameter", () => {
    const now = 100_000_000;
    const ms1Day = 24 * 60 * 60 * 1000;
    const doneId = "done";

    const col = makeColumn(
      [
        makeCard("c1", "Board card", [
          { columnId: doneId, enteredAt: now - ms1Day * 3 },
        ]),
      ],
      doneId,
    );

    const withEmpty = getThroughput([col], now, []);
    const withoutParam = getThroughput([col], now);
    expect(withEmpty).toEqual(withoutParam);

    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        makeCard("c2", "Board bounced", [
          { columnId: "colB", enteredAt: 1000 },
          { columnId: "colA", enteredAt: 2000 },
          { columnId: "colB", enteredAt: 4000 },
        ]),
      ],
      "colB",
    );

    const reverseWithEmpty = getCardReverseTimes([colA, colB], now, []);
    const reverseWithout = getCardReverseTimes([colA, colB], now);
    expect(reverseWithEmpty).toEqual(reverseWithout);
  });

  it("getCardReverseTimes includes additional cards with backward moves", () => {
    const now = 10000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn([], "colB");

    const archivedCard = makeCard("c1", "Archived bounced", [
      { columnId: "colA", enteredAt: 1000 },
      { columnId: "colB", enteredAt: 2000 },
      { columnId: "colA", enteredAt: 3000 }, // backward
      { columnId: "colB", enteredAt: 5000 },
    ]);

    const result = getCardReverseTimes([colA, colB], now, [archivedCard]);
    expect(result).toHaveLength(1);
    expect(result[0].reverseTimeMs).toBe(2000);
    expect(result[0].cardTitle).toContain("Archived bounced");
  });

  it("computeAverageReverseTime includes additional cards", () => {
    const now = 20000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        makeCard("c1", "Board card", [
          { columnId: "colB", enteredAt: 1000 },
          { columnId: "colA", enteredAt: 2000 },
          { columnId: "colB", enteredAt: 4000 }, // 2000ms reverse
        ]),
      ],
      "colB",
    );

    const archivedCard = makeCard("c2", "Archived card", [
      { columnId: "colB", enteredAt: 1000 },
      { columnId: "colA", enteredAt: 2000 },
      { columnId: "colB", enteredAt: 8000 }, // 6000ms reverse
    ]);

    // Average: (2000 + 6000) / 2 = 4000
    expect(computeAverageReverseTime([colA, colB], now, [archivedCard])).toBe(
      4000,
    );
  });

  it("getTotalCards does not include additional cards", () => {
    const col = makeColumn([makeCard("c1", "A")]);
    // getTotalCards has no additionalCards parameter — snapshot metric only
    expect(getTotalCards([col])).toBe(1);
  });

  it("getCardsInFlight does not include additional cards", () => {
    const first = makeColumn([makeCard("c1", "A")]);
    const middle = makeColumn([makeCard("c2", "B")]);
    const last = makeColumn([]);
    // getCardsInFlight has no additionalCards parameter — snapshot metric only
    expect(getCardsInFlight([first, middle, last])).toBe(1);
  });
});
