import { createContext } from "react";
import type { BoardContextValue } from "./types";

export const BoardContext = createContext<BoardContextValue | undefined>(
  undefined,
);
