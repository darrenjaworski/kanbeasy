import { useEffect, useRef, useState } from "react";
import { Column } from "./Column";
import { useBoard } from "../board/useBoard";

export function Board() {
  const { columns, addColumn } = useBoard();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

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

  return (
    <div>
      {columns.length === 0 ? (
        <div>
          <button
            type="button"
            onClick={() => addColumn("New Column")}
            aria-label="Add column"
            className="w-72 shrink-0 min-h-28 rounded-lg border border-dashed border-black/15 dark:border-white/15 p-3 text-sm flex items-center justify-center text-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Add Column
          </button>
        </div>
      ) : (
        <div className="relative">
          <div ref={scrollerRef} className="overflow-x-auto w-full">
            <div className="flex gap-4 pb-1 items-stretch">
              {columns.map((c) => (
                <div key={c.id} className="w-72 shrink-0">
                  <Column title={c.title} />
                </div>
              ))}
              {/* Add Column tile at the end */}
              <button
                type="button"
                onClick={() => addColumn("New Column")}
                aria-label="Add column"
                className="w-72 shrink-0 min-h-28 rounded-lg border border-dashed border-black/15 dark:border-white/15 p-3 text-sm flex items-center justify-center text-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Add Column
              </button>
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
