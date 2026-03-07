# Multiple Boards — Design Document

## Overview

Add support for multiple boards, allowing users to maintain separate kanban boards for different contexts (e.g., personal tasks, work projects). Each board is fully isolated with its own columns, cards, archive, card types, and undo/redo history.

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

`BoardState` gains per-board card type configuration:

```typescript
interface BoardState {
  columns: Column[];
  archive: ArchivedCard[];
  // NEW — per-board card types
  cardTypes: CardType[];
  cardTypePresetId: string;
  defaultCardTypeId: string | null;
}
```

Card numbering remains global — a single counter shared across all boards. This ensures card numbers are unique system-wide, which avoids confusion if cross-board features (move card between boards) are added later.

## Storage Strategy

Split storage to avoid hitting localStorage limits and improve performance:

| Key                   | Contents                                             | Size      |
| --------------------- | ---------------------------------------------------- | --------- |
| `kanbeasy:boardIndex` | `BoardIndex` (board list + active ID + card counter) | Small     |
| `kanbeasy:board:<id>` | `BoardState` (columns + archive + card types)        | Per-board |

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
- View mode (board/list/calendar)
- Compact header
- Settings section collapse state
- Welcome dismissed flag

### What moves to per-board

These move from ThemeProvider into BoardState:

- `cardTypes` — type definitions
- `cardTypePresetId` — which preset is active
- `defaultCardTypeId` — default type for new cards

This allows a personal board to use "Personal" card types while a work board uses "Development" types.

## Provider Architecture

```
ThemeProvider           (global: theme, density, column resize, owl, view mode)
  BoardsProvider        (NEW: board index, active board, CRUD operations)
    BoardProvider       (scoped: columns, archive, card types, undo/redo, search)
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
}
```

### BoardProvider Changes

Minimal changes needed:

- Accept `boardId` prop (or read from BoardsContext)
- Load/save using `kanbeasy:board:<boardId>` instead of `kanbeasy:board`
- Own card type state (moved from ThemeProvider)
- Undo/redo history is already per-instance (resets naturally on board switch)

### ThemeProvider Changes

Remove card type state (`cardTypes`, `cardTypePresetId`, `defaultCardTypeId`) — these move into BoardProvider/BoardState.

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

### Keyboard Shortcut

- `Cmd+B` / `Ctrl+B` — open a quick board switcher (modal or popover listing boards)
- `Cmd+Shift+[` / `Cmd+Shift+]` — switch to previous/next board (like browser tabs)

### Board Management in Settings

The Settings modal gets a new "Boards" section:

- List all boards with rename/delete actions
- Create new board button
- No board-level settings here initially (card types are edited in the existing card type section, which now applies to the active board)

### Empty State

When creating a new board, offer two options:

- **Blank board** — no columns, no cards
- **Starter board** — seeded with To Do / In Progress / Done columns (current welcome flow)

### Delete Board Safeguards

- Cannot delete the last remaining board
- Confirmation dialog: "Delete [board name]? This will permanently remove all columns, cards, and archived cards in this board."
- No undo for board deletion (too large for undo stack)

## Migration Path

For existing users upgrading from single-board to multi-board:

1. On app load, check for `kanbeasy:boardIndex`
2. If missing, detect existing `kanbeasy:board` key
3. Create a `BoardIndex` with one entry: `{ id: "default", title: "My Board" }`
4. Rename storage: `kanbeasy:board` -> `kanbeasy:board:default`
5. Move card type settings from ThemeProvider keys into the board state
6. Clean up old card type keys from localStorage

This is transparent to the user — their existing board appears as "My Board" and everything works as before.

## Export/Import

Bump export format version from 8 to 9.

### Export Modes

- **Single board** (default) — exports the active board only, same structure as today but with card types included in board data
- **Full workspace** — exports all boards + global settings (for backup/device transfer)

### Import Handling

- Version <= 8 imports: treated as a single board, card types pulled from settings object
- Version 9 single-board import: imported as a new board or replaces active board (user choice)
- Version 9 workspace import: replaces all boards and settings (with confirmation)

## Scope of Changes

### New Files

- `src/boards/BoardsProvider.tsx` — context provider for board index
- `src/boards/useBoardsStorage.ts` — localStorage operations for board index
- `src/boards/types.ts` — BoardMeta, BoardIndex types
- `src/components/BoardTabs.tsx` — tab bar UI component

### Modified Files

- `src/board/BoardProvider.tsx` — parameterize storage key, own card types
- `src/theme/ThemeProvider.tsx` — remove card type state
- `src/main.tsx` — add BoardsProvider to provider stack
- `src/components/Header.tsx` — add board tab bar or selector
- `src/components/settings/CardTypeSection.tsx` — read card types from board context
- `src/utils/exportBoard.ts` — version bump, multi-board support
- `src/utils/importBoard.ts` — migration for v8 -> v9, multi-board import
- `src/constants/storage.ts` — add new storage key patterns

### Unchanged

All card/column components, mutations, drag-and-drop, search, analytics, calendar view, list view, undo/redo — these are already scoped to the current board's state and require no changes.

## Open Questions

1. **Board limit** — should there be a max number of boards? localStorage is ~5MB total. Could add a `localStorage usage warning` (already on the roadmap) to cover this.
2. **Cross-board card move** — future feature to move a card from one board to another. Not in scope for v1 but the global card numbering supports it.
3. **Board-specific view mode** — should each board remember its own view mode (board/list/calendar) or is that global? Leaning global for simplicity.
4. **Board ordering** — tab order could be by creation date initially, drag-to-reorder as a follow-up.
