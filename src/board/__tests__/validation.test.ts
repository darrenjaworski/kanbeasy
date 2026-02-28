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

  it("returns false for null", () => {
    expect(isCard(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isCard(undefined)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isCard("card")).toBe(false);
  });

  it("returns false when id is missing", () => {
    expect(isCard({ title: "Task" })).toBe(false);
  });

  it("returns false when title is missing", () => {
    expect(isCard({ id: "c1" })).toBe(false);
  });

  it("returns false when id is not a string", () => {
    expect(isCard({ id: 123, title: "Task" })).toBe(false);
  });

  it("returns false when title is not a string", () => {
    expect(isCard({ id: "c1", title: 42 })).toBe(false);
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

  it("returns false for null", () => {
    expect(isColumn(null)).toBe(false);
  });

  it("returns false when id is missing", () => {
    expect(isColumn({ title: "To Do", cards: [] })).toBe(false);
  });

  it("returns false when title is missing", () => {
    expect(isColumn({ id: "col1", cards: [] })).toBe(false);
  });

  it("returns false when cards is missing", () => {
    expect(isColumn({ id: "col1", title: "To Do" })).toBe(false);
  });

  it("returns false when cards is not an array", () => {
    expect(isColumn({ id: "col1", title: "To Do", cards: "not-array" })).toBe(
      false,
    );
  });

  it("returns false when cards contains an invalid card", () => {
    expect(isColumn({ id: "col1", title: "To Do", cards: [{ id: 123 }] })).toBe(
      false,
    );
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
