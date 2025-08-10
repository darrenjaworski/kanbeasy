import { useContext } from "react";
import { BoardContext } from "./BoardContext";

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used within BoardProvider");
  return ctx;
}
