import { useCallback, useMemo, useState } from "react";
import { ClipboardContext } from "./ClipboardContext";
import type { ClipboardContextValue } from "./ClipboardContext";
import type { CardClipboard } from "./types";
import { useBoard } from "./useBoard";

export function ClipboardProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [copiedCard, setCopiedCard] = useState<CardClipboard | null>(null);
  const { duplicateCard } = useBoard();

  const copyCard = useCallback((source: CardClipboard) => {
    setCopiedCard(source);
  }, []);

  const pasteCard = useCallback(
    (columnId: string): string | null => {
      if (!copiedCard) return null;
      return duplicateCard(columnId, copiedCard);
    },
    [copiedCard, duplicateCard],
  );

  const value = useMemo<ClipboardContextValue>(
    () => ({ copiedCard, copyCard, pasteCard }),
    [copiedCard, copyCard, pasteCard],
  );

  return (
    <ClipboardContext.Provider value={value}>
      {children}
    </ClipboardContext.Provider>
  );
}
