import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useUndoableState } from "../board/useUndoableState";

describe("useUndoableState.replaceState", () => {
  it("replaces present without adding to undo history", () => {
    const { result } = renderHook(() => useUndoableState(0));

    act(() => result.current.setState(1)); // records history
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.replaceState(99)); // non-recording
    expect(result.current.state).toBe(99);

    // History is unchanged: undo returns to the value before the recorded change (0),
    // NOT to 1 — replaceState did not push a history entry.
    act(() => result.current.undo());
    expect(result.current.state).toBe(0);
  });
});
