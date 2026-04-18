import { useEffect, useRef, useState } from "react";

/**
 * Manages desktop horizontal scroll state for the board container:
 * - Tracks left/right scroll overflow for gradient indicators
 * - Auto-scrolls to the far right when a new column is added
 */
export function useBoardScroll(columnCount: number) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const prevCountRef = useRef<number | null>(null);

  // Auto-scroll right when a column is added
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      prevCountRef.current = columnCount;
      return;
    }
    const prevCount = prevCountRef.current;
    if (prevCount !== null && columnCount > prevCount) {
      requestAnimationFrame(() => {
        type MaybeScrollTo = { scrollTo?: (opts: ScrollToOptions) => void };
        if (typeof (el as unknown as MaybeScrollTo).scrollTo === "function") {
          (el as unknown as MaybeScrollTo).scrollTo!({
            left: el.scrollWidth,
            behavior: "smooth",
          });
        } else {
          el.scrollLeft = el.scrollWidth;
        }
      });
    }
    prevCountRef.current = columnCount;
  }, [columnCount]);

  // Track scroll position for left/right gradient indicators
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      const { scrollLeft, clientWidth, scrollWidth } = el;
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
      setCanScrollLeft(scrollLeft > 0);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [columnCount]);

  return { scrollerRef, canScrollLeft, canScrollRight };
}
