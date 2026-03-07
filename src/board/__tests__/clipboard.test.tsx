import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useClipboard } from "../useClipboard";
import { useBoard } from "../useBoard";
import { ClipboardProvider } from "../ClipboardProvider";
import { BoardProvider } from "../BoardProvider";
import type { CardClipboard } from "../types";
import { STORAGE_KEYS } from "../../constants/storage";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BoardProvider>
      <ClipboardProvider>{children}</ClipboardProvider>
    </BoardProvider>
  );
}

describe("useClipboard", () => {
  it("throws when used outside ClipboardProvider", () => {
    expect(() => renderHook(() => useClipboard())).toThrow(
      "useClipboard must be used within ClipboardProvider",
    );
  });

  it("starts with no copied card", () => {
    const { result } = renderHook(() => useClipboard(), { wrapper });
    expect(result.current.copiedCard).toBeNull();
  });

  it("copies a card", () => {
    const { result } = renderHook(() => useClipboard(), { wrapper });

    const source: CardClipboard = {
      title: "Test",
      description: "Desc",
      cardTypeId: null,
    };
    act(() => result.current.copyCard(source));

    expect(result.current.copiedCard).toEqual(source);
  });

  it("returns null when pasting with no copied card", () => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));

    const { result } = renderHook(() => useClipboard(), { wrapper });

    let pasteResult: string | null = null;
    act(() => {
      pasteResult = result.current.pasteCard("col-1");
    });

    expect(pasteResult).toBeNull();
  });

  it("pastes a card into a column after copying", () => {
    const now = Date.now();
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({
        columns: [
          {
            id: "col-1",
            title: "Todo",
            cards: [],
            createdAt: now,
            updatedAt: now,
          },
        ],
      }),
    );

    const { result } = renderHook(() => useClipboard(), { wrapper });

    const source: CardClipboard = {
      title: "Copied card",
      description: "Some description",
      cardTypeId: null,
    };
    act(() => result.current.copyCard(source));

    let pasteResult: string | null = null;
    act(() => {
      pasteResult = result.current.pasteCard("col-1");
    });

    expect(pasteResult).not.toBeNull();
    expect(typeof pasteResult).toBe("string");
  });

  it("preserves cardTypeId when copying and pasting a card", () => {
    const now = Date.now();
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({
        columns: [
          {
            id: "col-1",
            title: "Todo",
            cards: [],
            createdAt: now,
            updatedAt: now,
          },
        ],
      }),
    );

    const { result } = renderHook(
      () => ({ clipboard: useClipboard(), board: useBoard() }),
      { wrapper },
    );

    const source: CardClipboard = {
      title: "Typed card",
      description: "Has a type",
      cardTypeId: "feat",
    };
    act(() => result.current.clipboard.copyCard(source));

    let pastedId: string | null = null;
    act(() => {
      pastedId = result.current.clipboard.pasteCard("col-1");
    });

    const pastedCard = result.current.board.columns[0].cards.find(
      (c) => c.id === pastedId,
    );
    expect(pastedCard).toBeDefined();
    expect(pastedCard!.cardTypeId).toBe("feat");
  });

  it("preserves copied card after pasting (allows multiple pastes)", () => {
    const now = Date.now();
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({
        columns: [
          {
            id: "col-1",
            title: "Todo",
            cards: [],
            createdAt: now,
            updatedAt: now,
          },
        ],
      }),
    );

    const { result } = renderHook(() => useClipboard(), { wrapper });

    const source: CardClipboard = {
      title: "Test",
      description: "",
      cardTypeId: null,
    };
    act(() => result.current.copyCard(source));
    act(() => {
      result.current.pasteCard("col-1");
    });

    // copiedCard should still be set after paste
    expect(result.current.copiedCard).toEqual(source);

    // Can paste again
    let secondResult: string | null = null;
    act(() => {
      secondResult = result.current.pasteCard("col-1");
    });
    expect(secondResult).not.toBeNull();
  });
});
