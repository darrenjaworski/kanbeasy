import { describe, it, expect } from "vitest";
import { formatCardId, findCardType } from "../formatCardId";
import type { CardType } from "../../constants/cardTypes";

const types: CardType[] = [
  { id: "feat", label: "Feature", color: "#22c55e" },
  { id: "fix", label: "Fix", color: "#ef4444" },
];

describe("findCardType", () => {
  it("returns the matching type by id", () => {
    expect(findCardType(types, "feat")).toEqual(types[0]);
    expect(findCardType(types, "fix")).toEqual(types[1]);
  });

  it("returns undefined for null id", () => {
    expect(findCardType(types, null)).toBeUndefined();
  });

  it("returns undefined for non-existent id", () => {
    expect(findCardType(types, "chore")).toBeUndefined();
  });

  it("returns undefined for empty types array", () => {
    expect(findCardType([], "feat")).toBeUndefined();
  });
});

describe("formatCardId", () => {
  it("formats typed card as type-number", () => {
    expect(formatCardId(42, "feat", types)).toBe("feat-42");
    expect(formatCardId(1, "fix", types)).toBe("fix-1");
  });

  it("formats untyped card as #number", () => {
    expect(formatCardId(42, null, types)).toBe("#42");
  });

  it("formats orphaned type as #number", () => {
    expect(formatCardId(42, "deleted-type", types)).toBe("#42");
  });

  it("formats with empty types array as #number", () => {
    expect(formatCardId(42, "feat", [])).toBe("#42");
  });
});
