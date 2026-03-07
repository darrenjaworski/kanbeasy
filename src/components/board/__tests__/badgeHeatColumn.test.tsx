import { describe, it, expect } from "vitest";
import { Column } from "../Column";
import type { Card } from "../../../board/types";
import { makeCard } from "../../../test/builders";
import { renderWithProviders } from "../../../test/renderWithProviders";

function makeCards(count: number): Card[] {
  return Array.from({ length: count }, (_, i) =>
    makeCard({ id: `card-${i}`, title: `Card ${i}` }),
  );
}

function renderColumn(props: {
  id: string;
  title: string;
  cards: Card[];
  index: number;
  columnCount: number;
}) {
  return renderWithProviders(<Column {...props} />);
}

describe("Badge heat rendering in Column", () => {
  it("has no heat on first column regardless of card count", () => {
    const { getByLabelText } = renderColumn({
      id: "col-0",
      title: "First",
      cards: makeCards(8),
      index: 0,
      columnCount: 3,
    });

    const badge = getByLabelText("8 cards");
    expect(badge.style.backgroundColor).toBe("");
    expect(badge).not.toHaveAttribute("data-heat-level");
  });

  it("has no heat on last column regardless of card count", () => {
    const { getByLabelText } = renderColumn({
      id: "col-2",
      title: "Last",
      cards: makeCards(8),
      index: 2,
      columnCount: 3,
    });

    const badge = getByLabelText("8 cards");
    expect(badge.style.backgroundColor).toBe("");
    expect(badge).not.toHaveAttribute("data-heat-level");
  });

  it("has inline background-color with color-mix for middle column with 5 cards", () => {
    const { getByLabelText } = renderColumn({
      id: "col-1",
      title: "Middle",
      cards: makeCards(5),
      index: 1,
      columnCount: 3,
    });

    const badge = getByLabelText("5 cards");
    expect(badge.style.backgroundColor).toContain("color-mix");
  });

  it("has no heat for middle column with 2 cards", () => {
    const { getByLabelText } = renderColumn({
      id: "col-1",
      title: "Middle",
      cards: makeCards(2),
      index: 1,
      columnCount: 3,
    });

    const badge = getByLabelText("2 cards");
    expect(badge.style.backgroundColor).toBe("");
    expect(badge).not.toHaveAttribute("data-heat-level");
  });

  it("marks high heat level for middle column with 10+ cards", () => {
    const { getByLabelText } = renderColumn({
      id: "col-1",
      title: "Middle",
      cards: makeCards(10),
      index: 1,
      columnCount: 3,
    });

    const badge = getByLabelText("10 cards");
    expect(badge).toHaveAttribute("data-heat-level", "high");
  });

  it("marks medium heat level for middle column with 5 cards", () => {
    const { getByLabelText } = renderColumn({
      id: "col-1",
      title: "Middle",
      cards: makeCards(5),
      index: 1,
      columnCount: 3,
    });

    const badge = getByLabelText("5 cards");
    expect(badge).toHaveAttribute("data-heat-level", "medium");
  });
});
