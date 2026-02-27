import { useState } from "react";

import { SettingsModal } from "./settings/SettingsModal";
import { AnalyticsModal } from "./analytics/AnalyticsModal";
import { SettingsGearIcon, AnalyticsIcon } from "./icons";
import { SearchInput } from "./SearchInput";
import { ViewToggle } from "./ViewToggle";
import { tc } from "../theme/classNames";

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  return (
    <header
      className={`sticky top-0 z-10 border-b ${tc.borderSubtle} bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60`}
    >
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <h1
          className="text-lg font-semibold tracking-tight"
          aria-level={1}
          data-testid="header-title"
        >
          Kanbeasy
        </h1>
        <SearchInput />
        <ViewToggle />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className={`${tc.button} rounded-md p-2 inline-flex items-center gap-2 justify-center`}
            aria-label="Open analytics"
            onClick={() => setAnalyticsOpen(true)}
          >
            <AnalyticsIcon className="size-5" />
            <span className="text-sm font-medium">Analytics</span>
          </button>
          <button
            type="button"
            className={`${tc.button} rounded-md p-2 inline-flex items-center gap-2 justify-center`}
            aria-label="Open settings"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsGearIcon className="size-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </div>
      <AnalyticsModal
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}
