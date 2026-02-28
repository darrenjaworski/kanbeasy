import { useState } from "react";

import { SettingsModal } from "./settings/SettingsModal";
import { AnalyticsModal } from "./analytics/AnalyticsModal";
import { ArchiveModal } from "./archive/ArchiveModal";
import { SettingsGearIcon, AnalyticsIcon, ArchiveIcon } from "./icons";
import { SearchInput } from "./SearchInput";
import { ViewToggle } from "./ViewToggle";
import { useBoard } from "../board/useBoard";
import { tc } from "../theme/classNames";

export function Header() {
  const { columns, archive } = useBoard();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const hasCards = columns.some((c) => c.cards.length > 0);
  const hasArchive = archive.length > 0;

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
            className={`${tc.button} rounded-md p-2 inline-flex items-center gap-2 justify-center disabled:opacity-40 disabled:pointer-events-none`}
            aria-label="Open analytics"
            onClick={() => setAnalyticsOpen(true)}
            disabled={!hasCards}
          >
            <AnalyticsIcon className="size-5" />
            <span className="text-sm font-medium">Analytics</span>
          </button>
          <button
            type="button"
            className={`${tc.button} rounded-md p-2 inline-flex items-center gap-2 justify-center disabled:opacity-40 disabled:pointer-events-none`}
            aria-label="Open archive"
            onClick={() => setArchiveOpen(true)}
            data-testid="archive-button"
            disabled={!hasArchive}
          >
            <ArchiveIcon className="size-5" />
            <span className="text-sm font-medium">Archive</span>
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
      <ArchiveModal open={archiveOpen} onClose={() => setArchiveOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}
