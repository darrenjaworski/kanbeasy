// Basic trivial test to ensure Vitest runs
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("adds numbers", () => {
    expect(1 + 1).toBe(2);
  });
});
