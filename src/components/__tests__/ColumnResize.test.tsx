

import * as React from "react";
import { render, fireEvent } from "@testing-library/react";
import { BoardProvider } from "../../board/BoardProvider";
import { Column } from "../Column";
import { ThemeContext } from "../../theme/ThemeContext";
import type { ThemeContextValue } from "../../theme/types";

function ThemeProviderWithColumnResize({ children }: { children: React.ReactNode }) {
  const value: ThemeContextValue = React.useMemo(
    () => ({
      theme: "light",
      setTheme: () => {},
      toggle: () => {},
      cardDensity: "medium",
      setCardDensity: () => {},
      columnResizingEnabled: true,
      setColumnResizingEnabled: () => {},
    }),
    []
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

describe("Column resizing", () => {
  it("should allow resizing the column with the mouse", () => {
    const { getByTestId } = render(
      <ThemeProviderWithColumnResize>
        <BoardProvider>
          <Column id="col1" title="Test Column" cards={[]} index={0} />
        </BoardProvider>
      </ThemeProviderWithColumnResize>
    );
    const section = getByTestId("column-0");
    const handle = getByTestId("resize-handle-0");
    fireEvent.mouseDown(handle, { clientX: 320 });
    fireEvent.mouseMove(window, { clientX: 400 });
    fireEvent.mouseUp(window);
    expect(section.style.width).not.toBe("");
    expect(parseInt(section.style.width)).toBeGreaterThanOrEqual(320);
    expect(parseInt(section.style.width)).toBeLessThanOrEqual(480);
  });

  it("should not allow resizing beyond max width", () => {
    const { getByTestId } = render(
      <ThemeProviderWithColumnResize>
        <BoardProvider>
          <Column id="col2" title="Test Column 2" cards={[]} index={1} />
        </BoardProvider>
      </ThemeProviderWithColumnResize>
    );
    const section = getByTestId("column-1");
    const handle = getByTestId("resize-handle-1");
    fireEvent.mouseDown(handle, { clientX: 320 });
    fireEvent.mouseMove(window, { clientX: 1000 });
    fireEvent.mouseUp(window);
    expect(parseInt(section.style.width)).toBeLessThanOrEqual(480);
  });

  it("should not allow resizing below min width", () => {
    const { getByTestId } = render(
      <ThemeProviderWithColumnResize>
        <BoardProvider>
          <Column id="col3" title="Test Column 3" cards={[]} index={2} />
        </BoardProvider>
      </ThemeProviderWithColumnResize>
    );
    const section = getByTestId("column-2");
    const handle = getByTestId("resize-handle-2");
    fireEvent.mouseDown(handle, { clientX: 320 });
    fireEvent.mouseMove(window, { clientX: 0 });
    fireEvent.mouseUp(window);
    expect(parseInt(section.style.width)).toBeGreaterThanOrEqual(200);
  });
});
