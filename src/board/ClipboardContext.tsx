import { createContext } from "react";
import type { CardClipboard } from "./types";

export type ClipboardContextValue = Readonly<{
  copiedCard: CardClipboard | null;
  copyCard: (source: CardClipboard) => void;
  pasteCard: (columnId: string) => string | null;
}>;

export const ClipboardContext = createContext<
  ClipboardContextValue | undefined
>(undefined);
