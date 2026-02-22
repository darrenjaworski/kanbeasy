import { renderHook, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { useUndoRedoKeyboard } from "../useUndoRedoKeyboard";

function fireKey(opts: Partial<KeyboardEventInit> & { key: string }) {
  const event = new KeyboardEvent("keydown", { bubbles: true, ...opts });
  document.dispatchEvent(event);
}

describe("useUndoRedoKeyboard", () => {
  afterEach(() => {
    cleanup();
  });

  it("calls undo on Cmd+Z", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    renderHook(() =>
      useUndoRedoKeyboard({ undo, redo, canUndo: true, canRedo: false }),
    );

    fireKey({ key: "z", metaKey: true });
    expect(undo).toHaveBeenCalledOnce();
    expect(redo).not.toHaveBeenCalled();
  });

  it("calls undo on Ctrl+Z", () => {
    const undo = vi.fn();
    renderHook(() =>
      useUndoRedoKeyboard({
        undo,
        redo: vi.fn(),
        canUndo: true,
        canRedo: false,
      }),
    );

    fireKey({ key: "z", ctrlKey: true });
    expect(undo).toHaveBeenCalledOnce();
  });

  it("calls redo on Cmd+Shift+Z", () => {
    const redo = vi.fn();
    renderHook(() =>
      useUndoRedoKeyboard({
        undo: vi.fn(),
        redo,
        canUndo: false,
        canRedo: true,
      }),
    );

    fireKey({ key: "z", metaKey: true, shiftKey: true });
    expect(redo).toHaveBeenCalledOnce();
  });

  it("calls redo on Ctrl+Shift+Z", () => {
    const redo = vi.fn();
    renderHook(() =>
      useUndoRedoKeyboard({
        undo: vi.fn(),
        redo,
        canUndo: false,
        canRedo: true,
      }),
    );

    fireKey({ key: "z", ctrlKey: true, shiftKey: true });
    expect(redo).toHaveBeenCalledOnce();
  });

  it("does not call undo when canUndo is false", () => {
    const undo = vi.fn();
    renderHook(() =>
      useUndoRedoKeyboard({
        undo,
        redo: vi.fn(),
        canUndo: false,
        canRedo: false,
      }),
    );

    fireKey({ key: "z", metaKey: true });
    expect(undo).not.toHaveBeenCalled();
  });

  it("does not call redo when canRedo is false", () => {
    const redo = vi.fn();
    renderHook(() =>
      useUndoRedoKeyboard({
        undo: vi.fn(),
        redo,
        canUndo: false,
        canRedo: false,
      }),
    );

    fireKey({ key: "z", metaKey: true, shiftKey: true });
    expect(redo).not.toHaveBeenCalled();
  });

  it("skips when focus is in an input element", () => {
    const undo = vi.fn();
    renderHook(() =>
      useUndoRedoKeyboard({
        undo,
        redo: vi.fn(),
        canUndo: true,
        canRedo: false,
      }),
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "z",
      metaKey: true,
      bubbles: true,
    });
    input.dispatchEvent(event);
    expect(undo).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("skips when focus is in a textarea", () => {
    const undo = vi.fn();
    renderHook(() =>
      useUndoRedoKeyboard({
        undo,
        redo: vi.fn(),
        canUndo: true,
        canRedo: false,
      }),
    );

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent("keydown", {
      key: "z",
      metaKey: true,
      bubbles: true,
    });
    textarea.dispatchEvent(event);
    expect(undo).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it("skips when focus is in a contenteditable element", () => {
    const undo = vi.fn();
    renderHook(() =>
      useUndoRedoKeyboard({
        undo,
        redo: vi.fn(),
        canUndo: true,
        canRedo: false,
      }),
    );

    const div = document.createElement("div");
    div.contentEditable = "true";
    document.body.appendChild(div);
    div.focus();

    const event = new KeyboardEvent("keydown", {
      key: "z",
      metaKey: true,
      bubbles: true,
    });
    div.dispatchEvent(event);
    expect(undo).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it("cleans up listener on unmount", () => {
    const undo = vi.fn();
    const { unmount } = renderHook(() =>
      useUndoRedoKeyboard({
        undo,
        redo: vi.fn(),
        canUndo: true,
        canRedo: false,
      }),
    );

    unmount();
    fireKey({ key: "z", metaKey: true });
    expect(undo).not.toHaveBeenCalled();
  });
});
