import { useState } from "react";

import { SettingsModal } from "./settings/SettingsModal";
import { AnalyticsModal } from "./analytics/AnalyticsModal";
import { ArchiveModal } from "./archive/ArchiveModal";
import {
  SettingsGearIcon,
  AnalyticsIcon,
  ArchiveIcon,
  MenuIcon,
  CloseIcon,
} from "./icons";
import { SearchInput } from "./SearchInput";
import { ViewToggle } from "./ViewToggle";
import { useBoard } from "../board/useBoard";
import { useTheme } from "../theme/useTheme";
import { tc } from "../theme/classNames";

export function Header() {
  const { columns, archive } = useBoard();
  const { compactHeader } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const hasCards = columns.some((c) => c.cards.length > 0);
  const hasArchive = archive.length > 0;

  return (
    <>
      {/*
       * Sticky wrapper is the positioning parent for the mobile overlay menu.
       * The menu panel must be a sibling of <header> — not a child — so its
       * backdrop-filter is not trapped inside the header's compositing layer
       * (created by the header's own backdrop-blur).
       */}
      <div className="sticky top-0 z-10 relative">
        <header
          className={`border-b ${tc.borderSubtle} bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60`}
        >
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
            <h1
              className="text-lg font-semibold tracking-tight shrink-0"
              aria-level={1}
              data-testid="header-title"
            >
              Kanbeasy
            </h1>

            {/* Desktop: search + view toggle inline */}
            <div className="hidden sm:flex flex-1 items-center gap-3">
              <SearchInput />
              <ViewToggle />
            </div>

            {/* Desktop: action buttons */}
            <div className="hidden sm:flex ml-auto items-center gap-2">
              <button
                type="button"
                className={`${tc.button} rounded-md p-1.5 px-2.5 inline-flex items-center gap-1.5 justify-center disabled:opacity-40 disabled:pointer-events-none`}
                aria-label="Open analytics"
                onClick={() => setAnalyticsOpen(true)}
                disabled={!hasCards}
              >
                <AnalyticsIcon className="size-4" />
                {!compactHeader && (
                  <span className="text-xs font-medium">Analytics</span>
                )}
              </button>
              <button
                type="button"
                className={`${tc.button} rounded-md p-1.5 px-2.5 inline-flex items-center gap-1.5 justify-center disabled:opacity-40 disabled:pointer-events-none`}
                aria-label="Open archive"
                onClick={() => setArchiveOpen(true)}
                data-testid="archive-button"
                disabled={!hasArchive}
              >
                <ArchiveIcon className="size-4" />
                {!compactHeader && (
                  <span className="text-xs font-medium">Archive</span>
                )}
              </button>
              <button
                type="button"
                className={`${tc.button} rounded-md p-1.5 px-2.5 inline-flex items-center gap-1.5 justify-center`}
                aria-label="Open settings"
                onClick={() => setSettingsOpen(true)}
              >
                <SettingsGearIcon className="size-4" />
                {!compactHeader && (
                  <span className="text-xs font-medium">Settings</span>
                )}
              </button>
            </div>

            {/* Mobile: hamburger toggle */}
            <button
              type="button"
              className={`sm:hidden ml-auto ${tc.button} rounded-md p-1.5 inline-flex items-center justify-center`}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? (
                <CloseIcon className="size-4" />
              ) : (
                <MenuIcon className="size-4" />
              )}
            </button>
          </div>
        </header>

        {/*
         * Mobile overlay menu — sibling of <header> so backdrop-blur-2xl
         * can sample the board content directly, unobstructed by the
         * header's own compositing layer.
         */}
        {menuOpen && (
          <div
            id="mobile-menu"
            className={`sm:hidden absolute top-full left-0 right-0 border-b ${tc.borderSubtle} shadow-xl`}
          >
            {/* Frosted glass background layer */}
            <div className="absolute inset-0 bg-surface/80 backdrop-blur-2xl" />
            {/* Content above the blur layer */}
            <div className="relative z-10 px-4 pt-3 pb-4 flex flex-col gap-3">
              <SearchInput fullWidth />
              <ViewToggle mobile />
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  className={`${tc.button} rounded-lg py-2.5 flex flex-col items-center gap-1 disabled:opacity-40 disabled:pointer-events-none`}
                  aria-label="Open analytics"
                  onClick={() => {
                    setAnalyticsOpen(true);
                    setMenuOpen(false);
                  }}
                  disabled={!hasCards}
                >
                  <AnalyticsIcon className="size-5" />
                  <span className="text-xs font-medium">Analytics</span>
                </button>
                <button
                  type="button"
                  className={`${tc.button} rounded-lg py-2.5 flex flex-col items-center gap-1 disabled:opacity-40 disabled:pointer-events-none`}
                  aria-label="Open archive"
                  onClick={() => {
                    setArchiveOpen(true);
                    setMenuOpen(false);
                  }}
                  data-testid="archive-button"
                  disabled={!hasArchive}
                >
                  <ArchiveIcon className="size-5" />
                  <span className="text-xs font-medium">Archive</span>
                </button>
                <button
                  type="button"
                  className={`${tc.button} rounded-lg py-2.5 flex flex-col items-center gap-1`}
                  aria-label="Open settings"
                  onClick={() => {
                    setSettingsOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  <SettingsGearIcon className="size-5" />
                  <span className="text-xs font-medium">Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click-away backdrop — z-[9] sits below the sticky wrapper (z-10) */}
      {menuOpen && (
        <div
          className="sm:hidden fixed inset-0 z-[9]"
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <AnalyticsModal
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />
      <ArchiveModal open={archiveOpen} onClose={() => setArchiveOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
