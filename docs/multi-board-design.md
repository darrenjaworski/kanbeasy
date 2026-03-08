# Multiple Boards — Design Document

## Overview

Add support for multiple boards, allowing users to maintain separate kanban boards for different contexts (e.g., personal tasks, work projects). Each board is fully isolated with its own columns, cards, archive, card types, view mode, and undo/redo history.

## Data Model

### New Types

```typescript
// Lightweight metadata stored in the board index
interface BoardMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// Small index object — always loaded in memory
interface BoardIndex {
  boards: BoardMeta[];
  activeBoardId: string;
  nextCardNumber: number; // global counter across all boards
}
```

### BoardState Changes

`BoardState` gains per-board card type configuration and view mode:

```typescript
interface BoardState {
  columns: Column[];
  archive: ArchivedCard[];
  // NEW — per-board card types (moved from ThemeProvider)
  cardTypes: CardType[];
  cardTypePresetId: string;
  defaultCardTypeId: string | null;
  // NEW — per-board view mode (moved from ThemeProvider)
  viewMode: ViewMode; // "board" | "list" | "calendar"
}
```

Card numbering remains global — a single counter shared across all boards. This ensures card numbers are unique system-wide, which avoids confusion if cross-board features (move card between boards) are added later.

### Existing Card Fields (unchanged)

Cards already carry `dueDate`, `description`, `cardTypeLabel`, `cardTypeColor`, `number`, and `columnHistory` fields. These travel with the board data and require no structural changes for multi-board support.

## Storage Strategy

Split storage to avoid hitting localStorage limits and improve performance:

| Key                   | Contents                                                  | Size      |
| --------------------- | --------------------------------------------------------- | --------- |
| `kanbeasy:boardIndex` | `BoardIndex` (board list + active ID + card counter)      | Small     |
| `kanbeasy:board:<id>` | `BoardState` (columns + archive + card types + view mode) | Per-board |

Benefits:

- Switching boards only deserializes one board's data
- Individual boards can grow independently without bloating a single key
- Easier to reason about data lifecycle (delete board = delete one key)

### What stays global

These are user preferences and remain in their existing storage keys:

- Theme ID and preference (light/dark/system)
- Card density
- Column resizing enabled
- Delete column warning
- Owl mode
- Compact header
- Keyboard shortcuts enabled
- Settings section collapse state
- Welcome dismissed flag

### What moves to per-board

These move from ThemeProvider into BoardState:

- `cardTypes` — type definitions
- `cardTypePresetId` — which preset is active
- `defaultCardTypeId` — default type for new cards
- `viewMode` — board/list/calendar (each board remembers its own view)

This allows a personal board to use "Personal" card types while a work board uses "Development" types. It also means switching to a board restores whatever view mode (board, list, calendar) the user was last using on that board.

## Provider Architecture

```
ThemeProvider           (global: theme, density, column resize, owl, compact header, keyboard shortcuts)
  BoardsProvider        (NEW: board index, active board, CRUD operations)
    BoardProvider       (scoped: columns, archive, card types, view mode, undo/redo, search)
      ClipboardProvider
        App
```

### BoardsProvider API

```typescript
interface BoardsContextValue {
  boards: BoardMeta[];
  activeBoardId: string;
  createBoard: (title: string) => string; // returns new board ID
  deleteBoard: (id: string) => void;
  renameBoard: (id: string, title: string) => void;
  switchBoard: (id: string) => void;
  duplicateBoard: (id: string, title: string) => string;
  reorderBoards: (boards: BoardMeta[]) => void; // for drag-to-reorder tabs
}
```

### BoardProvider Changes

Minimal changes needed:

- Accept `boardId` prop (or read from BoardsContext)
- Load/save using `kanbeasy:board:<boardId>` instead of `kanbeasy:board`
- Own card type state (moved from ThemeProvider)
- Own view mode state (moved from ThemeProvider)
- Undo/redo history is already per-instance (resets naturally on board switch)
- Search state is already per-instance (`useCardSearch` runs inside `BoardProvider`)

### ThemeProvider Changes

Remove the following state, which moves into BoardProvider/BoardState:

- `cardTypes`, `setCardTypes`
- `cardTypePresetId`, `setCardTypePresetId`
- `defaultCardTypeId`, `setDefaultCardTypeId`
- `viewMode`, `setViewMode`

Also fix the existing gap: add `keyboardShortcutsEnabled` to the export/import settings object (currently missing from `exportBoard.ts` and `importBoard.ts`).

## UI Design

### Board Switcher — Tab Bar

A horizontal tab bar below the header showing board names with a "+" button to create new boards. This fits kanbeasy's minimal aesthetic while keeping the active board visible at a glance.

```
+---------------------------------------------------------------+
| [logo] kanbeasy          [search] [analytics] [archive] [gear]|
+---------------------------------------------------------------+
| [Personal] [Work Project] [Side Project] [+]                  |
+---------------------------------------------------------------+
| |  To Do        |  In Progress  |  Done          |            |
| |  [card]       |  [card]       |  [card]        |            |
| |  [card]       |  [card]       |                |            |
```

Tab bar behavior:

- Active tab is visually highlighted (accent color underline or background)
- Tabs are horizontally scrollable if they overflow
- Right-click or long-press a tab for rename/delete/duplicate context menu
- Drag tabs to reorder boards (future enhancement)
- "+" button opens an inline input for the new board name
- Tab bar uses the `tc` class helper for consistent theme styling

### Keyboard Navigation & Shortcuts

- `Cmd+Shift+[` / `Cmd+Shift+]` — switch to previous/next board (like browser tabs)
- Arrow keys navigate between tabs when the tab bar is focused
- Tab bar items receive `role="tab"`, the container gets `role="tablist"`, and the board content area gets `role="tabpanel"` with `aria-labelledby` pointing to the active tab

### Command Palette Integration

The existing command palette (`Cmd+K`) in `CommandPalette.tsx` gains board-related actions:

- "Switch to [Board Name]" — one entry per board (excluding the active board)
- "Create new board" — opens the new board flow
- "Rename current board" — inline rename

These actions appear alongside existing actions (add card, add column, switch view, etc.). The command palette already filters by query text, so board names are searchable.

The previously proposed `Cmd+B` shortcut is **removed** in favor of using `Cmd+K` with board actions — this avoids adding yet another shortcut and leverages the existing command palette UX. The `Cmd+Shift+[`/`]` shortcuts remain for quick prev/next navigation.

### Board Management in Settings

The Settings modal gets a new "Boards" section (between "Preferences" and "Data"):

- List all boards with rename/delete actions
- Create new board button
- No board-level settings here initially (card types are edited in the existing card type section, which now applies to the active board)
- A label indicating which board is active

### Empty State

When creating a new board, offer two options:

- **Blank board** — no columns, no cards
- **Starter board** — seeded with To Do / In Progress / Done columns (current welcome flow)

### Delete Board Safeguards

- Cannot delete the last remaining board
- Confirmation dialog using the existing `ConfirmDialog` component: "Delete [board name]? This will permanently remove all columns, cards, and archived cards in this board."
- No undo for board deletion (too large for undo stack)

## Migration Path

For existing users upgrading from single-board to multi-board:

1. On app load, check for `kanbeasy:boardIndex`
2. If missing, detect existing `kanbeasy:board` key
3. Create a `BoardIndex` with one entry: `{ id: "default", title: "My Board" }`
4. Copy existing board data from `kanbeasy:board` to `kanbeasy:board:default`
5. Move card type settings from ThemeProvider keys into the board state:
   - Read `kanbeasy:ticketTypePreset`, `kanbeasy:ticketTypes`, `kanbeasy:defaultTicketType`
   - Write them into the board state under `cardTypePresetId`, `cardTypes`, `defaultCardTypeId`
6. Move `kanbeasy:viewMode` into the board state
7. Move the persisted `kanbeasy:nextCardNumber` value into the board index
8. Clean up migrated keys from localStorage (`kanbeasy:board`, `kanbeasy:ticketTypePreset`, `kanbeasy:ticketTypes`, `kanbeasy:defaultTicketType`, `kanbeasy:viewMode`, `kanbeasy:nextCardNumber`)

This is transparent to the user — their existing board appears as "My Board" and everything works as before.

### Migration Edge Cases

- **Missing card type keys**: If the user never customized card types, the storage keys will not exist. Fall back to the default preset (same as current behavior in `ThemeProvider.tsx`).
- **Corrupted board data**: If `kanbeasy:board` exists but cannot be parsed, create a fresh default board (same as `createInitialBoard()` in `BoardProvider.tsx`).
- **Multiple tabs open during migration**: The first tab to load performs the migration and removes old keys. Subsequent tabs will find the `boardIndex` already exists and skip migration. Add a `try/catch` around the entire migration to prevent partial state.
- **Owl assistant state**: Owl mode is global and stays in its existing key. No migration needed.
- **Settings section collapse state** (`kanbeasy:settingsSections`): Global, no migration needed.
- **Welcome dismissed flag** (`hasSeenWelcome`): Global, no migration needed. New boards do not re-trigger the welcome modal.

## Export/Import

Bump export format version from 9 to 10.

### Export Modes

- **Single board** (default) — exports the active board only, including card types, view mode, archive, and global settings. Structure is similar to today but with card types and view mode included in the board data block.
- **Full workspace** — exports all boards + board index + global settings (for backup/device transfer)

### Export Data Shape (v10)

```typescript
interface ExportDataV10 {
  version: 10;
  exportedAt: string;
  mode: "single-board" | "workspace";
  // Present in single-board mode
  board?: {
    meta: BoardMeta;
    state: BoardState; // includes columns, archive, cardTypes, viewMode
  };
  // Present in workspace mode
  workspace?: {
    boardIndex: BoardIndex;
    boards: Array<{ meta: BoardMeta; state: BoardState }>;
  };
  settings: {
    theme: string;
    themePreference: string;
    cardDensity: string;
    columnResizingEnabled: string;
    deleteColumnWarning: string;
    owlModeEnabled: string;
    compactHeader: string;
    keyboardShortcutsEnabled: string; // NEW — currently missing from export
    // viewMode and cardType* fields are removed from settings (now per-board)
  };
}
```

### Import Handling

- **Version <= 9 imports**: treated as a single board. Card types pulled from the settings object. View mode pulled from settings. Imported as a new board or replaces active board (user choice dialog).
- **Version 10 single-board import**: imported as a new board or replaces active board (user choice)
- **Version 10 workspace import**: replaces all boards and settings (with confirmation dialog)

### Export of a Single Board for Sharing

Users may want to share a specific board. The single-board export includes everything needed to reconstruct that board on another device or user's instance: columns, cards (with descriptions, due dates, checklists, card type snapshots), archive, and card type definitions. The recipient imports it as a new board.

## Scope of Changes

### New Files

- `src/boards/BoardsProvider.tsx` — context provider for board index
- `src/boards/BoardsContext.ts` — context definition
- `src/boards/useBoards.ts` — hook to consume boards context
- `src/boards/useBoardsStorage.ts` — localStorage operations for board index
- `src/boards/types.ts` — BoardMeta, BoardIndex types
- `src/boards/migration.ts` — single-board to multi-board migration logic
- `src/components/BoardTabs.tsx` — tab bar UI component
- `src/boards/__tests__/BoardsProvider.test.tsx` — unit tests
- `src/boards/__tests__/migration.test.ts` — migration unit tests
- `tests-e2e/multi-board.spec.ts` — e2e tests for multi-board flows

### Modified Files

- `src/board/BoardProvider.tsx` — parameterize storage key, own card types and view mode
- `src/board/types.ts` — expand `BoardState` with card type and view mode fields
- `src/theme/ThemeProvider.tsx` — remove card type state and view mode
- `src/theme/types.ts` — remove card type and view mode fields from `ThemeContextValue`
- `src/main.tsx` — add BoardsProvider to provider stack
- `src/components/Header.tsx` — add board tab bar below header
- `src/components/CommandPalette.tsx` — add board-switching actions
- `src/components/ViewToggle.tsx` — read view mode from board context instead of theme
- `src/components/settings/CardTypeSection.tsx` — read card types from board context instead of theme
- `src/components/settings/SettingsModal.tsx` — add "Boards" section
- `src/components/settings/DataSection.tsx` — update export/import for multi-board, add export mode toggle
- `src/utils/exportBoard.ts` — version bump to 10, multi-board support, add `keyboardShortcutsEnabled`
- `src/utils/importBoard.ts` — migration for v9 -> v10, multi-board import, handle `keyboardShortcutsEnabled`
- `src/constants/storage.ts` — add new storage key patterns (`BOARD_INDEX`, board key factory)

### Unchanged

All card/column components, mutations, drag-and-drop, search, analytics, calendar view, list view, undo/redo, checklist, markdown preview, due dates, owl assistant — these are already scoped to the current board's state and require no changes.

## Accessibility

### Tab Bar

- Container: `role="tablist"`, `aria-label="Board tabs"`
- Each tab: `role="tab"`, `aria-selected="true|false"`, `tabindex="0|-1"` (roving tabindex)
- Board content: `role="tabpanel"`, `aria-labelledby` referencing the active tab's ID
- Arrow keys move focus between tabs (left/right)
- Home/End jump to first/last tab
- Enter/Space activates a tab
- Delete key on a tab triggers the delete confirmation (with safeguard for last board)

### Confirmation Dialogs

- Use the existing `ConfirmDialog` component which already handles focus trapping and `role="alertdialog"`

### Screen Reader Announcements

- When switching boards, use an `aria-live="polite"` region to announce "Switched to [board name]"
- When creating/deleting boards, announce the result similarly

## Performance Considerations

### localStorage Limits

- The ~5MB localStorage limit is shared across all boards
- With per-board storage keys, each board's data is independently sized
- A board with 100 cards, descriptions, and archive data might be 50-100KB
- This comfortably allows 20-50 boards before approaching limits
- The "localStorage usage warning" roadmap item should be prioritized alongside multi-board to warn users proactively
- Consider showing per-board storage usage in the Settings > Boards section

### Lazy Loading

- Only the active board's data is deserialized and held in React state
- The board index (lightweight metadata) is always in memory
- Switching boards triggers a single `JSON.parse` of the target board's storage key
- The previous board's React state is unmounted (undo/redo history is discarded)

### Board Switching Performance

- Keep `BoardProvider` keyed by `boardId` so React fully unmounts/remounts: `<BoardProvider key={activeBoardId}>`
- This gives a clean slate for undo/redo, search, and drag-and-drop state
- The cost is a brief re-render on switch, which should be negligible for typical board sizes

## Testing Plan

### Unit Tests

#### BoardsProvider (`src/boards/__tests__/BoardsProvider.test.tsx`)

- Creates initial board index when none exists
- Loads existing board index from localStorage
- `createBoard` adds a new board and persists
- `deleteBoard` removes board and its storage key, switches to another board
- `deleteBoard` on last board is a no-op or throws
- `renameBoard` updates title and `updatedAt`
- `switchBoard` updates `activeBoardId` and persists
- `duplicateBoard` creates a deep copy with new ID and incremented title
- `reorderBoards` persists new order

#### Migration (`src/boards/__tests__/migration.test.ts`)

- Migrates single-board user to board index with one entry
- Moves card types from theme storage to board state
- Moves view mode from theme storage to board state
- Moves next card number to board index
- Cleans up old storage keys after migration
- Handles missing card type keys gracefully (uses defaults)
- Handles corrupted board data (creates fresh board)
- Handles already-migrated state (no-op)

#### Export/Import

- v9 import produces a valid single board with card types extracted from settings
- v10 single-board import produces correct board state
- v10 workspace import restores all boards and index
- Round-trip: export then import produces identical state
- Version validation rejects unsupported versions (> 10)

#### BoardProvider Changes

- Loads board data from `kanbeasy:board:<id>` key
- Saves board data to correct key on state change
- Card types are accessible from board context
- View mode is accessible from board context

### E2E Tests (`tests-e2e/multi-board.spec.ts`)

#### Board CRUD

- Create a new board via "+" tab button
- Board appears in tab bar
- Switch between boards and verify isolation (cards from board A don't appear in board B)
- Rename a board via right-click context menu
- Delete a board with confirmation
- Cannot delete the last board (button disabled or warning)
- Duplicate a board and verify cards are copied

#### Data Isolation

- Add cards to board A, switch to board B (empty), switch back to board A — cards persist
- Card types on board A differ from board B
- View mode per board: set calendar on board A, board view on board B, switching preserves each
- Undo/redo is scoped to active board (undo on board B does not affect board A)
- Search is scoped to active board

#### Migration

- Pre-populate localStorage with v9 single-board data, load app, verify migration creates board index and board appears as "My Board"

#### Export/Import

- Export single board, import on fresh app, verify board appears
- Export workspace with 2 boards, import and verify both boards restored

#### Command Palette

- Open `Cmd+K`, type board name, select to switch boards
- "Create new board" action works from palette

#### Keyboard Navigation

- `Cmd+Shift+[` / `Cmd+Shift+]` cycles through boards
- Arrow keys navigate tab bar when focused
- Tab/Shift+Tab moves focus in and out of tab bar

### Visual Regression

- Add a multi-board snapshot to `tests-e2e/visual-regression.spec.ts` showing the tab bar with 2-3 boards

## Future Enhancements (Out of Scope for v1)

1. **Board limit** — should there be a max number of boards? localStorage is ~5MB total. Could add a `localStorage usage warning` (already on the roadmap) to cover this.
2. **Cross-board card move** — future feature to move a card from one board to another. Not in scope for v1 but the global card numbering supports it.
3. **Board ordering** — tab order could be by creation date initially, drag-to-reorder as a follow-up (the `reorderBoards` API is included for this).
4. **Board templates** — predefined column layouts (Kanban, Scrum Sprint, Weekly Planner) when creating a new board. Currently we offer blank vs starter; templates would extend this.
5. **Board color/icon** — allow each board to have a color dot or emoji in the tab bar for quick visual identification. Add optional `color` and `icon` fields to `BoardMeta`.
6. **Board-level analytics** — the analytics modal already computes metrics for the active board. A future cross-board dashboard could compare throughput across boards.
7. **Board sharing** — the single-board export already enables this. A future enhancement could generate a shareable URL (e.g., via a paste service or data URI).

## Implementation Sequence

Recommended order to minimize risk and enable incremental testing:

1. **Fix existing export gap**: Add `keyboardShortcutsEnabled` to `exportBoard.ts` and `importBoard.ts` (small, independent fix)
2. **Create `src/boards/` module**: Types, context, storage utilities, migration logic — all unit-tested before integration
3. **Move card types and view mode from ThemeProvider to BoardProvider**: Update all consumers (`CardTypeSection`, `ViewToggle`, `CommandPalette`, `DataSection`)
4. **Wire up BoardsProvider in `main.tsx`**: Migration runs on first load
5. **Build the tab bar UI** (`BoardTabs.tsx`) and integrate into `Header.tsx`
6. **Add command palette board actions**
7. **Update export/import for v10**
8. **Add keyboard shortcuts** (`Cmd+Shift+[`/`]`, tab bar arrow keys)
9. **Add e2e tests and visual regression snapshots**
10. **Polish**: Accessibility audit, performance testing with many boards, localStorage usage display

## Open Questions

1. **Board-specific view mode** — recommended yes (per-board), documented above. Confirm before implementing.
2. **Board limit** — defer to localStorage usage warning feature?
3. **Board templates** — include in v1 or defer?
