import { describe, it, expect } from "vitest";
import { boardStorageKey } from "../../constants/storage";

describe("boardStorageKey", () => {
  it("returns a namespaced key for a given board ID", () => {
    expect(boardStorageKey("default")).toBe("kanbeasy:board:default");
  });

  it("handles UUID board IDs", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(boardStorageKey(uuid)).toBe(`kanbeasy:board:${uuid}`);
  });
});
