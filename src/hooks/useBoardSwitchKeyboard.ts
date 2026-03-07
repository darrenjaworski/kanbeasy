import { useEffect, useRef } from "react";
import type { BoardMeta } from "../boards/types";

type UseBoardSwitchKeyboardOptions = {
  boards: BoardMeta[];
  activeBoardId: string;
  switchBoard: (id: string) => void;
};

export function useBoardSwitchKeyboard({
  boards,
  activeBoardId,
  switchBoard,
}: UseBoardSwitchKeyboardOptions) {
  const ref = useRef({ boards, activeBoardId, switchBoard });
  ref.current = { boards, activeBoardId, switchBoard };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || !e.shiftKey) return;

      let delta = 0;
      if (e.key === "[") delta = -1;
      else if (e.key === "]") delta = 1;
      else return;

      e.preventDefault();
      const { boards: b, activeBoardId: active, switchBoard: sw } = ref.current;
      if (b.length <= 1) return;

      const currentIndex = b.findIndex((board) => board.id === active);
      const nextIndex = (currentIndex + delta + b.length) % b.length;
      sw(b[nextIndex].id);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
