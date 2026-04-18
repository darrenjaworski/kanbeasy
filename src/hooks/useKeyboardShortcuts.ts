import { useRef } from "react";
import { useDocumentKeyDown } from "./useDocumentKeyDown";

export function useCommandPaletteShortcut(onToggle: () => void) {
  const callbackRef = useRef(onToggle);
  callbackRef.current = onToggle;

  useDocumentKeyDown((e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === "k") {
      e.preventDefault();
      callbackRef.current();
    }
  });
}
