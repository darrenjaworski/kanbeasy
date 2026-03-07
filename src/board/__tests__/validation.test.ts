import { describe, it, expect } from "vitest";
import { isArchivedCard, isCard, isColumn } from "../validation";

describe("isCard", () => {
  it("returns true for a valid card", () => {
    expect(
      isCard({
        id: "c1",
        title: "Task",
        createdAt: 1,
        updatedAt: 1,
        columnHistory: [],
      }),
    ).toBe(true);
  });

  it("returns true for minimal card (only id and title required by guard)", () => {
    expect(isCard({ id: "c1", title: "Task" })).toBe(true);
  });

  it.each<[unknown, string]>([
    [null, "null"],
    [undefined, "undefined"],
    ["card", "a string"],
    [{ title: "Task" }, "missing id"],
    [{ id: "c1" }, "missing title"],
    [{ id: 123, title: "Task" }, "id is not a string"],
    [{ id: "c1", title: 42 }, "title is not a string"],
  ])("returns false for %s (%s)", (input) => {
    expect(isCard(input)).toBe(false);
  });
});

describe("isColumn", () => {
  const validCard = { id: "c1", title: "Task" };

  it("returns true for a valid column", () => {
    expect(
      isColumn({
        id: "col1",
        title: "To Do",
        cards: [validCard],
        createdAt: 1,
        updatedAt: 1,
      }),
    ).toBe(true);
  });

  it("returns true for a column with empty cards array", () => {
    expect(isColumn({ id: "col1", title: "To Do", cards: [] })).toBe(true);
  });

  it.each<[unknown, string]>([
    [null, "null"],
    [{ title: "To Do", cards: [] }, "missing id"],
    [{ id: "col1", cards: [] }, "missing title"],
    [{ id: "col1", title: "To Do" }, "missing cards"],
    [
      { id: "col1", title: "To Do", cards: "not-array" },
      "cards is not an array",
    ],
    [
      { id: "col1", title: "To Do", cards: [{ id: 123 }] },
      "cards contains invalid card",
    ],
  ])("returns false for %s (%s)", (input) => {
    expect(isColumn(input)).toBe(false);
  });
});

describe("isArchivedCard", () => {
  const validArchivedCard = {
    id: "c1",
    title: "Task",
    archivedAt: 1000,
    archivedFromColumnId: "col-1",
  };

  it("returns true for a valid archived card", () => {
    expect(isArchivedCard(validArchivedCard)).toBe(true);
  });

  it("returns false when archivedAt is missing", () => {
    const { archivedAt: _, ...rest } = validArchivedCard;
    expect(isArchivedCard(rest)).toBe(false);
  });

  it("returns false when archivedFromColumnId is missing", () => {
    const { archivedFromColumnId: _, ...rest } = validArchivedCard;
    expect(isArchivedCard(rest)).toBe(false);
  });

  it("returns false when archivedAt is not a number", () => {
    expect(
      isArchivedCard({ ...validArchivedCard, archivedAt: "not-a-number" }),
    ).toBe(false);
  });

  it("returns false when archivedFromColumnId is not a string", () => {
    expect(
      isArchivedCard({ ...validArchivedCard, archivedFromColumnId: 123 }),
    ).toBe(false);
  });

  it("returns false for a non-card object", () => {
    expect(
      isArchivedCard({ archivedAt: 1000, archivedFromColumnId: "col-1" }),
    ).toBe(false);
  });

  it("returns false for null", () => {
    expect(isArchivedCard(null)).toBe(false);
  });
});
