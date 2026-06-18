import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { BoardState } from "../board/types";

// Capture the subscription callback and control loadState inputs.
let externalCb: ((state: BoardState, nextCardNumber: number) => void) | null =
  null;
const saveBoardMock = vi.fn();

const SEEDED: BoardState = {
  columns: [
    { id: "c1", title: "Seeded", cards: [], createdAt: 1, updatedAt: 1 },
  ],
  archive: [],
};
const EXTERNAL: BoardState = {
  columns: [
    { id: "c1", title: "Seeded", cards: [], createdAt: 1, updatedAt: 1 },
    { id: "c2", title: "Added by MCP", cards: [], createdAt: 2, updatedAt: 2 },
  ],
  archive: [],
};

vi.mock("../utils/db", async (importActual) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importActual<typeof import("../utils/db")>();
  return {
    ...actual,
    getBoard: vi.fn(() => SEEDED),
    saveBoard: (...args: unknown[]) => saveBoardMock(...args),
    kvGet: vi.fn((_key: string, fallback: unknown) => fallback),
    kvSet: vi.fn(),
    subscribeToExternalBoardChange: vi.fn(
      (cb: (state: BoardState, n: number) => void) => {
        externalCb = cb;
        return () => {
          externalCb = null;
        };
      },
    ),
  };
});

import { BoardProvider } from "../board/BoardProvider";
import { useBoard } from "../board/useBoard";

function ColumnCount() {
  const { columns } = useBoard();
  return <div data-testid="count">{columns.length}</div>;
}

describe("BoardProvider host integration", () => {
  beforeEach(() => {
    externalCb = null;
    saveBoardMock.mockClear();
  });

  it("applies external board changes and does not echo them back as a save", () => {
    render(
      <BoardProvider>
        <ColumnCount />
      </BoardProvider>,
    );

    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(externalCb).toBeTypeOf("function");

    act(() => externalCb!(EXTERNAL, 42));

    expect(screen.getByTestId("count").textContent).toBe("2");
    // The inbound change must NOT trigger a write-back to the host.
    expect(saveBoardMock).not.toHaveBeenCalled();
  });
});
