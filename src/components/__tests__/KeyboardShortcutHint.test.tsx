import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { KeyboardShortcutHint } from "../KeyboardShortcutHint";

describe("KeyboardShortcutHint", () => {
  it("renders the hint with shortcut text", () => {
    render(<KeyboardShortcutHint />);
    const hint = screen.getByTestId("keyboard-shortcut-hint");
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveTextContent("⌘k");
    expect(hint).toHaveTextContent("Shortcuts");
  });

  it("renders the shortcut in a kbd element", () => {
    render(<KeyboardShortcutHint />);
    const kbd = screen
      .getByTestId("keyboard-shortcut-hint")
      .querySelector("kbd");
    expect(kbd).toHaveTextContent("⌘k");
  });
});
