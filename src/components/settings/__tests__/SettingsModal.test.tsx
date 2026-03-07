import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsModal } from "../SettingsModal";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { BoardsProvider } from "../../../boards/BoardsProvider";
import { BoardProvider } from "../../../board/BoardProvider";
import { vi, describe, it, expect } from "vitest";

function expandDataSection() {
  fireEvent.click(screen.getByRole("button", { name: "Data" }));
}

describe("SettingsModal", () => {
  it("renders three separate clear buttons", () => {
    render(
      <BoardsProvider>
        <BoardProvider>
          <ThemeProvider>
            <SettingsModal open={true} onClose={vi.fn()} />
          </ThemeProvider>
        </BoardProvider>
      </BoardsProvider>,
    );
    expandDataSection();
    expect(
      screen.getByRole("button", { name: "Clear board data" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear all data" }),
    ).toBeInTheDocument();
  });

  it("clears board data but preserves settings when 'Clear board data' is clicked", () => {
    window.localStorage.setItem("kanbeasy:theme", "dark-slate");
    window.localStorage.setItem("kanbeasy:cardDensity", "large");
    render(
      <BoardsProvider>
        <BoardProvider>
          <ThemeProvider>
            <SettingsModal open={true} onClose={vi.fn()} />
          </ThemeProvider>
        </BoardProvider>
      </BoardsProvider>,
    );
    expandDataSection();
    fireEvent.click(screen.getByRole("button", { name: "Clear board data" }));
    // Settings should be preserved
    expect(window.localStorage.getItem("kanbeasy:theme")).toBe("dark-slate");
    expect(window.localStorage.getItem("kanbeasy:cardDensity")).toBe("large");
  });

  it("clears settings but preserves board when 'Clear settings' is clicked", () => {
    window.localStorage.setItem("kanbeasy:cardDensity", "large");
    render(
      <BoardsProvider>
        <BoardProvider>
          <ThemeProvider>
            <SettingsModal open={true} onClose={vi.fn()} />
          </ThemeProvider>
        </BoardProvider>
      </BoardsProvider>,
    );
    expandDataSection();
    fireEvent.click(screen.getByRole("button", { name: "Clear settings" }));
    // Board data should still exist (stored under board:default after migration)
    expect(
      window.localStorage.getItem("kanbeasy:board:default"),
    ).not.toBeNull();
    // Card density should be reset to default "small" (compact)
    expect(window.localStorage.getItem("kanbeasy:cardDensity")).toBe("small");
  });

  it("clears all data when 'Clear all data' is clicked", () => {
    window.localStorage.setItem("kanbeasy:cardDensity", "large");
    render(
      <BoardsProvider>
        <BoardProvider>
          <ThemeProvider>
            <SettingsModal open={true} onClose={vi.fn()} />
          </ThemeProvider>
        </BoardProvider>
      </BoardsProvider>,
    );
    expandDataSection();
    fireEvent.click(screen.getByRole("button", { name: "Clear all data" }));
    // Card density should be reset to default "small" (compact)
    expect(window.localStorage.getItem("kanbeasy:cardDensity")).toBe("small");
  });

  it("renders the modal when open", () => {
    render(
      <BoardsProvider>
        <BoardProvider>
          <ThemeProvider>
            <SettingsModal open={true} onClose={vi.fn()} />
          </ThemeProvider>
        </BoardProvider>
      </BoardsProvider>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onCloseMock = vi.fn();
    render(
      <BoardsProvider>
        <BoardProvider>
          <ThemeProvider>
            <SettingsModal open={true} onClose={onCloseMock} />
          </ThemeProvider>
        </BoardProvider>
      </BoardsProvider>,
    );

    fireEvent.click(screen.getByLabelText("Close settings"));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("does not render when isOpen is false", () => {
    render(
      <BoardsProvider>
        <BoardProvider>
          <ThemeProvider>
            <SettingsModal open={false} onClose={vi.fn()} />
          </ThemeProvider>
        </BoardProvider>
      </BoardsProvider>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
