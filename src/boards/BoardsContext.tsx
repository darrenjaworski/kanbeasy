import { createContext } from "react";
import type { BoardsContextValue } from "./types";

export const BoardsContext = createContext<BoardsContextValue | undefined>(
  undefined,
);
