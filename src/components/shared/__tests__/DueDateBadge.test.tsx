import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { DueDateBadge } from "../DueDateBadge";

describe("DueDateBadge", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Null / empty ---

  it("renders nothing when dueDate is null", () => {
    const { container } = render(<DueDateBadge dueDate={null} />);
    expect(container.firstChild).toBeNull();
  });

  // --- Date formatting ---

  it("renders the formatted date", () => {
    vi.useFakeTimers({ now: new Date("2025-06-01T12:00:00") });
    render(<DueDateBadge dueDate="2025-06-15" />);
    expect(screen.getByTestId("due-date-badge")).toHaveTextContent("Jun 15");
  });

  // --- Urgency: overdue ---

  it("applies overdue styling for past dates", () => {
    vi.useFakeTimers({ now: new Date("2025-06-20T12:00:00") });
    render(<DueDateBadge dueDate="2025-06-15" />);
    const badge = screen.getByTestId("due-date-badge");
    expect(badge.className).toContain("text-red");
    expect(badge).toHaveAttribute("title", "Overdue");
  });

  it("applies overdue styling when due yesterday", () => {
    vi.useFakeTimers({ now: new Date("2025-06-16T12:00:00") });
    render(<DueDateBadge dueDate="2025-06-15" />);
    const badge = screen.getByTestId("due-date-badge");
    expect(badge.className).toContain("text-red");
  });

  // --- Urgency: soon ---

  it("applies soon styling for dates within 2 days", () => {
    vi.useFakeTimers({ now: new Date("2025-06-14T12:00:00") });
    render(<DueDateBadge dueDate="2025-06-15" />);
    const badge = screen.getByTestId("due-date-badge");
    expect(badge.className).toContain("text-amber");
  });

  it("treats today as soon", () => {
    vi.useFakeTimers({ now: new Date("2025-06-15T12:00:00") });
    render(<DueDateBadge dueDate="2025-06-15" />);
    const badge = screen.getByTestId("due-date-badge");
    expect(badge.className).toContain("text-amber");
  });

  it("treats exactly 2 days away as soon", () => {
    vi.useFakeTimers({ now: new Date("2025-06-13T12:00:00") });
    render(<DueDateBadge dueDate="2025-06-15" />);
    const badge = screen.getByTestId("due-date-badge");
    expect(badge.className).toContain("text-amber");
  });

  // --- Urgency: normal ---

  it("applies normal styling for dates further out", () => {
    vi.useFakeTimers({ now: new Date("2025-06-01T12:00:00") });
    render(<DueDateBadge dueDate="2025-06-15" />);
    const badge = screen.getByTestId("due-date-badge");
    expect(badge.className).not.toContain("text-red");
    expect(badge.className).not.toContain("text-amber");
  });

  it("treats exactly 3 days away as normal", () => {
    vi.useFakeTimers({ now: new Date("2025-06-12T12:00:00") });
    render(<DueDateBadge dueDate="2025-06-15" />);
    const badge = screen.getByTestId("due-date-badge");
    expect(badge.className).not.toContain("text-red");
    expect(badge.className).not.toContain("text-amber");
  });

  // --- Title attribute ---

  it("shows the raw date string as title when not overdue", () => {
    vi.useFakeTimers({ now: new Date("2025-06-01T12:00:00") });
    render(<DueDateBadge dueDate="2025-06-15" />);
    expect(screen.getByTestId("due-date-badge")).toHaveAttribute(
      "title",
      "2025-06-15",
    );
  });

  // --- className forwarding ---

  it("appends custom className", () => {
    vi.useFakeTimers({ now: new Date("2025-06-01T12:00:00") });
    render(<DueDateBadge dueDate="2025-06-15" className="mt-2" />);
    expect(screen.getByTestId("due-date-badge").className).toContain("mt-2");
  });

  // --- SVG icon ---

  it("renders a calendar icon", () => {
    vi.useFakeTimers({ now: new Date("2025-06-01T12:00:00") });
    render(<DueDateBadge dueDate="2025-06-15" />);
    const svg = screen.getByTestId("due-date-badge").querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
