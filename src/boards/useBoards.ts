import { useContext } from "react";
import { BoardsContext } from "./BoardsContext";

export function useBoards() {
  const ctx = useContext(BoardsContext);
  if (!ctx) {
    throw new Error("useBoards must be used within a BoardsProvider");
  }
  return ctx;
}
