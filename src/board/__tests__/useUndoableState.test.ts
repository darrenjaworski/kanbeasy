import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useUndoableState } from "../useUndoableState";

describe("useUndoableState", () => {
  it("initializes with the given value", () => {
    const { result } = renderHook(() => useUndoableState(0));
    expect(result.current.state).toBe(0);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("supports lazy initializer", () => {
    const { result } = renderHook(() => useUndoableState(() => 42));
    expect(result.current.state).toBe(42);
  });

  it("updates state with a value", () => {
    const { result } = renderHook(() => useUndoableState(0));
    act(() => result.current.setState(1));
    expect(result.current.state).toBe(1);
  });

  it("updates state with a functional updater", () => {
    const { result } = renderHook(() => useUndoableState(0));
    act(() => result.current.setState((prev) => prev + 10));
    expect(result.current.state).toBe(10);
  });

  it("can undo a single action", () => {
    const { result } = renderHook(() => useUndoableState("a"));
    act(() => result.current.setState("b"));
    expect(result.current.state).toBe("b");
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.state).toBe("a");
    expect(result.current.canUndo).toBe(false);
  });

  it("can redo after undo", () => {
    const { result } = renderHook(() => useUndoableState("a"));
    act(() => result.current.setState("b"));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(result.current.state).toBe("b");
    expect(result.current.canRedo).toBe(false);
  });

  it("supports multiple undo steps", () => {
    const { result } = renderHook(() => useUndoableState(0));
    act(() => result.current.setState(1));
    act(() => result.current.setState(2));
    act(() => result.current.setState(3));

    act(() => result.current.undo());
    expect(result.current.state).toBe(2);
    act(() => result.current.undo());
    expect(result.current.state).toBe(1);
    act(() => result.current.undo());
    expect(result.current.state).toBe(0);
    expect(result.current.canUndo).toBe(false);
  });

  it("clears redo stack on new action", () => {
    const { result } = renderHook(() => useUndoableState(0));
    act(() => result.current.setState(1));
    act(() => result.current.setState(2));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.setState(3));
    expect(result.current.canRedo).toBe(false);
    expect(result.current.state).toBe(3);
  });

  it("does not create a history entry for no-op (same reference)", () => {
    const obj = { value: 1 };
    const { result } = renderHook(() => useUndoableState(obj));
    act(() => result.current.setState((prev) => prev)); // same reference
    expect(result.current.canUndo).toBe(false);
  });

  it("caps history at maxHistory", () => {
    const { result } = renderHook(() => useUndoableState(0, { maxHistory: 3 }));
    act(() => result.current.setState(1));
    act(() => result.current.setState(2));
    act(() => result.current.setState(3));
    act(() => result.current.setState(4));

    // Only 3 entries in past, so undo 3 times goes back to state=1 (not 0)
    act(() => result.current.undo());
    act(() => result.current.undo());
    act(() => result.current.undo());
    expect(result.current.state).toBe(1);
    expect(result.current.canUndo).toBe(false);
  });

  it("undo is no-op when past is empty", () => {
    const { result } = renderHook(() => useUndoableState("x"));
    act(() => result.current.undo());
    expect(result.current.state).toBe("x");
  });

  it("redo is no-op when future is empty", () => {
    const { result } = renderHook(() => useUndoableState("x"));
    act(() => result.current.redo());
    expect(result.current.state).toBe("x");
  });

  it("does not track history when disabled", () => {
    const { result } = renderHook(() =>
      useUndoableState(0, { enabled: false }),
    );
    act(() => result.current.setState(1));
    act(() => result.current.setState(2));
    expect(result.current.state).toBe(2);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});
