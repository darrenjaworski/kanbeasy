import { useRef, useCallback, type TouchEvent } from "react";

interface UseSwipeNavigationOptions {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Detects horizontal swipe gestures on a touch element.
 * Returns onTouchStart/onTouchEnd props to spread onto the target element.
 *
 * Guards:
 * - `threshold` (default 50px): minimum horizontal travel to count as a swipe
 * - axis check: |dx| must exceed |dy| so vertical scrolling is unaffected
 * - `enabled`: set to false to disable (e.g. while a drag is active)
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: UseSwipeNavigationOptions) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [enabled],
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Require horizontal dominance and minimum travel distance
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;

      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    },
    [enabled, threshold, onSwipeLeft, onSwipeRight],
  );

  return { onTouchStart, onTouchEnd };
}
