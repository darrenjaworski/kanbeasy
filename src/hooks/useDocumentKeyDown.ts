import { useEffect, useRef } from "react";

/**
 * Registers a keydown listener on `document` for the lifetime of the component.
 * The handler is stored in a ref so callers can pass an inline function without
 * causing the listener to be re-registered on every render.
 */
export function useDocumentKeyDown(handler: (e: KeyboardEvent) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      handlerRef.current(e);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
