import { describe, it, expect } from "vitest";
import { formatCardId, findTicketType } from "../formatCardId";
import type { TicketType } from "../../constants/ticketTypes";

const types: TicketType[] = [
  { id: "feat", label: "Feature", color: "#22c55e" },
  { id: "fix", label: "Fix", color: "#ef4444" },
];

describe("findTicketType", () => {
  it("returns the matching type by id", () => {
    expect(findTicketType(types, "feat")).toEqual(types[0]);
    expect(findTicketType(types, "fix")).toEqual(types[1]);
  });

  it("returns undefined for null id", () => {
    expect(findTicketType(types, null)).toBeUndefined();
  });

  it("returns undefined for non-existent id", () => {
    expect(findTicketType(types, "chore")).toBeUndefined();
  });

  it("returns undefined for empty types array", () => {
    expect(findTicketType([], "feat")).toBeUndefined();
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
