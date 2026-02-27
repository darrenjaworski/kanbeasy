import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "../formatDate";

describe("formatDate", () => {
  it("returns a date string without time", () => {
    // 2024-06-15T12:30:00Z
    const ts = Date.UTC(2024, 5, 15, 12, 30, 0);
    const result = formatDate(ts);
    expect(result).toContain("2024");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
    // Should NOT contain a colon (time separator)
    expect(result).not.toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("formatDateTime", () => {
  it("returns a date string with time", () => {
    // 2024-06-15T12:30:00Z
    const ts = Date.UTC(2024, 5, 15, 12, 30, 0);
    const result = formatDateTime(ts);
    expect(result).toContain("2024");
    expect(result).toContain("Jun");
    expect(result).toContain("15");
    // Should contain a colon (time separator)
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});
