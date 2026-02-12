import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBoardDragAndDrop } from "../useBoardDragAndDrop";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { Column } from "../types";

describe("useBoardDragAndDrop", () => {
  const mockColumns: Column[] = [
    {
      id: "col-1",
      title: "Column 1",
      cards: [
        { id: "card-1", title: "Card 1" },
        { id: "card-2", title: "Card 2" },
      ],
    },
    {
      id: "col-2",
      title: "Column 2",
      cards: [{ id: "card-3", title: "Card 3" }],
    },
  ];

  function createDragStartEvent(
    id: string,
    type: "card" | "column",
    columnId?: string
  ): DragStartEvent {
    return {
      active: {
        id,
        data: {
          current: {
            type,
            ...(columnId ? { columnId } : {}),
          },
        },
        node: {
          current: null,
        },
        rect: {
          current: null,
        },
      },
    };
  }

  function createDragEndEvent(
    activeId: string,
    activeType: "card" | "column",
    overId: string,
    overType: "card" | "column" | "column-drop",
    activeColumnId?: string,
    overColumnId?: string
  ): DragEndEvent {
    return {
      active: {
        id: activeId,
        data: {
          current: {
            type: activeType,
            ...(activeColumnId ? { columnId: activeColumnId } : {}),
          },
        },
        node: {
          current: null,
        },
        rect: {
          current: null,
        },
      },
      over: {
        id: overId,
        data: {
          current: {
            type: overType,
            ...(overColumnId ? { columnId: overColumnId } : {}),
          },
        },
        disabled: false,
        rect: {
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
        },
      },
      delta: { x: 0, y: 0 },
      collisions: null,
      activatorEvent: new Event("pointerdown"),
    };
  }

  describe("initialization", () => {
    it("initializes with null drag state", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      expect(result.current.activeType).toBeNull();
      expect(result.current.activeId).toBeNull();
      expect(result.current.activeCard).toBeNull();
    });
  });

  describe("handleDragStart", () => {
    it("sets active state for column drag", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const event = createDragStartEvent("col-1", "column");

      act(() => {
        result.current.handleDragStart(event);
      });

      expect(result.current.activeType).toBe("column");
      expect(result.current.activeId).toBe("col-1");
      expect(result.current.activeCard).toBeNull();
    });

    it("sets active state for card drag", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const event = createDragStartEvent("card-1", "card", "col-1");

      act(() => {
        result.current.handleDragStart(event);
      });

      expect(result.current.activeType).toBe("card");
      expect(result.current.activeId).toBe("card-1");
      expect(result.current.activeCard).toEqual({
        id: "card-1",
        title: "Card 1",
      });
    });

    it("handles missing type in drag data", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const event: DragStartEvent = {
        active: {
          id: "test",
          data: { current: {} },
          node: { current: null },
          rect: { current: null },
        },
      };

      act(() => {
        result.current.handleDragStart(event);
      });

      expect(result.current.activeType).toBeNull();
      expect(result.current.activeId).toBe("test");
    });
  });

  describe("handleDragEnd", () => {
    it("reorders columns when dragging column to column", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const startEvent = createDragStartEvent("col-1", "column");
      const endEvent = createDragEndEvent("col-1", "column", "col-2", "column");

      act(() => {
        result.current.handleDragStart(startEvent);
        result.current.handleDragEnd(endEvent);
      });

      expect(setColumns).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: "col-2" }),
          expect.objectContaining({ id: "col-1" }),
        ])
      );
      expect(result.current.activeType).toBeNull();
      expect(result.current.activeId).toBeNull();
    });

    it("reorders cards within same column", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const startEvent = createDragStartEvent("card-1", "card", "col-1");
      const endEvent = createDragEndEvent(
        "card-1",
        "card",
        "card-2",
        "card",
        "col-1",
        "col-1"
      );

      act(() => {
        result.current.handleDragStart(startEvent);
        result.current.handleDragEnd(endEvent);
      });

      expect(setColumns).toHaveBeenCalled();
      const updatedColumns = setColumns.mock.calls[0][0] as Column[];
      expect(updatedColumns[0].cards[0].id).toBe("card-2");
      expect(updatedColumns[0].cards[1].id).toBe("card-1");
    });

    it("moves card across columns", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const startEvent = createDragStartEvent("card-1", "card", "col-1");
      const endEvent = createDragEndEvent(
        "card-1",
        "card",
        "card-3",
        "card",
        "col-1",
        "col-2"
      );

      act(() => {
        result.current.handleDragStart(startEvent);
        result.current.handleDragEnd(endEvent);
      });

      expect(setColumns).toHaveBeenCalled();
      const updatedColumns = setColumns.mock.calls[0][0] as Column[];

      // card-1 removed from col-1
      expect(updatedColumns[0].cards.length).toBe(1);
      expect(updatedColumns[0].cards.find((c) => c.id === "card-1")).toBeUndefined();

      // card-1 added to col-2
      expect(updatedColumns[1].cards.length).toBe(2);
      expect(updatedColumns[1].cards[0].id).toBe("card-1");
    });

    it("drops card on column area", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const startEvent = createDragStartEvent("card-1", "card", "col-1");
      const endEvent = createDragEndEvent(
        "card-1",
        "card",
        "col-2",
        "column-drop",
        "col-1",
        "col-2"
      );

      act(() => {
        result.current.handleDragStart(startEvent);
        result.current.handleDragEnd(endEvent);
      });

      expect(setColumns).toHaveBeenCalled();
      const updatedColumns = setColumns.mock.calls[0][0] as Column[];

      // card-1 removed from col-1
      expect(updatedColumns[0].cards.length).toBe(1);

      // card-1 at beginning of col-2
      expect(updatedColumns[1].cards[0].id).toBe("card-1");
    });

    it("resets state when no over target", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const startEvent = createDragStartEvent("card-1", "card", "col-1");
      const endEvent: DragEndEvent = {
        active: {
          id: "card-1",
          data: { current: { type: "card", columnId: "col-1" } },
          node: { current: null },
          rect: { current: null },
        },
        over: null,
        delta: { x: 0, y: 0 },
        collisions: null,
        activatorEvent: new Event("pointerdown"),
      };

      act(() => {
        result.current.handleDragStart(startEvent);
        result.current.handleDragEnd(endEvent);
      });

      expect(setColumns).not.toHaveBeenCalled();
      expect(result.current.activeType).toBeNull();
      expect(result.current.activeId).toBeNull();
    });

    it("handles drop on column without columnId", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const startEvent = createDragStartEvent("card-1", "card", "col-1");
      const endEvent: DragEndEvent = {
        active: {
          id: "card-1",
          data: { current: { type: "card", columnId: "col-1" } },
          node: { current: null },
          rect: { current: null },
        },
        over: {
          id: "col-2",
          data: { current: { type: "column-drop" } }, // missing columnId
          disabled: false,
          rect: { width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 },
        },
        delta: { x: 0, y: 0 },
        collisions: null,
        activatorEvent: new Event("pointerdown"),
      };

      act(() => {
        result.current.handleDragStart(startEvent);
        result.current.handleDragEnd(endEvent);
      });

      expect(setColumns).not.toHaveBeenCalled();
      expect(result.current.activeType).toBeNull();
    });
  });

  describe("handleDragCancel", () => {
    it("resets drag state without calling setColumns", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const startEvent = createDragStartEvent("card-1", "card", "col-1");

      act(() => {
        result.current.handleDragStart(startEvent);
      });

      expect(result.current.activeType).toBe("card");
      expect(result.current.activeId).toBe("card-1");

      act(() => {
        result.current.handleDragCancel();
      });

      expect(setColumns).not.toHaveBeenCalled();
      expect(result.current.activeType).toBeNull();
      expect(result.current.activeId).toBeNull();
    });
  });

  describe("activeCard", () => {
    it("returns null when not dragging", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      expect(result.current.activeCard).toBeNull();
    });

    it("returns null when dragging column", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const event = createDragStartEvent("col-1", "column");

      act(() => {
        result.current.handleDragStart(event);
      });

      expect(result.current.activeCard).toBeNull();
    });

    it("returns card when dragging card", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const event = createDragStartEvent("card-2", "card", "col-1");

      act(() => {
        result.current.handleDragStart(event);
      });

      expect(result.current.activeCard).toEqual({
        id: "card-2",
        title: "Card 2",
      });
    });

    it("returns null when card not found", () => {
      const setColumns = vi.fn();
      const { result } = renderHook(() =>
        useBoardDragAndDrop({ columns: mockColumns, setColumns })
      );

      const event = createDragStartEvent("non-existent", "card", "col-1");

      act(() => {
        result.current.handleDragStart(event);
      });

      expect(result.current.activeCard).toBeNull();
    });
  });
});
