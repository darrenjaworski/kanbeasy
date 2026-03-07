import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "../formatDate";

describe("formatDate", () => {
  it("returns a date string without time", () => {
    // 2024-06-15T12:30:00Z
    const ts = Date.UTC(2024, 5, 15, 12, 30, 0);
    const result = formatDate(ts);
    // Matches locale-independent pattern: "Jun 15, 2024" or "15 Jun 2024" etc.
    expect(result).toMatch(/Jun.*15.*2024|15.*Jun.*2024/);
    // Should NOT contain a colon (time separator)
    expect(result).not.toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("formatDateTime", () => {
  it("returns a date string with time", () => {
    // 2024-06-15T12:30:00Z
    const ts = Date.UTC(2024, 5, 15, 12, 30, 0);
    const result = formatDateTime(ts);
    // Matches locale-independent pattern with date components
    expect(result).toMatch(/Jun.*15.*2024|15.*Jun.*2024/);
    // Should contain a colon (time separator)
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});
