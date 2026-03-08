import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BottomBar } from "../BottomBar";

vi.mock("../../board/useBoard", () => ({
  useBoard: () => ({
    canUndo: false,
    canRedo: false,
    undo: vi.fn(),
    redo: vi.fn(),
  }),
}));

let mockViewMode = "board";
let mockKeyboardShortcutsEnabled = true;

vi.mock("../../theme/useTheme", () => ({
  useTheme: () => ({
    viewMode: mockViewMode,
    keyboardShortcutsEnabled: mockKeyboardShortcutsEnabled,
  }),
}));

vi.mock("../../hooks", () => ({
  useUndoRedoKeyboard: vi.fn(),
}));

describe("BottomBar", () => {
  it("renders keyboard shortcut hint when enabled", () => {
    mockKeyboardShortcutsEnabled = true;
    mockViewMode = "board";
    render(<BottomBar />);
    const hint = screen.getByTestId("keyboard-shortcut-hint");
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveTextContent("⌘k");
    expect(hint).toHaveTextContent("Shortcuts");
  });

  it("renders the shortcut in a kbd element", () => {
    mockKeyboardShortcutsEnabled = true;
    mockViewMode = "board";
    render(<BottomBar />);
    const kbd = screen
      .getByTestId("keyboard-shortcut-hint")
      .querySelector("kbd");
    expect(kbd).toHaveTextContent("⌘k");
  });

  it("hides keyboard shortcut hint when disabled", () => {
    mockKeyboardShortcutsEnabled = false;
    mockViewMode = "board";
    render(<BottomBar />);
    expect(
      screen.queryByTestId("keyboard-shortcut-hint"),
    ).not.toBeInTheDocument();
  });

  it("shows undo/redo buttons on board view", () => {
    mockViewMode = "board";
    render(<BottomBar />);
    expect(screen.getByLabelText("Undo")).toBeInTheDocument();
    expect(screen.getByLabelText("Redo")).toBeInTheDocument();
  });

  it("hides undo/redo buttons on list view", () => {
    mockViewMode = "list";
    render(<BottomBar />);
    expect(screen.queryByLabelText("Undo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Redo")).not.toBeInTheDocument();
  });

  it("hides undo/redo buttons on calendar view", () => {
    mockViewMode = "calendar";
    render(<BottomBar />);
    expect(screen.queryByLabelText("Undo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Redo")).not.toBeInTheDocument();
  });
});
