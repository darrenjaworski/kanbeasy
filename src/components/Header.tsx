import { useState } from "react";
import { SettingsModal } from "./SettingsModal";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-10 border-b border-black/5 dark:border-white/10 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur supports-[backdrop-filter]:bg-surface-light/60 supports-[backdrop-filter]:dark:bg-surface-dark/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Kanbeasy</h1>
        <div className="ml-auto">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 p-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white"
            aria-label="Open settings"
            onClick={() => setOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
              className="size-5"
              fill="currentColor"
              aria-hidden
              focusable="false"
            >
              <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
            </svg>
          </button>
        </div>
      </div>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
