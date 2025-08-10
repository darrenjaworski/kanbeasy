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
            className="inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 p-2 text-sm hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
            aria-label="Open settings"
            onClick={() => setOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="M11.983 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
              <path fillRule="evenodd" d="M10.362 2.504a1.5 1.5 0 0 1 3.276 0l.23 1.383c.117.7.683 1.246 1.387 1.34l1.397.187a1.5 1.5 0 0 1 .978 2.464l-.94 1.037a1.5 1.5 0 0 0 0 2.006l.94 1.037a1.5 1.5 0 0 1-.978 2.464l-1.397.187a1.5 1.5 0 0 0-1.387 1.34l-.23 1.383a1.5 1.5 0 0 1-3.276 0l-.23-1.383a1.5 1.5 0 0 0-1.387-1.34l-1.397-.187a1.5 1.5 0 0 1-.978-2.464l.94-1.037a1.5 1.5 0 0 0 0-2.006l-.94-1.037a1.5 1.5 0 0 1 .978-2.464l1.397-.187a1.5 1.5 0 0 0 1.387-1.34l.23-1.383Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
