import "@testing-library/jest-dom";
import { screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { STORAGE_KEYS } from "../../../constants/storage";
import { renderApp } from "../../../test/renderApp";

function seedBoard(
  cards: { id: string; title: string; dueDate: string | null }[],
) {
  const now = Date.now();
  localStorage.setItem(
    STORAGE_KEYS.BOARD,
    JSON.stringify({
      columns: [
        {
          id: "col-1",
          title: "Todo",
          createdAt: now,
          updatedAt: now,
          cards: cards.map((c, i) => ({
            id: c.id,
            number: i + 1,
            title: c.title,
            description: "",
            ticketTypeId: null,
            dueDate: c.dueDate,
            createdAt: now,
            updatedAt: now,
            columnHistory: [{ columnId: "col-1", enteredAt: now }],
          })),
        },
      ],
    }),
  );
}

describe("Due date badge on column-view cards", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows due date badge on a card with a due date", () => {
    vi.useFakeTimers({ now: new Date("2025-06-01T12:00:00") });
    seedBoard([{ id: "c1", title: "Task A", dueDate: "2025-06-15" }]);
    renderApp();

    const card = screen.getByTestId("card-0");
    const badge = within(card).getByTestId("due-date-badge");
    expect(badge).toHaveTextContent("Jun 15");
  });

  it("does not show due date badge on a card without a due date", () => {
    seedBoard([{ id: "c1", title: "Task B", dueDate: null }]);
    renderApp();

    const card = screen.getByTestId("card-0");
    expect(within(card).queryByTestId("due-date-badge")).not.toBeInTheDocument();
  });

  it("shows overdue styling for past-due cards", () => {
    vi.useFakeTimers({ now: new Date("2025-06-20T12:00:00") });
    seedBoard([{ id: "c1", title: "Late", dueDate: "2025-06-15" }]);
    renderApp();

    const badge = within(screen.getByTestId("card-0")).getByTestId(
      "due-date-badge",
    );
    expect(badge.className).toContain("text-red");
  });

  it("shows soon styling for cards due today", () => {
    vi.useFakeTimers({ now: new Date("2025-06-15T12:00:00") });
    seedBoard([{ id: "c1", title: "Today", dueDate: "2025-06-15" }]);
    renderApp();

    const badge = within(screen.getByTestId("card-0")).getByTestId(
      "due-date-badge",
    );
    expect(badge.className).toContain("text-amber");
  });

  it("renders badges independently per card", () => {
    vi.useFakeTimers({ now: new Date("2025-06-01T12:00:00") });
    seedBoard([
      { id: "c1", title: "Has date", dueDate: "2025-06-15" },
      { id: "c2", title: "No date", dueDate: null },
      { id: "c3", title: "Also has date", dueDate: "2025-07-01" },
    ]);
    renderApp();

    expect(
      within(screen.getByTestId("card-0")).getByTestId("due-date-badge"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("card-1")).queryByTestId("due-date-badge"),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId("card-2")).getByTestId("due-date-badge"),
    ).toBeInTheDocument();
  });
});
