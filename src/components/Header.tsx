import { useState } from "react";

import { SettingsModal } from "./SettingsModal";
import { SettingsGearIcon } from "./icons/SettingsGearIcon";
import { SearchInput } from "./SearchInput";
import { tc } from "../theme/classNames";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className={`sticky top-0 z-10 border-b ${tc.borderSubtle} bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60`}>
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <h1
          className="text-lg font-semibold tracking-tight"
          aria-level={1}
          data-testid="header-title"
        >
          Kanbeasy
        </h1>
        <SearchInput />
        <div className="ml-auto">
          <button
            type="button"
            className={`${tc.button} rounded-md p-2 inline-flex items-center justify-center`}
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
