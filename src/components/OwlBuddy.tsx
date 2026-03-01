import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../theme/useTheme";
import { tc } from "../theme/classNames";
import { OwlIcon, SleepyOwlIcon } from "./icons";
import { Tooltip } from "./shared/Tooltip";
import { owlTips, nightOwlTips } from "../constants/owlTips";
import { isNightOwlHour } from "../utils/isNightOwlHour";

const END_OF_DECK_TIP =
  "Hoot hoot hoot! You've seen every single tip I've got! I'm impressed — you're one dedicated owl-watcher. Reshuffling the deck for round two!";

/** Fisher-Yates shuffle (returns a new array). */
function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getActiveTips(isNight: boolean): readonly string[] {
  return isNight ? nightOwlTips : owlTips;
}

export function OwlBuddy() {
  const { owlModeEnabled } = useTheme();
  const [open, setOpen] = useState(false);
  const [tip, setTip] = useState("");
  const deckRef = useRef<string[]>([]);
  const posRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPoolRef = useRef<"day" | "night" | null>(null);

  const isNight = isNightOwlHour();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const advanceTip = useCallback(() => {
    const currentPool = isNightOwlHour() ? "night" : "day";
    const tips = getActiveTips(currentPool === "night");

    // Reset deck when the tip pool changes (day ↔ night)
    if (lastPoolRef.current !== null && lastPoolRef.current !== currentPool) {
      deckRef.current = [];
      posRef.current = 0;
    }
    lastPoolRef.current = currentPool;

    if (
      deckRef.current.length > 0 &&
      posRef.current >= deckRef.current.length
    ) {
      setTip(END_OF_DECK_TIP);
      const lastTip = deckRef.current[deckRef.current.length - 1];
      let newDeck: string[];
      do {
        newDeck = shuffle(tips);
      } while (newDeck[0] === lastTip && tips.length > 1);
      deckRef.current = newDeck;
      posRef.current = 0;
      return;
    }
    if (deckRef.current.length === 0) {
      deckRef.current = shuffle(tips);
      posRef.current = 0;
    }
    setTip(deckRef.current[posRef.current]);
    posRef.current += 1;
  }, []);

  const handleOpen = useCallback(() => {
    advanceTip();
    setOpen(true);
  }, [advanceTip]);

  const handleDismiss = useCallback(() => {
    setOpen(false);
  }, []);

  if (!owlModeEnabled) return null;

  const Icon = isNight ? SleepyOwlIcon : OwlIcon;
  const dismissLabel = isNight ? "Good night!" : "Thanks!";

  return (
    <div ref={containerRef} className="fixed bottom-4 left-4 z-10">
      {open && (
        <div
          className={`absolute bottom-full left-0 mb-2 w-64 rounded-lg border p-3 backdrop-blur ${tc.glass} ${tc.border}`}
        >
          <p data-testid="owl-tip" className={`text-sm ${tc.text} mb-4`}>
            {tip}
          </p>
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={advanceTip}
              className={`${tc.button} rounded-md px-2 py-1 text-xs`}
            >
              One more
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className={`${tc.button} rounded-md px-2 py-1 text-xs`}
            >
              {dismissLabel}
            </button>
          </div>
          {/* Triangle pointer — overflow-hidden clips the rotated square to a clean triangle */}
          <div className="absolute -bottom-2 left-5 h-2 w-4 overflow-hidden">
            <div
              className={`absolute -top-1.5 left-0.5 h-3 w-3 rotate-45 border ${tc.glass} ${tc.border}`}
            />
          </div>
        </div>
      )}
      <Tooltip content="Owl buddy" side="top">
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Owl buddy"
          className={`h-10 w-10 rounded-full border backdrop-blur ${tc.iconButton} ${tc.border} ${tc.glass}`}
        >
          <Icon className="h-6 w-6" />
        </button>
      </Tooltip>
    </div>
  );
}
