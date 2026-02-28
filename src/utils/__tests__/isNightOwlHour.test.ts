import { describe, it, expect } from "vitest";
import { isNightOwlHour } from "../isNightOwlHour";

function dateAtHour(hour: number, minute = 0): Date {
  const d = new Date(2026, 0, 15, hour, minute);
  return d;
}

describe("isNightOwlHour", () => {
  it("returns false at 21:59 (just before night)", () => {
    expect(isNightOwlHour(dateAtHour(21, 59))).toBe(false);
  });

  it("returns true at 22:00 (start of night)", () => {
    expect(isNightOwlHour(dateAtHour(22, 0))).toBe(true);
  });

  it("returns true at 23:00", () => {
    expect(isNightOwlHour(dateAtHour(23, 0))).toBe(true);
  });

  it("returns true at midnight (0:00)", () => {
    expect(isNightOwlHour(dateAtHour(0, 0))).toBe(true);
  });

  it("returns true at 3:59 (end of night)", () => {
    expect(isNightOwlHour(dateAtHour(3, 59))).toBe(true);
  });

  it("returns false at 4:00 (morning starts)", () => {
    expect(isNightOwlHour(dateAtHour(4, 0))).toBe(false);
  });

  it("returns false at noon", () => {
    expect(isNightOwlHour(dateAtHour(12, 0))).toBe(false);
  });

  it("returns false at 15:00", () => {
    expect(isNightOwlHour(dateAtHour(15, 0))).toBe(false);
  });

  it("defaults to current time when no argument is provided", () => {
    // Just verify it returns a boolean without throwing
    expect(typeof isNightOwlHour()).toBe("boolean");
  });
});
