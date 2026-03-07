import { useEffect, useRef } from "react";

export function useCommandPaletteShortcut(onToggle: () => void) {
  const callbackRef = useRef(onToggle);
  callbackRef.current = onToggle;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "k") {
        e.preventDefault();
        callbackRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
