import { useEffect, useRef, useState } from "react";
import { Column } from "./Column";
import { useBoard } from "../board/useBoard";
import { AddColumn } from "./AddColumn";

export function Board() {
  const { columns, addColumn } = useBoard();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const prevLenRef = useRef<number | null>(null);

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
    // observe content too
    if (el.firstElementChild) {
      ro.observe(el.firstElementChild);
    }
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [columns.length]);

  // Scroll to the far right when a new column is added (but skip initial mount)
  useEffect(() => {
    const el = scrollerRef.current;
    const prevLen = prevLenRef.current;
    if (!el) {
      prevLenRef.current = columns.length;
      return;
    }
    if (prevLen !== null && columns.length > prevLen) {
      // Wait a frame to ensure the new column is laid out, then scroll smoothly
      requestAnimationFrame(() => {
        const maxLeft = el.scrollWidth;
        // Prefer smooth scroll when available (browsers); fallback for jsdom
        type MaybeScrollTo = { scrollTo?: (opts: ScrollToOptions) => void };
        if (typeof (el as unknown as MaybeScrollTo).scrollTo === "function") {
          (el as unknown as MaybeScrollTo).scrollTo!({
            left: maxLeft,
            behavior: "smooth",
          });
        } else {
          el.scrollLeft = maxLeft;
        }
      });
    }
    prevLenRef.current = columns.length;
  }, [columns.length]);

  return (
    <div>
      {columns.length === 0 ? (
        <div>
          <AddColumn handleOnClick={() => addColumn("New Column")} />
        </div>
      ) : (
        <div className="relative">
          <div ref={scrollerRef} className="overflow-x-auto w-full">
            <div className="flex gap-4 pb-1 items-stretch">
              {columns.map((c) => (
                <div key={c.id} className="w-80 shrink-0">
                  <Column id={c.id} title={c.title} cards={c.cards} />
                </div>
              ))}
              {/* Add Column tile at the end */}
              <AddColumn handleOnClick={() => addColumn("New Column")} />
            </div>
          </div>
          {canScrollLeft && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-bg-light/90 to-transparent dark:from-bg-dark/90"
            />
          )}
          {canScrollRight && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bg-light/90 to-transparent dark:from-bg-dark/90"
            />
          )}
        </div>
      )}
    </div>
  );
}
