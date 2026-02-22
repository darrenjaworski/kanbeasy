import { describe, expect, it } from "vitest";
import {
  computeAverageCycleTime,
  formatDuration,
  getCardCycleTimes,
} from "../cycleTime";
import type { Column } from "../../board/types";

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
      {
        id: "c1",
        title: "Card 1",
        createdAt: 1000,
        updatedAt: 1000,
        columnHistory: [{ columnId: "col1", enteredAt: 1000 }],
      },
    ]);
    expect(computeAverageCycleTime([col])).toBeNull();
  });

  it("returns null when cards have empty history (grandfathered)", () => {
    const col = makeColumn([
      {
        id: "c1",
        title: "Card 1",
        createdAt: 1000,
        updatedAt: 1000,
        columnHistory: [],
      },
    ]);
    expect(computeAverageCycleTime([col])).toBeNull();
  });

  it("computes cycle time for a single moved card", () => {
    const col = makeColumn([
      {
        id: "c1",
        title: "Card 1",
        createdAt: 1000,
        updatedAt: 5000,
        columnHistory: [
          { columnId: "col1", enteredAt: 1000 },
          { columnId: "col2", enteredAt: 5000 },
        ],
      },
    ]);
    expect(computeAverageCycleTime([col])).toBe(4000);
  });

  it("averages cycle times across multiple moved cards", () => {
    const col1 = makeColumn([
      {
        id: "c1",
        title: "Card 1",
        createdAt: 0,
        updatedAt: 0,
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 3000 },
        ],
      },
    ]);
    const col2 = makeColumn([
      {
        id: "c2",
        title: "Card 2",
        createdAt: 0,
        updatedAt: 0,
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 5000 },
          { columnId: "c", enteredAt: 9000 },
        ],
      },
    ]);
    // Card 1: 3000 - 1000 = 2000
    // Card 2: 9000 - 1000 = 8000
    // Average: (2000 + 8000) / 2 = 5000
    expect(computeAverageCycleTime([col1, col2])).toBe(5000);
  });

  it("excludes unmoved cards from the average", () => {
    const col = makeColumn([
      {
        id: "c1",
        title: "Moved",
        createdAt: 0,
        updatedAt: 0,
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 7000 },
        ],
      },
      {
        id: "c2",
        title: "Unmoved",
        createdAt: 0,
        updatedAt: 0,
        columnHistory: [{ columnId: "a", enteredAt: 1000 }],
      },
      {
        id: "c3",
        title: "Grandfathered",
        createdAt: 0,
        updatedAt: 0,
        columnHistory: [],
      },
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
          {
            id: "c1",
            title: "Unmoved",
            createdAt: 0,
            updatedAt: 0,
            columnHistory: [{ columnId: "a", enteredAt: 1000 }],
          },
        ]),
      ]),
    ).toEqual([]);
  });

  it("returns cards sorted descending by cycle time", () => {
    const col = makeColumn([
      {
        id: "c1",
        title: "Fast Card",
        createdAt: 0,
        updatedAt: 0,
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 3000 },
        ],
      },
      {
        id: "c2",
        title: "Slow Card",
        createdAt: 0,
        updatedAt: 0,
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 9000 },
        ],
      },
    ]);
    const result = getCardCycleTimes([col]);
    expect(result).toEqual([
      { cardTitle: "Slow Card", cycleTimeMs: 8000 },
      { cardTitle: "Fast Card", cycleTimeMs: 2000 },
    ]);
  });

  it("excludes cards with fewer than 2 history entries", () => {
    const col = makeColumn([
      {
        id: "c1",
        title: "Moved",
        createdAt: 0,
        updatedAt: 0,
        columnHistory: [
          { columnId: "a", enteredAt: 1000 },
          { columnId: "b", enteredAt: 5000 },
        ],
      },
      {
        id: "c2",
        title: "Unmoved",
        createdAt: 0,
        updatedAt: 0,
        columnHistory: [{ columnId: "a", enteredAt: 1000 }],
      },
      {
        id: "c3",
        title: "Grandfathered",
        createdAt: 0,
        updatedAt: 0,
        columnHistory: [],
      },
    ]);
    const result = getCardCycleTimes([col]);
    expect(result).toEqual([{ cardTitle: "Moved", cycleTimeMs: 4000 }]);
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
