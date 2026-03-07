import { fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Column } from "../Column";
import { renderWithProviders } from "../../../test/renderWithProviders";

function renderResizableColumn(props: {
  id: string;
  title: string;
  index: number;
}) {
  return renderWithProviders(<Column {...props} cards={[]} />, {
    theme: { columnResizingEnabled: true },
  });
}

describe("Column resizing", () => {
  it("should allow resizing the column with the mouse", () => {
    const { getByTestId } = renderResizableColumn({
      id: "col1",
      title: "Test Column",
      index: 0,
    });
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
    const { getByTestId } = renderResizableColumn({
      id: "col2",
      title: "Test Column 2",
      index: 1,
    });
    const section = getByTestId("column-1");
    const handle = getByTestId("resize-handle-1");
    fireEvent.mouseDown(handle, { clientX: 320 });
    fireEvent.mouseMove(window, { clientX: 1000 });
    fireEvent.mouseUp(window);
    expect(parseInt(section.style.width)).toBeLessThanOrEqual(480);
  });

  it("should not allow resizing below min width", () => {
    const { getByTestId } = renderResizableColumn({
      id: "col3",
      title: "Test Column 3",
      index: 2,
    });
    const section = getByTestId("column-2");
    const handle = getByTestId("resize-handle-2");
    fireEvent.mouseDown(handle, { clientX: 320 });
    fireEvent.mouseMove(window, { clientX: 0 });
    fireEvent.mouseUp(window);
    expect(parseInt(section.style.width)).toBeGreaterThanOrEqual(200);
  });
});
