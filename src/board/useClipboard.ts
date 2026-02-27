import { useContext } from "react";
import { ClipboardContext } from "./ClipboardContext";

export function useClipboard() {
  const ctx = useContext(ClipboardContext);
  if (!ctx)
    throw new Error("useClipboard must be used within ClipboardProvider");
  return ctx;
}
