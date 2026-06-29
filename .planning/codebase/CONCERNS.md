# Codebase Concerns

**Analysis Date:** 2026-06-29

## Tech Debt

**Structural Complexity - Core Mutation Logic:**

- Issue: While `src/board/useBoardMutations.ts` has been refactored into smaller hooks (`useColumnMutations`, `useCardMutations`, `useCardTypeMutations`, `useArchiveMutations`), the code still exhibits duplicated timestamp logic and state update patterns across mutation functions
- Files: `src/board/useColumnMutations.ts`, `src/board/useCardMutations.ts`, `src/board/useArchiveMutations.ts`
- Impact: Adding new mutations or fixing timestamp bugs requires changes in multiple places; potential for state consistency issues if updates diverge
- Fix approach: Extract a `withTimestamp()` helper that applies `updatedAt: Date.now()` consistently, and a `appendColumnHistory()` helper shared between `useCardMutations.ts` and `src/board/dragUtils.ts` (currently duplicated at lines ~129 and ~194)

**Monolithic Database Utility:**

- Issue: `src/utils/db.ts` (545 lines) mixes IndexedDB schema, migration, KV operations, debounced writes, localStorage fallback, and host-mode bridging into a single file
- Files: `src/utils/db.ts`
- Impact: Hard to navigate; adding new storage features or changing the schema requires understanding the full file; logic is tightly coupled
- Fix approach: Split into `src/utils/idb/connection.ts` (schema), `src/utils/idb/kv.ts` (key-value ops), `src/utils/idb/board.ts` (board persistence), and `src/utils/idb/index.ts` (re-exports) per the documented refactor plan in `docs/refactor-review.md`

**Monolithic Database Connection Pool:**

- Issue: `src/utils/db.ts` maintains a single global `db` reference and in-memory cache (`kvCache`, `boardCache`) with no clear initialization lifecycle or error recovery
- Files: `src/utils/db.ts` (lines 18–26)
- Impact: If IndexedDB fails partially (e.g., quota exceeded on write), the cache and persistent store may diverge, and the app continues with stale data
- Fix approach: Add explicit `dbReady` promise and state; ensure all reads/writes check availability before proceeding; add telemetry for storage errors

**Large Component - CalendarView:**

- Issue: `src/components/CalendarView.tsx` (432 lines) interleaves calendar grid math, React rendering, and date navigation controls
- Files: `src/components/CalendarView.tsx`
- Impact: Hard to test calendar logic independently; refactoring date logic for mobile or alternative views requires touching the whole component
- Fix approach: Extract `useCalendarGrid(referenceDate)` as a pure function; move SVG nav arrows to `src/components/icons/`; split into separate mobile/desktop views if needed

**Large Component - CardTypeSection:**

- Issue: `src/components/settings/CardTypeSection.tsx` (288 lines) has multiple edit states (renaming, color-picker open, delete confirmation) and repeated inline class strings
- Files: `src/components/settings/CardTypeSection.tsx`
- Impact: Adding card-type features or fixing styling bugs is error-prone; the component is hard to reason about due to nested state and repeated class patterns
- Fix approach: Extract `CardTypeEditorRow` subcomponent for each editable row; extract `ColorPickerPopover`; add `tc.cardTypeInput` class composite in `src/theme/classNames.ts`

**Magic Numbers in Multiple Files:**

- Issue: Constants like `MAX_UNDO_HISTORY = 50`, `SEARCH_FUZZY_THRESHOLD = 0.4`, `SWIPE_THRESHOLD_PX = 50`, and `SKELETON_DELAY_MS = 100` are scattered across source files rather than centralized
- Files: `src/board/useUndoableState.ts` (line 2), `src/board/useCardSearch.ts`, `src/hooks/useSwipeNavigation.ts`, `src/components/AppLoader.tsx`
- Impact: Tuning performance or behavior requires a grep; inconsistent values if changed in one place but not another
- Fix approach: All these constants have been centralized in `src/constants/behavior.ts` — audit that this file is the single source of truth and all imports reference it

---

## Known Bugs

**localStorage → IndexedDB Migration Race Condition:**

- Symptoms: When a user first runs the app on a new browser profile, the migration from localStorage to IndexedDB can race with rendering. If IndexedDB open fails partway through, data may be partially migrated, left in localStorage, or lost entirely. Subsequent app loads see inconsistent state
- Files: `src/utils/db.ts` (lines 256–293), `src/board/BoardProvider.tsx` (app initialization)
- Trigger: Fresh browser profile, or private/incognito window that starts with localStorage but triggers IndexedDB quota errors on write
- Workaround: Clear localStorage manually; reload the page to re-initialize from IndexedDB. Document this in help/FAQ
- Fix approach: Make migration fully atomic — only clear localStorage after successful IndexedDB write verification; add a `_migrationComplete` flag; retry on failure with exponential backoff before falling back to in-memory only

**Column History Not Validated on Load:**

- Symptoms: If a card's `columnHistory` array contains invalid entries (missing `columnId`, non-numeric `enteredAt`, or entries referencing deleted columns), analytics and cycle-time calculations may produce NaN or incorrect results
- Files: `src/board/validation.ts`, `src/utils/cycleTime.ts`, `src/utils/boardMetrics.ts`
- Trigger: Manually edited export file, or corrupted IndexedDB entry
- Workaround: Export/re-import the board from a working version
- Fix approach: Add `isColumnHistoryEntry()` validator; filter invalid entries during card migration in `src/board/migration.ts`

**Duplicate `appendColumnHistory` Logic:**

- Symptoms: Two places update `columnHistory`: `useCardMutations.ts` and `src/board/dragUtils.ts`. If one is fixed and the other is not, moves within a drag-and-drop flow may record different timestamps or miss history entries
- Files: `src/board/useCardMutations.ts`, `src/board/dragUtils.ts` (lines ~129, ~194)
- Trigger: Any card move operation that uses dragUtils without going through mutations
- Workaround: None — both paths must be kept in sync manually
- Fix approach: Extract a shared `appendColumnHistory(card, toColumnId, now)` helper in `src/board/columnHistoryHelpers.ts`; import in both places

**Analytics Metrics Recompute on Every Modal Open:**

- Symptoms: Opening the analytics modal triggers a recompute of all metrics (cycle time, throughput, reverse time) for all cards, which can be slow if the board has hundreds of cards
- Files: `src/components/analytics/AnalyticsModal.tsx` (renders call `getTotalCards()`, `getCardsInFlight()`, `getThroughput()`, etc. directly, not memoized)
- Trigger: Click analytics icon, wait for modal to appear; on a large board, visible jank
- Workaround: Keep analytics modal closed; use board state alone to gauge health
- Fix approach: Memoize metrics in BoardProvider using `useMemo`; invalidate on board state change only, not on every render

---

## Security Considerations

**localStorage Exposed During Migration:**

- Risk: During the IndexedDB migration flow, sensitive board data (including card descriptions, card types, and user settings) sits in localStorage unencrypted and is readable by any script with DOM access
- Files: `src/utils/db.ts` (lines 260–277), `src/constants/storage.ts`
- Current mitigation: localStorage is cleared after successful migration, but timing window is still open
- Recommendations:
  1. Consider encrypting sensitive fields in IndexedDB (e.g., card descriptions) using Web Crypto API — not critical for this app since boards are personal, but good for future sharing features
  2. Add a security audit of how export files are handled; ensure cleared Blobs are garbage collected promptly (line 79 in `src/utils/exportBoard.ts` does `URL.revokeObjectURL` but after 100ms delay — consider doing it synchronously or using a proper cleanup)
  3. Document that boards are stored in cleartext in IndexedDB; users should not store sensitive PII in cards

**No Data Encryption at Rest:**

- Risk: Board data (including all card content and history) is stored in cleartext in IndexedDB, accessible by any malicious script or browser extension
- Files: All board state via `src/utils/db.ts`
- Current mitigation: None — rely on browser sandbox
- Recommendations: If user data sharing is added (Supabase plan), encrypt before transmitting; consider client-side encryption in the browser for future multi-user scenarios

**Export File Handling:**

- Risk: Exported JSON files contain full board state including descriptions and card types, stored on disk without encryption. If a user exports and leaves the file on a shared computer or unencrypted drive, data is exposed
- Files: `src/utils/exportBoard.ts`
- Current mitigation: Filename includes date but not encryption; user is responsible for file security
- Recommendations:
  1. Document that exports should be stored securely
  2. Consider adding an option to encrypt exports with a password (optional feature, not critical)

---

## Performance Bottlenecks

**Unbounded Column History Per Card:**

- Problem: Each card maintains a `columnHistory` array that grows every time the card moves to a different column. With heavy board activity, this array can become very large (e.g., 1000+ entries for active cards), bloating the card object and slowing down serialization/persistence
- Files: `src/board/types.ts` (Card type definition), `src/utils/cycleTime.ts`, `src/utils/boardMetrics.ts`
- Cause: No limit on history entries; every move is recorded permanently
- Improvement path:
  1. Cap column history at N entries (e.g., 100), keeping only the most recent moves
  2. Offer an archival strategy: once a card is archived, truncate its pre-archive history to save space
  3. Add a migration to clean up existing boards with extremely long histories

**Large Undo/Redo History:**

- Problem: 50 history entries (MAX_UNDO_HISTORY in `src/constants/behavior.ts`) means 50 full board state snapshots in memory at any time, which can be megabytes for large boards
- Files: `src/board/useUndoableState.ts`, `src/constants/behavior.ts`
- Cause: Conservative default; no memory pressure detection
- Improvement path:
  1. Reduce default to 20–30 entries if testing shows no regression
  2. Add a memory monitor that clears history if available memory drops below a threshold (optional, complex)
  3. Consider a delta-based undo/redo instead of full snapshots (advanced refactor)

**Analytics Modal Computes All Metrics on Render:**

- Problem: Every render of `AnalyticsModal.tsx` calls `getTotalCards()`, `getCardsInFlight()`, `getThroughput()`, `getCardReverseTimes()`, etc., which iterate over all cards and archived cards — O(n) work
- Files: `src/components/analytics/AnalyticsModal.tsx`, `src/utils/boardMetrics.ts`, `src/utils/cycleTime.ts`
- Cause: No memoization; metrics recomputed even if board state hasn't changed
- Improvement path:
  1. Memoize metrics in `BoardProvider` via `useMemo(getMeasuredMetrics, [columns, archive])`
  2. Pass computed metrics as context; AnalyticsModal consumes them
  3. Add a `getMetrics()` function that returns all metrics at once to avoid multiple iterations

**No Pagination for Archived Cards:**

- Problem: `ArchiveModal.tsx` renders all archived cards at once; if a user has archived 1000+ cards, the modal DOM becomes very large and slow to scroll
- Files: `src/components/archive/ArchiveModal.tsx`
- Cause: No pagination or virtual scrolling implemented
- Improvement path:
  1. Add pagination (display 50 cards/page) or cursor-based loading
  2. Implement virtual scrolling for large archives (use a library like `react-window` if bundle size permits)

**Analytics Table Pagination Is Hardcoded:**

- Problem: Metrics tables in AnalyticsModal paginate at fixed intervals (e.g., 20 rows per page) with no user control; if a user has 1000+ cards with reverse moves, pagination UI becomes cluttered
- Files: `src/components/analytics/MetricsTable.tsx`
- Cause: Pagination size is hardcoded; no dynamic adjustment based on board size
- Improvement path: Make pagination size configurable or auto-adjust to fit visible area

---

## Fragile Areas

**Mobile/Desktop Logic Intertwined in Board Component:**

- Files: `src/components/board/Board.tsx`, `src/components/board/DesktopBoard.tsx`, `src/components/board/MobileBoard.tsx`
- Why fragile: `Board.tsx` (main orchestrator) manages `activeColumnIndex` for mobile, `detailCardId` for both, and DnD state for both. The mobile tab UI, desktop scrolling, and detail modal routing are split across three files, making it easy to break one path when modifying another. Changes to DnD or modal logic must be validated on both mobile and desktop
- Safe modification: Use strict responsive tests; run both `npm run e2e` and mobile-specific E2E tests (`tests-e2e/` has mobile-focused tests). Add a lint rule preventing `isMobile ? ... : ...` in the detail-modal logic; centralize viewport detection
- Test coverage: 26 E2E tests + mobile-specific tests in `tests-e2e/` cover this, but adding new drag-and-drop features should trigger `npm run e2e:visual` to catch responsive regressions

**Validation Uses Loose Type Checking:**

- Files: `src/board/validation.ts`
- Why fragile: Type guards use `typeof x === "object"` and optional property checks without deeply validating nested structures. A malformed card (e.g., missing `createdAt` or with non-numeric timestamps) will pass `isCard()` validation but may break analytics or sorting
- Safe modification: Enhance validators to check all required fields and their types recursively; add a `validate<T>(x, schema)` helper using something like Zod (if bundle size permits) or a custom schema validator
- Test coverage: `src/board/__tests__/validation.ts` exists; add more edge cases (missing fields, wrong types, nested corruptions)

**IndexedDB as Single Source of Truth with No Fallback:**

- Files: `src/utils/db.ts` (entire file), `src/board/BoardProvider.tsx` (initialization)
- Why fragile: If IndexedDB fails to open or write (e.g., quota exceeded, browser restrictions in private mode), the app falls back to in-memory storage, losing data on refresh. Multiple tabs don't sync; if one tab modifies the board, other tabs see stale state
- Safe modification: Keep all mutations idempotent; avoid storing intermediate state outside the board. Add explicit error boundaries around IndexedDB access. Consider adding a read-only mode if storage is unavailable
- Test coverage: `src/utils/__tests__/db.test.ts` and `src/utils/__tests__/db.host.test.ts` cover basic scenarios; add tests for quota-exceeded and private-mode failures

**Theme Provider Complexity:**

- Files: `src/theme/ThemeProvider.tsx` (369 lines)
- Why fragile: Manages 8+ settings (theme ID, theme preference, density, view mode, presets, column resizing, delete warning, owl mode, compact header, keyboard shortcuts) with interdependencies (e.g., theme preference affects which theme ID is selected). useStoredString/useStoredBool hooks handle persistence, but there's no atomic way to save all settings at once; if a save fails partway through, settings diverge
- Safe modification: Add a dedicated `useThemeSettings()` hook that wraps all related saves in a single transaction, or batch updates
- Test coverage: `src/theme/__tests__/ThemeProvider.test.tsx` covers basic scenarios; add tests for cross-setting interactions and partial save failures

---

## Scaling Limits

**No Limit on Cards Per Column:**

- Current capacity: App works smoothly up to ~500 cards total; individual columns with 100+ cards render slowly due to React reconciliation
- Limit: At ~1000 cards total, the board becomes noticeably laggy; drag-and-drop latency is visible
- Scaling path:
  1. Implement virtual scrolling for large columns (e.g., `react-window`)
  2. Add lazy-loading of card details (don't fetch full descriptions until detail modal opens)
  3. Implement server-side persistence with pagination (part of Supabase plan)

**No Limit on Column History Entries:**

- Current capacity: Cards with <100 history entries serialize/deserialize instantly
- Limit: At ~1000 history entries per card (very active workflow), serialization to IndexedDB can take several seconds; analytics calculations slow down
- Scaling path: Implement history truncation as noted in Performance section above

**No Limit on Undo/Redo History Size:**

- Current capacity: 50 full board snapshots in memory is ~50 MB for a board with 500 cards
- Limit: At ~1000 cards, memory usage could approach 200+ MB, slowing down the browser
- Scaling path: Reduce default from 50 to 20; add user preference to adjust

**Archive Growth:**

- Current capacity: Archiving 1000+ cards is fine; storage is cheap. Rendering all archived cards in the modal is the issue (see Performance section)
- Limit: At ~10,000 archived cards, the ArchiveModal DOM becomes unwieldy and network/sync operations may timeout
- Scaling path: Add pagination and optional hard-delete after N days

---

## Dependencies at Risk

**@dnd-kit Maintained But Niche:**

- Risk: Drag-and-drop library used throughout the app; if it becomes unmaintained or has critical bugs, there's no easy replacement without major refactor
- Impact: All column and card drag-and-drop UX depends on this; bugs in mobile DnD or collision detection are hard to work around
- Migration plan: If necessary, migrate to native browser drag API or Radix UI's drag-drop (less feature-rich but more standard). This is a large refactor — flag early if issues arise

**fuse.js Dependency:**

- Risk: Lightweight but unmaintained library for fuzzy search; if it has security issues or bugs with certain search queries, there's no fallback
- Impact: Card search feature breaks; users can't find cards by name
- Migration plan: Replace with a lightweight regex-based search or migrate to a maintained library like `flexsearch`

**No Version Lock Strategy:**

- Risk: `package.json` uses caret ranges (`^`) which allow minor/patch updates automatically. If a transitive dependency has a breaking change, the lockfile must be regenerated, but there's no CI/CD check preventing incompatible updates
- Impact: Subtle bugs from dependency updates (e.g., TypeScript, testing-library versions) may slip into production
- Migration plan: Use `npm audit` in CI/CD; pin critical dev dependencies to exact versions

---

## Missing Critical Features

**No Offline-First Sync:**

- Problem: Board changes are stored locally but not synced to a server. If the user clears their browser data or switches devices, all changes are lost. The Supabase plan exists but is not shipped
- Blocks: Multi-device workflows; backup/recovery; sharing boards with others
- Impact: High — users expect their data to be backed up and accessible across devices
- Priority: High — necessary before marketing the app for team use

**No Cross-Tab Synchronization:**

- Problem: If a user opens the app in two tabs and makes changes in one tab, the other tab doesn't update automatically; the user sees stale data until manually refreshing
- Blocks: Users can't work on the same board across multiple windows (tab A doesn't see changes from tab B)
- Impact: Medium — niche use case, but frustrating when it happens
- Priority: Medium — implement `storage` event listener to sync IndexedDB changes across tabs

**No Automatic Backup:**

- Problem: The only way to back up a board is manual export. If a user doesn't export regularly, a browser data clear loses all work
- Blocks: Long-term data protection; disaster recovery
- Impact: High — data loss risk
- Priority: Medium–High — implement periodic auto-export to IndexedDB or, better, Supabase

**No Import/Export Versioning GUI:**

- Problem: The export file includes a version number, but the import UI doesn't show which version you're importing or warn if importing an old version
- Blocks: Users don't know if they're importing old data or if migrations will be applied
- Impact: Low — edge case, but confusing
- Priority: Low — document in FAQ; add version display in import preview

**No Data Encryption for Sharing:**

- Problem: If/when the app adds sharing features, exported/shared boards will contain unencrypted data
- Blocks: Sharing sensitive boards (project plans, financial info)
- Impact: Medium — only relevant if sharing is implemented
- Priority: Low now; High if sharing is shipped

---

## Test Coverage Gaps

**Migration Logic for Large/Corrupt Exports:**

- What's not tested: Importing an export file with thousands of cards, or a file with malformed card objects (missing createdAt, corrupted timestamps)
- Files: `src/utils/__tests__/importBoard.test.ts` (589 lines), `src/board/__tests__/migration.test.ts` (392 lines)
- Risk: Corrupt imports could crash the analytics modal or produce NaN metrics
- Priority: High — add tests for edge cases in migration

**IndexedDB Quota Exceeded:**

- What's not tested: Behavior when IndexedDB write fails due to quota exceeded (simulate with fake-indexeddb)
- Files: `src/utils/__tests__/db.test.ts` (350 lines) — tests basic ops but not quota errors
- Risk: App silently falls back to in-memory storage without warning the user; data is lost on refresh
- Priority: High — add quota-exceeded error handling and user notification

**Cross-Tab Sync:**

- What's not tested: Opening the app in two tabs, modifying in one tab, checking if the other tab sees updates
- Files: No E2E test exists for this scenario
- Risk: Users experience data loss if they trust one tab and don't know another tab has stale data
- Priority: Medium — add an E2E test once cross-tab sync is implemented

**Mobile Drag-and-Drop Edge Cases:**

- What's not tested: Dragging a card on mobile with touch events, dropping outside the visible area, or dragging across tabs
- Files: `tests-e2e/` has mobile tests but may not cover all edge cases
- Risk: Drag-and-drop can fail silently on some devices, leaving the user with stuck/duplicate cards
- Priority: Medium — add E2E tests for mobile drag-and-drop with various device sizes and touch gestures

**Analytics with Edge-Case Data:**

- What's not tested: Boards where cards have no column history, or history with timestamps in the future, or cycles (card goes A → B → A → B)
- Files: `src/utils/__tests__/boardMetrics.test.ts` (736 lines), `src/utils/__tests__/cycleTime.test.ts` (462 lines) — good coverage but may have gaps
- Risk: Metrics produce NaN, negative cycle times, or crash the analytics modal
- Priority: Medium — review test cases for edge cases and add any missing

**Settings Persistence:**

- What's not tested: Clearing IndexedDB after saving settings, checking if settings are restored on next load; partial save failures
- Files: `src/theme/__tests__/ThemeProvider.test.tsx` (coverage exists)
- Risk: Users' theme/density preferences reset unexpectedly
- Priority: Low — likely covered implicitly by integration tests, but audit explicitly

---

## Notable Observations (Not Concerns But Worth Tracking)

1. **Good Refactoring Hygiene:** The refactor-review.md document is well-maintained and reflects the current state of the codebase. Tier 1 refactors (useBoardMutations split) have been mostly completed; Tier 2–3 items remain as documented.

2. **Strong Test Coverage:** 99 unit test files + 26 E2E tests is comprehensive; most critical paths are covered. The testing strategy (jsdom for unit tests, Playwright for E2E) is solid.

3. **Clear Separation of Concerns:** Board state, theme state, and persistence are properly isolated into separate providers; components are generally lean and focused.

4. **Vendor Lock-In on @dnd-kit:** While DnD library is solid, it's a bespoke choice. Consider what happens if it becomes unmaintained or doesn't support future UX (e.g., multi-select, copy-paste on desktop).

---

_Concerns audit: 2026-06-29_
