import * as React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BoardProvider } from "../../../board/BoardProvider";
import { ClipboardProvider } from "../../../board/ClipboardProvider";
import { Column } from "../Column";
import { ThemeContext } from "../../../theme/ThemeContext";
import type { ThemeContextValue } from "../../../theme/types";
import type { Card } from "../../../board/types";

function makeCards(count: number): Card[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `card-${i}`,
    title: `Card ${i}`,
    description: "",
    createdAt: now,
    updatedAt: now,
    columnHistory: [],
  }));
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const value: ThemeContextValue = React.useMemo(
    () => ({
      themeId: "clean-light" as const,
      setThemeId: () => {},
      isDark: false,
      themeMode: "light" as const,
      themePreference: "light" as const,
      setThemePreference: () => {},
      cardDensity: "medium" as const,
      setCardDensity: () => {},
      columnResizingEnabled: false,
      setColumnResizingEnabled: () => {},
      deleteColumnWarningEnabled: true,
      setDeleteColumnWarningEnabled: () => {},
      owlModeEnabled: false,
      setOwlModeEnabled: () => {},
      viewMode: "board" as const,
      setViewMode: () => {},
    }),
    [],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function renderColumn(props: {
  id: string;
  title: string;
  cards: Card[];
  index: number;
  columnCount: number;
}) {
  return render(
    <ThemeWrapper>
      <BoardProvider>
        <ClipboardProvider>
          <Column {...props} />
        </ClipboardProvider>
      </BoardProvider>
    </ThemeWrapper>,
  );
}

describe("Badge heat rendering in Column", () => {
  it("has no background-color on first column regardless of card count", () => {
    const { getByLabelText } = renderColumn({
      id: "col-0",
      title: "First",
      cards: makeCards(8),
      index: 0,
      columnCount: 3,
    });

    const badge = getByLabelText("8 cards");
    expect(badge.style.backgroundColor).toBe("");
  });

  it("has no background-color on last column regardless of card count", () => {
    const { getByLabelText } = renderColumn({
      id: "col-2",
      title: "Last",
      cards: makeCards(8),
      index: 2,
      columnCount: 3,
    });

    const badge = getByLabelText("8 cards");
    expect(badge.style.backgroundColor).toBe("");
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

  it("does not have background-color for middle column with 2 cards", () => {
    const { getByLabelText } = renderColumn({
      id: "col-1",
      title: "Middle",
      cards: makeCards(2),
      index: 1,
      columnCount: 3,
    });

    const badge = getByLabelText("2 cards");
    expect(badge.style.backgroundColor).toBe("");
  });

  it("applies font-bold class for middle column with 10+ cards", () => {
    const { getByLabelText } = renderColumn({
      id: "col-1",
      title: "Middle",
      cards: makeCards(10),
      index: 1,
      columnCount: 3,
    });

    const badge = getByLabelText("10 cards");
    expect(badge.className).toContain("font-bold");
  });

  it("applies font-medium (not font-bold) for middle column with 5 cards", () => {
    const { getByLabelText } = renderColumn({
      id: "col-1",
      title: "Middle",
      cards: makeCards(5),
      index: 1,
      columnCount: 3,
    });

    const badge = getByLabelText("5 cards");
    expect(badge.className).toContain("font-medium");
    expect(badge.className).not.toContain("font-bold");
  });
});
