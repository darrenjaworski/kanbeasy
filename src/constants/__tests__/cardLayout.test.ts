import { describe, it, expect } from "vitest";
import { DEFAULT_CARD_LAYOUT, isValidCardLayout } from "../cardLayout";

describe("isValidCardLayout", () => {
  it("accepts the default layout", () => {
    expect(isValidCardLayout(DEFAULT_CARD_LAYOUT)).toBe(true);
  });

  it("accepts a valid reordered layout", () => {
    const reordered = [
      { id: "title", visible: true, options: { lines: 2 } },
      { id: "badge", visible: false },
      { id: "description", visible: true, options: { lines: 1 } },
      { id: "checklist", visible: true },
      { id: "dueDate", visible: false },
      { id: "createdAt", visible: true },
      { id: "updatedAt", visible: true },
    ];
    expect(isValidCardLayout(reordered)).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidCardLayout(null)).toBe(false);
  });

  it("rejects an empty array", () => {
    expect(isValidCardLayout([])).toBe(false);
  });

  it("rejects a non-array", () => {
    expect(isValidCardLayout("not an array")).toBe(false);
    expect(isValidCardLayout(42)).toBe(false);
    expect(isValidCardLayout({})).toBe(false);
  });

  it("rejects layout with unknown field id", () => {
    const bad = DEFAULT_CARD_LAYOUT.map((f) =>
      f.id === "badge" ? { ...f, id: "unknown" } : f,
    );
    expect(isValidCardLayout(bad)).toBe(false);
  });

  it("rejects layout with duplicate ids", () => {
    const bad = DEFAULT_CARD_LAYOUT.map((f) =>
      f.id === "title" ? { ...f, id: "badge" } : f,
    );
    expect(isValidCardLayout(bad)).toBe(false);
  });

  it("rejects layout missing a required field", () => {
    const incomplete = DEFAULT_CARD_LAYOUT.filter((f) => f.id !== "dueDate");
    expect(isValidCardLayout(incomplete)).toBe(false);
  });

  it("rejects field with non-boolean visible", () => {
    const bad = DEFAULT_CARD_LAYOUT.map((f) =>
      f.id === "badge" ? { ...f, visible: "yes" } : f,
    );
    expect(isValidCardLayout(bad)).toBe(false);
  });

  it("rejects lines outside 1-3 range", () => {
    const bad = DEFAULT_CARD_LAYOUT.map((f) =>
      f.id === "title" ? { ...f, options: { lines: 0 } } : f,
    );
    expect(isValidCardLayout(bad)).toBe(false);

    const bad2 = DEFAULT_CARD_LAYOUT.map((f) =>
      f.id === "title" ? { ...f, options: { lines: 4 } } : f,
    );
    expect(isValidCardLayout(bad2)).toBe(false);
  });

  it("rejects field with non-object options", () => {
    const bad = DEFAULT_CARD_LAYOUT.map((f) =>
      f.id === "title" ? { ...f, options: "bad" } : f,
    );
    expect(isValidCardLayout(bad)).toBe(false);
  });
});
