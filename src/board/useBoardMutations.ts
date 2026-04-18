import { type RefObject } from "react";
import type { BoardState } from "./types";
import { useColumnMutations } from "./useColumnMutations";
import { useCardMutations } from "./useCardMutations";
import { useCardTypeMutations } from "./useCardTypeMutations";
import { useArchiveMutations } from "./useArchiveMutations";

export function useBoardMutations(
  setState: React.Dispatch<React.SetStateAction<BoardState>>,
  nextCardNumberRef: RefObject<number>,
  saveCounter: (n: number) => void,
) {
  const columnMutations = useColumnMutations(setState);
  const cardMutations = useCardMutations(
    setState,
    nextCardNumberRef,
    saveCounter,
  );
  const cardTypeMutations = useCardTypeMutations(setState);
  const archiveMutations = useArchiveMutations(setState);

  return {
    ...columnMutations,
    ...cardMutations,
    ...cardTypeMutations,
    ...archiveMutations,
  };
}
