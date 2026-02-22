import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsModal } from "../SettingsModal";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { BoardProvider } from "../../board/BoardProvider";
import { vi, describe, it, expect } from "vitest";

describe("SettingsModal", () => {
  it("clears localStorage when the clear button is clicked", () => {
    window.localStorage.setItem("kanbeasy:theme", "dark-slate");
    window.localStorage.setItem("kanbeasy:cardDensity", "large");
    render(
      <BoardProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={vi.fn()} />
        </ThemeProvider>
      </BoardProvider>,
    );
    const clearBtn = screen.getByRole("button", { name: /clear/i });
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(window.localStorage.getItem("kanbeasy:theme")).toBeNull();
    expect(window.localStorage.getItem("kanbeasy:cardDensity")).toBeNull();
  });
  it("renders the modal when open", () => {
    render(
      <BoardProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={vi.fn()} />
        </ThemeProvider>
      </BoardProvider>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onCloseMock = vi.fn();
    render(
      <BoardProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={onCloseMock} />
        </ThemeProvider>
      </BoardProvider>,
    );

    fireEvent.click(
      screen.getByLabelText("Close settings", { selector: ".ml-auto" }),
    );
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("does not render when isOpen is false", () => {
    render(
      <BoardProvider>
        <ThemeProvider>
          <SettingsModal open={false} onClose={vi.fn()} />
        </ThemeProvider>
      </BoardProvider>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
