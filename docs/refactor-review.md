# Refactor Review

## Context

A codebase-wide review of `src/` to identify files that would benefit from refactoring. No specific refactor is scheduled yet — this doc captures a prioritized list of candidates so any one of them can be picked up as a standalone piece of work.

Two noteworthy findings from the review:

- The **"theme class helpers" refactor** (previously tracked as planned work) is already shipped. `src/theme/classNames.ts` exports the `tc.*` tokens (border, glass, text, bgHover, …) plus composites (`button`, `iconButton`, `dangerButton`, `tooltip`). A grep for the canonical inline pattern `border-black/10 dark:border-white/10` returns a single hit — the token definition itself — which means the prior class soup has been fully consolidated.
- A few utilities (`boardMetrics`, `cycleTime`, `checklistStats`, `toggleMarkdownCheckbox`) look orphaned at first glance but are in active use via `AnalyticsModal`, `MetricsTable`, `ChecklistProgress`, and `DescriptionField`. Not refactor candidates.

What remains is almost entirely structural: a handful of large files that have grown past a comfortable size and mix several concerns.

---

## Ranked Refactor Targets

### Tier 1 — High value, medium effort

#### 1. `src/board/useBoardMutations.ts` (458 lines)

A single hook exposing ~20 mutation callbacks spanning column CRUD, card CRUD, sorting/reordering, card types, archive, and restore. Every mutation duplicates the `const now = Date.now()` preamble and the "spread previous state → map columns → map cards → re-wrap" update shape.

**Direction**: split into focused hooks that share helpers.

- `useColumnMutations` — addColumn, removeColumn, renameColumn, reorderColumn, sortCards-within-column
- `useCardMutations` — addCard, updateCard, removeCard, reorderCard, moveCard, duplicateCard
- `useArchiveMutations` — archiveCard, restoreCard, purgeArchive
- `useCardTypeMutations` (only if card-type editing needs board context; otherwise leave with `ThemeProvider`)

Extract two internal helpers while you're there:

- `withTimestamp<T extends { updatedAt: number }>(entity, patch): T` — returns `{ ...entity, ...patch, updatedAt: now }`
- `appendColumnHistory(card, toColId, now)` — currently duplicated between `useBoardMutations.ts` and `src/utils/dragUtils.ts` (two callsites around lines ~129 and ~194)

Compose the split hooks back together in `BoardProvider.tsx` so `useBoard()` consumers see no API change.

#### 2. `src/components/board/Board.tsx` (280 lines)

Mixes desktop scrollable board + mobile swipeable tab layout + detail-modal id routing + scroll-gradient edges + auto-scroll on column add + ResizeObserver wiring. Three `useEffect` blocks and branching JSX make the mobile/desktop split hard to follow.

**Direction**:

- Extract `useBoardScroll` hook (scroll gradients, auto-scroll-to-new-column, `ResizeObserver`).
- Split render into `<DesktopBoard />` and `<MobileBoard />`; `Board.tsx` becomes a thin switch on viewport.
- Keep `DndContext` at the top; the render split sits inside the shared context.

#### 3. `src/components/board/Column.tsx` (259 lines)

Combines inline title edit, drag handle, delete-confirm trigger, card-count badge with WIP heat logic, resize handle, and the card list. Some `className` chains run 8+ tokens with nested ternaries for mobile vs. desktop.

**Direction**:

- Extract `ColumnTitleEdit` (reuse existing `useInlineEdit`)
- Extract `ColumnCardCountBadge` (encapsulates WIP heat logic)
- Extract `ColumnResizeHandle`
- Leave `Column.tsx` as the layout + DnD shell

---

### Tier 2 — Medium value, medium effort

#### 4. `src/utils/db.ts` (407 lines)

A grab-bag: IndexedDB open/migration, debounced writer, kv get/set/remove, board get/save, import/clear lifecycle. The public surface is fine, but the internals would be easier to navigate if split.

**Direction**: split into:

- `src/utils/idb/connection.ts` — open/upgrade/schema
- `src/utils/idb/kv.ts` — `kvGet` / `kvSet` / `kvRemove`
- `src/utils/idb/board.ts` — `getBoard` / `saveBoard` + debounced write
- `src/utils/idb/index.ts` — re-exports (keeps existing import paths working)

Keep the write-debounce constant and all storage keys in one place (`src/constants/storage.ts` already centralizes keys — good).

#### 5. `src/components/CalendarView.tsx` (432 lines)

The largest single view. Pure grid-math is tangled with React rendering, and two nested inline components (`CalendarHeader`, `CalendarBody`) make extension awkward.

**Direction**:

- Extract `useCalendarGrid(referenceDate)` → returns the week/day cells with cards bucketed by due date. Pure function, trivially testable.
- Move nav-arrow SVGs into `src/components/icons/` (already has a barrel).
- Keep `CalendarView.tsx` as the orchestrator.

#### 6. `src/components/settings/CardTypeSection.tsx` (288 lines)

A long form with multiple concurrent edit states (renaming, color-picker-open index, pending confirm). Repeats the `${tc.glass} rounded-md border … px-2 py-1` pattern in at least three places.

**Direction**:

- Extract `CardTypeEditorRow` (one row = label + color swatch + edit controls)
- Extract `ColorPickerPopover` (currently inlined inside the `.map`)
- Collapse the repeated input-chrome class string into a local helper or a new `tc` composite

---

### Tier 3 — Small, mechanical cleanups

One-sitting jobs. Good warmups before tackling Tier 1.

- **Consolidate magic numbers** into a new `src/constants/behavior.ts`:
  - `MAX_UNDO_HISTORY = 50` (currently in `useUndoableState.ts` default **and** hardcoded again in `BoardProvider.tsx`)
  - `SEARCH_FUZZY_THRESHOLD = 0.4` (hardcoded in `useCardSearch.ts`)
  - `SWIPE_THRESHOLD_PX = 50` (hardcoded in `useSwipeNavigation.ts`)
  - `SKELETON_DELAY_MS = 100` (hardcoded in `AppLoader.tsx`)
  - `WRITE_DEBOUNCE_MS` already lives at the top of `db.ts` — move it here for consistency
- **Keyboard-shortcut abstraction**: `useUndoRedoKeyboard` and the command-palette `Cmd+K` listener share the same `addEventListener` / `removeEventListener` shape. Extract `useKeyboardShortcut(matcher, handler)` in `src/hooks/`.

---

## Explicitly Out of Scope

Opportunities that were evaluated and rejected:

- **"Migrate inline `dark:` patterns to `tc`"** — already done. The canonical class pattern appears exactly once in the codebase (the token definition site).
- **"Remove unused utilities (`boardMetrics`, `cycleTime`, `checklistStats`, `toggleMarkdownCheckbox`)"** — all four are used in non-test code.
- **Modal boilerplate consolidation** — already well-factored via shared `Modal.tsx` + `ModalHeader.tsx`.
- **Storage-access abstraction** — already centralized through `db.ts`; splitting it (Tier 2 #4) is a reorg for readability, not a new abstraction.
- **Barrel exports for `src/utils/`, `src/constants/`, `src/board/`** — low-value churn; relative imports work, and barrels complicate tree-shaking. Skip unless a concrete pain point appears.
- **Test coverage expansion for `ThemeSection`, `DataSection`, `BoardSettingsSection`** — worthwhile, but orthogonal to refactoring. Track separately.

---

## Recommended Starting Point

For a single highest-leverage pick: **start with Tier 1 #1 (`useBoardMutations.ts`)**. It's the largest file, the most coupled, and the split has clear mechanical seams. Pair it with Tier 3 (`constants/behavior.ts`) as a 15-minute warmup in the same branch.

A reasonable order if tackling several:

1. Tier 3 cleanups (magic numbers) — warmup
2. Tier 1 #1 `useBoardMutations` split — biggest structural win
3. Tier 1 #3 `Column.tsx` subcomponent extraction — visible code-quality improvement
4. Tier 1 #2 `Board.tsx` mobile/desktop split — builds on the Column cleanup
5. Tier 2 items as time allows

---

## Critical Files (reference)

| File                                          | Lines | Role                                                   |
| --------------------------------------------- | ----- | ------------------------------------------------------ |
| `src/board/useBoardMutations.ts`              | 458   | All board mutation callbacks                           |
| `src/components/CalendarView.tsx`             | 432   | Monthly/weekly calendar view                           |
| `src/utils/db.ts`                             | 407   | IndexedDB persistence                                  |
| `src/theme/ThemeProvider.tsx`                 | 353   | Theme + density + preferences context                  |
| `src/components/settings/CardTypeSection.tsx` | 288   | Card-type preset editor                                |
| `src/components/board/Board.tsx`              | 280   | Main board orchestrator                                |
| `src/utils/importBoard.ts`                    | 267   | Versioned import with migrations                       |
| `src/components/ListView.tsx`                 | 266   | List/table view                                        |
| `src/components/board/Column.tsx`             | 259   | Column layout + controls                               |
| `src/board/BoardProvider.tsx`                 | 254   | Board context composition + persistence                |
| `src/components/CommandPalette.tsx`           | 247   | `Cmd+K` palette                                        |
| `src/components/ArchiveModal.tsx`             | 246   | Archive browser                                        |
| `src/utils/dragUtils.ts`                      | 211   | Shared DnD helpers (duplicates `columnHistory` append) |

Utilities / hooks worth reusing during any of the above refactors:

- `src/hooks/useInlineEdit.ts` — already used by three callers; reuse for `ColumnTitleEdit`.
- `src/theme/classNames.ts` — the `tc` tokens/composites; extend rather than re-inline.
- `src/components/Modal.tsx` + `ModalHeader.tsx` — reuse for any new modal-like extraction.
- `src/components/icons/` (barrel export) — home for any inline SVGs lifted during view refactors.

---

## Verification

None of these refactors change behavior, so validation is mostly a correctness check. For any Tier 1 or Tier 2 change:

1. `npm run static-checks` — format + lint + knip + type-check + unit tests + build.
2. `npm run e2e` — Playwright across Chromium / Firefox / WebKit; drag-and-drop regressions are the biggest risk.
3. `npm run e2e:visual` — confirm no unintentional visual diffs when component class strings move.
4. Spot-check in `npm run dev`:
   - Drag a card across columns, within a column, and back — confirm `columnHistory` still records each transition (the Analytics modal shows cycle times).
   - Trigger undo/redo (`Cmd+Z` / `Cmd+Shift+Z`) after several mutations — confirm history is intact.
   - Mobile width (≤640px) — swipe navigation, tap-to-open card detail, and column tabs still work.
5. Export the board, clear it, re-import — confirm the import path still accepts the current export shape.

For Tier 3 magic-number moves, `npm run type:check` + `npm run test:run` is sufficient.
