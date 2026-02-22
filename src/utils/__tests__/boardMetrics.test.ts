import { describe, expect, it } from "vitest";
import {
  computeAverageReverseTime,
  getCardReverseTimes,
  getCardsInFlight,
  getThroughput,
  getTotalCards,
} from "../boardMetrics";
import type { Column } from "../../board/types";

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
    const col1 = makeColumn([
      { id: "c1", title: "A", createdAt: 0, updatedAt: 0, columnHistory: [] },
      { id: "c2", title: "B", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
    const col2 = makeColumn([
      { id: "c3", title: "C", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
    expect(getTotalCards([col1, col2])).toBe(3);
  });
});

describe("getCardsInFlight", () => {
  it("returns 0 for 0 columns", () => {
    expect(getCardsInFlight([])).toBe(0);
  });

  it("returns 0 for 1 column", () => {
    const col = makeColumn([
      { id: "c1", title: "A", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
    expect(getCardsInFlight([col])).toBe(0);
  });

  it("returns 0 for 2 columns", () => {
    const col1 = makeColumn([
      { id: "c1", title: "A", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
    const col2 = makeColumn([
      { id: "c2", title: "B", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
    expect(getCardsInFlight([col1, col2])).toBe(0);
  });

  it("returns 0 for 3 columns with empty middle", () => {
    const first = makeColumn([
      { id: "c1", title: "A", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
    const middle = makeColumn([]);
    const last = makeColumn([
      { id: "c2", title: "B", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
    expect(getCardsInFlight([first, middle, last])).toBe(0);
  });

  it("counts cards in middle columns for 3+ columns", () => {
    const first = makeColumn([
      { id: "c1", title: "A", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
    const middle1 = makeColumn([
      { id: "c2", title: "B", createdAt: 0, updatedAt: 0, columnHistory: [] },
      { id: "c3", title: "C", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
    const middle2 = makeColumn([
      { id: "c4", title: "D", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
    const last = makeColumn([
      { id: "c5", title: "E", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
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
        {
          id: "c1",
          title: "Recent",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [{ columnId: doneId, enteredAt: now - ms1Day * 3 }],
        },
        {
          id: "c2",
          title: "This month",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [{ columnId: doneId, enteredAt: now - ms1Day * 20 }],
        },
        {
          id: "c3",
          title: "Old",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [{ columnId: doneId, enteredAt: now - ms1Day * 60 }],
        },
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
        {
          id: "c1",
          title: "Wrong column ref",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [{ columnId: "other", enteredAt: now - 1000 }],
        },
      ],
      doneId,
    );

    expect(getThroughput([col], now)).toEqual({ last7Days: 0, last30Days: 0 });
  });

  it("ignores cards with empty history", () => {
    const doneId = "done";
    const col = makeColumn(
      [
        {
          id: "c1",
          title: "No history",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [],
        },
      ],
      doneId,
    );

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
        {
          id: "c1",
          title: "In todo",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [{ columnId: doneId, enteredAt: now - ms1Day }],
        },
      ],
      "todo",
    );
    const done = makeColumn(
      [
        {
          id: "c2",
          title: "Done",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [{ columnId: doneId, enteredAt: now - ms1Day }],
        },
      ],
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
        {
          id: "c1",
          title: "Exact boundary",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [{ columnId: doneId, enteredAt: now - ms7Days }],
        },
      ],
      doneId,
    );

    expect(getThroughput([col], now)).toEqual({ last7Days: 1, last30Days: 1 });
  });
});

describe("getCardReverseTimes", () => {
  it("returns empty array when no cards have history", () => {
    const col = makeColumn([
      { id: "c1", title: "A", createdAt: 0, updatedAt: 0, columnHistory: [] },
    ]);
    expect(getCardReverseTimes([col])).toEqual([]);
  });

  it("returns empty array when all moves are forward", () => {
    const colA = makeColumn([], "colA");
    const colB = makeColumn([], "colB");
    const colC = makeColumn(
      [
        {
          id: "c1",
          title: "Forward",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [
            { columnId: "colA", enteredAt: 1000 },
            { columnId: "colB", enteredAt: 2000 },
            { columnId: "colC", enteredAt: 3000 },
          ],
        },
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
        {
          id: "c1",
          title: "Bounced",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [
            { columnId: "colA", enteredAt: 1000 },
            { columnId: "colB", enteredAt: 2000 },
            { columnId: "colA", enteredAt: 3000 }, // backward
            { columnId: "colB", enteredAt: 5000 },
          ],
        },
      ],
      "colB",
    );

    const result = getCardReverseTimes([colA, colB], now);
    // Backward at index 1→2: colB(1) → colA(0). Time in colA = 5000 - 3000 = 2000
    expect(result).toEqual([{ cardTitle: "Bounced", reverseTimeMs: 2000 }]);
  });

  it("accumulates multiple backward moves in one card", () => {
    const now = 20000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn([], "colB");
    const colC = makeColumn(
      [
        {
          id: "c1",
          title: "Multi-bounce",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [
            { columnId: "colA", enteredAt: 1000 },
            { columnId: "colC", enteredAt: 2000 },
            { columnId: "colB", enteredAt: 3000 }, // backward C→B
            { columnId: "colC", enteredAt: 6000 },
            { columnId: "colA", enteredAt: 7000 }, // backward C→A
            { columnId: "colC", enteredAt: 10000 },
          ],
        },
      ],
      "colC",
    );

    const result = getCardReverseTimes([colA, colB, colC], now);
    // Backward at 1→2: colC(2) → colB(1), time = 6000 - 3000 = 3000
    // Backward at 3→4: colC(2) → colA(0), time = 10000 - 7000 = 3000
    expect(result).toEqual([
      { cardTitle: "Multi-bounce", reverseTimeMs: 6000 },
    ]);
  });

  it("uses now for last entry when it is a backward move", () => {
    const now = 15000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        {
          id: "c1",
          title: "Still reversed",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [
            { columnId: "colB", enteredAt: 1000 },
            { columnId: "colA", enteredAt: 5000 }, // backward, last entry
          ],
        },
      ],
      "colB",
    );

    const result = getCardReverseTimes([colA, colB], now);
    // Backward: colB(1) → colA(0), time = now - 5000 = 10000
    expect(result).toEqual([
      { cardTitle: "Still reversed", reverseTimeMs: 10000 },
    ]);
  });

  it("skips transitions referencing deleted columns", () => {
    const now = 10000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        {
          id: "c1",
          title: "Deleted col ref",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [
            { columnId: "colA", enteredAt: 1000 },
            { columnId: "deleted", enteredAt: 2000 },
            { columnId: "colA", enteredAt: 3000 },
            { columnId: "colB", enteredAt: 4000 },
          ],
        },
      ],
      "colB",
    );

    const result = getCardReverseTimes([colA, colB], now);
    // Transition 0→1: colA → deleted — skip (deleted undefined)
    // Transition 1→2: deleted → colA — skip (deleted undefined)
    // Transition 2→3: colA(0) → colB(1) — forward
    expect(result).toEqual([]);
  });

  it("sorts results descending by reverse time", () => {
    const now = 20000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        {
          id: "c1",
          title: "Short reverse",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [
            { columnId: "colB", enteredAt: 1000 },
            { columnId: "colA", enteredAt: 2000 }, // backward
            { columnId: "colB", enteredAt: 3000 },
          ],
        },
        {
          id: "c2",
          title: "Long reverse",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [
            { columnId: "colB", enteredAt: 1000 },
            { columnId: "colA", enteredAt: 2000 }, // backward
            { columnId: "colB", enteredAt: 8000 },
          ],
        },
      ],
      "colB",
    );

    const result = getCardReverseTimes([colA, colB], now);
    expect(result).toEqual([
      { cardTitle: "Long reverse", reverseTimeMs: 6000 },
      { cardTitle: "Short reverse", reverseTimeMs: 1000 },
    ]);
  });
});

describe("computeAverageReverseTime", () => {
  it("returns null when no cards have reverse time", () => {
    expect(computeAverageReverseTime([])).toBeNull();
    expect(
      computeAverageReverseTime([
        makeColumn([
          {
            id: "c1",
            title: "A",
            createdAt: 0,
            updatedAt: 0,
            columnHistory: [],
          },
        ]),
      ]),
    ).toBeNull();
  });

  it("averages reverse times correctly", () => {
    const now = 20000;
    const colA = makeColumn([], "colA");
    const colB = makeColumn(
      [
        {
          id: "c1",
          title: "Card 1",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [
            { columnId: "colB", enteredAt: 1000 },
            { columnId: "colA", enteredAt: 2000 },
            { columnId: "colB", enteredAt: 4000 }, // 2000ms reverse
          ],
        },
        {
          id: "c2",
          title: "Card 2",
          createdAt: 0,
          updatedAt: 0,
          columnHistory: [
            { columnId: "colB", enteredAt: 1000 },
            { columnId: "colA", enteredAt: 2000 },
            { columnId: "colB", enteredAt: 8000 }, // 6000ms reverse
          ],
        },
      ],
      "colB",
    );

    // Average: (2000 + 6000) / 2 = 4000
    expect(computeAverageReverseTime([colA, colB], now)).toBe(4000);
  });
});
