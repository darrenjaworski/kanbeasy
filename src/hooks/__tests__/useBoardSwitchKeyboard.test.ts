import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useBoardSwitchKeyboard } from "../useBoardSwitchKeyboard";
import type { BoardMeta } from "../../boards/types";

function makeBoards(count: number): BoardMeta[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `board-${i}`,
    title: `Board ${i}`,
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  }));
}

function fireKey(key: string, mods: Partial<KeyboardEventInit> = {}) {
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      metaKey: true,
      shiftKey: true,
      bubbles: true,
      ...mods,
    }),
  );
}

describe("useBoardSwitchKeyboard", () => {
  it("switches to next board on Cmd+Shift+]", () => {
    const switchBoard = vi.fn();
    const boards = makeBoards(3);

    renderHook(() =>
      useBoardSwitchKeyboard({
        boards,
        activeBoardId: "board-0",
        switchBoard,
      }),
    );

    fireKey("]");

    expect(switchBoard).toHaveBeenCalledWith("board-1");
  });

  it("switches to previous board on Cmd+Shift+[", () => {
    const switchBoard = vi.fn();
    const boards = makeBoards(3);

    renderHook(() =>
      useBoardSwitchKeyboard({
        boards,
        activeBoardId: "board-1",
        switchBoard,
      }),
    );

    fireKey("[");

    expect(switchBoard).toHaveBeenCalledWith("board-0");
  });

  it("wraps around from last to first board", () => {
    const switchBoard = vi.fn();
    const boards = makeBoards(3);

    renderHook(() =>
      useBoardSwitchKeyboard({
        boards,
        activeBoardId: "board-2",
        switchBoard,
      }),
    );

    fireKey("]");

    expect(switchBoard).toHaveBeenCalledWith("board-0");
  });

  it("wraps around from first to last board", () => {
    const switchBoard = vi.fn();
    const boards = makeBoards(3);

    renderHook(() =>
      useBoardSwitchKeyboard({
        boards,
        activeBoardId: "board-0",
        switchBoard,
      }),
    );

    fireKey("[");

    expect(switchBoard).toHaveBeenCalledWith("board-2");
  });

  it("does not switch when only one board exists", () => {
    const switchBoard = vi.fn();
    const boards = makeBoards(1);

    renderHook(() =>
      useBoardSwitchKeyboard({
        boards,
        activeBoardId: "board-0",
        switchBoard,
      }),
    );

    fireKey("]");
    fireKey("[");

    expect(switchBoard).not.toHaveBeenCalled();
  });

  it("ignores keys without modifier", () => {
    const switchBoard = vi.fn();
    const boards = makeBoards(3);

    renderHook(() =>
      useBoardSwitchKeyboard({
        boards,
        activeBoardId: "board-0",
        switchBoard,
      }),
    );

    fireKey("]", { metaKey: false, ctrlKey: false });

    expect(switchBoard).not.toHaveBeenCalled();
  });

  it("ignores keys without shift", () => {
    const switchBoard = vi.fn();
    const boards = makeBoards(3);

    renderHook(() =>
      useBoardSwitchKeyboard({
        boards,
        activeBoardId: "board-0",
        switchBoard,
      }),
    );

    fireKey("]", { shiftKey: false });

    expect(switchBoard).not.toHaveBeenCalled();
  });

  it("works with Ctrl modifier (non-Mac)", () => {
    const switchBoard = vi.fn();
    const boards = makeBoards(3);

    renderHook(() =>
      useBoardSwitchKeyboard({
        boards,
        activeBoardId: "board-0",
        switchBoard,
      }),
    );

    fireKey("]", { metaKey: false, ctrlKey: true });

    expect(switchBoard).toHaveBeenCalledWith("board-1");
  });

  it("ignores unrelated keys", () => {
    const switchBoard = vi.fn();
    const boards = makeBoards(3);

    renderHook(() =>
      useBoardSwitchKeyboard({
        boards,
        activeBoardId: "board-0",
        switchBoard,
      }),
    );

    fireKey("a");
    fireKey("z");

    expect(switchBoard).not.toHaveBeenCalled();
  });
});
