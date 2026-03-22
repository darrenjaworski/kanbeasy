import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import {
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  MAX_COLUMN_WIDTH,
} from "../../constants/column";

/**
 * Encapsulates column resize state and mouse event handling.
 * Returns the current pixel width and a mousedown handler to attach to the
 * resize handle. Cleans up window listeners automatically on unmount.
 */
export function useColumnResize(): {
  width: number;
  onResizeMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  stepWidth: (delta: number) => void;
} {
  const [width, setWidth] = useState<number>(DEFAULT_COLUMN_WIDTH);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_COLUMN_WIDTH);
  const onResizeMouseMove = useRef<((e: globalThis.MouseEvent) => void) | null>(
    null,
  );
  const onResizeMouseUp = useRef<(() => void) | null>(null);

  const onResizeMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    resizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";

    const handleMouseMove = (ev: globalThis.MouseEvent) => {
      if (!resizing.current) return;
      const delta = ev.clientX - startX.current;
      const newWidth = Math.max(
        MIN_COLUMN_WIDTH,
        Math.min(MAX_COLUMN_WIDTH, startWidth.current + delta),
      );
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      resizing.current = false;
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      onResizeMouseMove.current = null;
      onResizeMouseUp.current = null;
    };

    onResizeMouseMove.current = handleMouseMove;
    onResizeMouseUp.current = handleMouseUp;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    return () => {
      // Clean up listeners if unmounted while resizing
      if (onResizeMouseMove.current)
        window.removeEventListener("mousemove", onResizeMouseMove.current);
      if (onResizeMouseUp.current)
        window.removeEventListener("mouseup", onResizeMouseUp.current);
      document.body.style.cursor = "";
    };
  }, []);

  const stepWidth = useCallback((delta: number) => {
    setWidth((w) =>
      Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, w + delta)),
    );
  }, []);

  return { width, onResizeMouseDown, stepWidth };
}
