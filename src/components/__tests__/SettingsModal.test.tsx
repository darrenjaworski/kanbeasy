import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsModal } from "../SettingsModal";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { vi } from "vitest";

describe("SettingsModal", () => {
  it("renders the modal when open", () => {
    render(
      <ThemeProvider>
        <SettingsModal open={true} onClose={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onCloseMock = vi.fn();
    render(
      <ThemeProvider>
        <SettingsModal open={true} onClose={onCloseMock} />
      </ThemeProvider>
    );

    fireEvent.click(
      screen.getByLabelText("Close settings", { selector: ".ml-auto" })
    );
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("does not render when isOpen is false", () => {
    render(
      <ThemeProvider>
        <SettingsModal open={false} onClose={vi.fn()} />
      </ThemeProvider>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a Save button and triggers onClose when clicked", () => {
    const onCloseMock = vi.fn();
    render(
      <ThemeProvider>
        <SettingsModal open={true} onClose={onCloseMock} />
      </ThemeProvider>
    );

    const saveBtn = screen.getByRole("button", { name: /save/i });
    expect(saveBtn).toBeInTheDocument();

    fireEvent.click(saveBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
