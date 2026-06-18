import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useUndoableState } from "../board/useUndoableState";

describe("useUndoableState.replaceState", () => {
  it("replaces present as a new baseline and resets undo/redo history", () => {
    const { result } = renderHook(() => useUndoableState(0));

    act(() => result.current.setState(1)); // records history
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.replaceState(99)); // authoritative external baseline
    expect(result.current.state).toBe(99);

    // History is reset: the external state is a new baseline the user cannot
    // rewind across (which would otherwise echo a stale board back to the host).
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    act(() => result.current.undo());
    expect(result.current.state).toBe(99);
  });
});
