import { useState } from "react";

import { SettingsModal } from "./SettingsModal";
import { SettingsGearIcon } from "./icons/SettingsGearIcon";

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
            <SettingsGearIcon className="size-5" />
          </button>
        </div>
      </div>
      <SettingsModal open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
