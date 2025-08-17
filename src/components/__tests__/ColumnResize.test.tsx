import { render, fireEvent } from "@testing-library/react";
import { Column } from "../Column";
import { BoardProvider } from "../../board/BoardProvider";
import { ThemeProvider } from "../../theme/ThemeProvider";

describe("Column resizing", () => {
  it("should allow resizing the column with the mouse", () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <BoardProvider>
          <Column id="col1" title="Test Column" cards={[]} index={0} />
        </BoardProvider>
      </ThemeProvider>
    );
    const section = getByTestId("column-0");
    const handle = getByTestId("resize-handle-0");
    // Simulate mouse down on handle
    fireEvent.mouseDown(handle, { clientX: 320 });
    // Simulate mouse move to the right (increase width)
    fireEvent.mouseMove(window, { clientX: 400 });
    fireEvent.mouseUp(window);
    // Should have increased width, but not more than max
    expect(section.style.width).not.toBe("");
    expect(parseInt(section.style.width)).toBeGreaterThanOrEqual(320);
    expect(parseInt(section.style.width)).toBeLessThanOrEqual(480);
  });

  it("should not allow resizing beyond max width", () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <BoardProvider>
          <Column id="col2" title="Test Column 2" cards={[]} index={1} />
        </BoardProvider>
      </ThemeProvider>
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
      <ThemeProvider>
        <BoardProvider>
          <Column id="col3" title="Test Column 3" cards={[]} index={2} />
        </BoardProvider>
      </ThemeProvider>
    );
    const section = getByTestId("column-2");
    const handle = getByTestId("resize-handle-2");
    fireEvent.mouseDown(handle, { clientX: 320 });
    fireEvent.mouseMove(window, { clientX: 0 });
    fireEvent.mouseUp(window);
    expect(parseInt(section.style.width)).toBeGreaterThanOrEqual(200);
  });
});
