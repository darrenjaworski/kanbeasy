import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsModal } from "../SettingsModal";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { BoardProvider } from "../../../board/BoardProvider";
import { vi, describe, it, expect } from "vitest";
import { STORAGE_KEYS } from "../../../constants/storage";
import { seedKv, kvGet, getBoard } from "../../../utils/db";

function expandDataSection() {
  fireEvent.click(screen.getByRole("button", { name: "Data" }));
}

describe("SettingsModal", () => {
  it("renders three separate clear buttons", () => {
    render(
      <BoardProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={vi.fn()} />
        </ThemeProvider>
      </BoardProvider>,
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
    seedKv(STORAGE_KEYS.THEME, "dark-slate");
    seedKv(STORAGE_KEYS.CARD_DENSITY, "large");
    render(
      <BoardProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={vi.fn()} />
        </ThemeProvider>
      </BoardProvider>,
    );
    expandDataSection();
    fireEvent.click(screen.getByRole("button", { name: "Clear board data" }));
    // Settings should be preserved
    expect(kvGet(STORAGE_KEYS.THEME, "")).toBe("dark-slate");
    expect(kvGet(STORAGE_KEYS.CARD_DENSITY, "")).toBe("large");
  });

  it("clears settings but preserves board when 'Clear settings' is clicked", () => {
    seedKv(STORAGE_KEYS.CARD_DENSITY, "large");
    render(
      <BoardProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={vi.fn()} />
        </ThemeProvider>
      </BoardProvider>,
    );
    expandDataSection();
    fireEvent.click(screen.getByRole("button", { name: "Clear settings" }));
    // Board data should still exist
    expect(getBoard()).not.toBeNull();
    // Card density should be reset to default "small" (compact)
    expect(kvGet(STORAGE_KEYS.CARD_DENSITY, "")).toBe("small");
  });

  it("clears all data when 'Clear all data' is clicked", () => {
    seedKv(STORAGE_KEYS.CARD_DENSITY, "large");
    render(
      <BoardProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={vi.fn()} />
        </ThemeProvider>
      </BoardProvider>,
    );
    expandDataSection();
    fireEvent.click(screen.getByRole("button", { name: "Clear all data" }));
    // Card density should be reset to default "small" (compact)
    expect(kvGet(STORAGE_KEYS.CARD_DENSITY, "")).toBe("small");
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

    fireEvent.click(screen.getByLabelText("Close settings"));
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
