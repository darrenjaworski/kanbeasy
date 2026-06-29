<!-- refreshed: 2026-06-29 -->

# Architecture

**Analysis Date:** 2026-06-29

## System Overview

```text
┌──────────────────────────────────────────────────────────────┐
│                   React 19 Application                       │
│  (main.tsx → App.tsx with multiple view modes)               │
├──────────────────────────────────────────────────────────────┤
│         AppLoader │ ThemeProvider │ BoardProvider │ Clipboard │
├────────────────────┬────────────────┬──────────────────────────┤
│  UI Layer          │  State Layer   │  Persistence Layer       │
│ ┌────────────────┐ │ ┌────────────┐ │ ┌──────────────────────┐ │
│ │ Components     │ │ │ Context    │ │ │ IndexedDB + Cache   │ │
│ │ - Board View   │ │ │ Providers  │ │ │ + localStorage      │ │
│ │ - List View    │ │ │            │ │ │ migration           │ │
│ │ - Calendar     │ │ │ Mutations  │ │ │ + Host Bridge       │ │
│ │ - Settings     │ │ │ Hooks      │ │ │ (MCP)               │ │
│ │ - Analytics    │ │ │            │ │ │                     │ │
│ │ - Archive      │ │ │ Undo/Redo  │ │ │                     │ │
│ └────────────────┘ │ └────────────┘ │ └──────────────────────┘ │
│                    │                 │                          │
│ Drag & Drop        │ Theme System    │ Search (Fuse.js)         │
│ (@dnd-kit)         │ Card Density    │ Metrics Calculation      │
│ @dnd-kit           │ 12 Themes       │ Export/Import            │
│                    │ Card Types      │                          │
└──────────────────────────────────────────────────────────────┘
         │                     │                      │
         ▼                     ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│  Domain Models & Utilities                                   │
│  - Types (Card, Column, BoardState)                          │
│  - Constants (storage keys, feature flags, themes)           │
│  - Utils (metrics, export/import, formatters)                │
│  - CSS (Tailwind v4, custom properties)                      │
└──────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component         | Responsibility                                                       | File                                          |
| ----------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| AppLoader         | Initializes IndexedDB and host bridge before rendering               | `src/components/AppLoader.tsx`                |
| ThemeProvider     | Manages theme, view mode, card density, keyboard settings            | `src/theme/ThemeProvider.tsx`                 |
| BoardProvider     | Manages board state, mutations, search, undo/redo                    | `src/board/BoardProvider.tsx`                 |
| ClipboardProvider | Manages card clipboard for copy/paste operations                     | `src/board/ClipboardProvider.tsx`             |
| App               | Main layout: renders Header, Board/List/Calendar, BottomBar, modals  | `src/App.tsx`                                 |
| Board             | Routes to DesktopBoard or MobileBoard, manages card detail modal     | `src/components/board/Board.tsx`              |
| DesktopBoard      | Horizontal column layout with drag-and-drop via @dnd-kit             | `src/components/board/DesktopBoard.tsx`       |
| MobileBoard       | Single active column view with tabs                                  | `src/components/board/MobileBoard.tsx`        |
| Column            | Single column rendering with cards, add button, title edit, resize   | `src/components/board/Column.tsx`             |
| CardDetailModal   | Full card editor (title, description, type, due date, checklist)     | `src/components/board/CardDetailModal.tsx`    |
| SettingsModal     | Theme, density, keyboard, card types, export/import, data management | `src/components/settings/SettingsModal.tsx`   |
| AnalyticsModal    | Board metrics: cycle time, throughput, per-card analytics            | `src/components/analytics/AnalyticsModal.tsx` |
| ArchiveModal      | View, restore, and permanently delete archived cards                 | `src/components/archive/ArchiveModal.tsx`     |
| ListView          | Table-based view of all cards with filtering/sorting                 | `src/components/ListView.tsx`                 |
| CalendarView      | Calendar-based view of cards by due date                             | `src/components/CalendarView.tsx`             |

## Pattern Overview

**Overall:** Context-driven state management with composable mutation hooks, generic undo/redo history, and drag-and-drop orchestration.

**Key Characteristics:**

- **No Redux/Zustand**: State is held in React Context with manual composition of mutation hooks
- **Immutable state updates**: All mutations create new object references (required for undo/redo detection)
- **Generic undo/redo**: `useUndoableState<T>` maintains `{ past: T[], present: T, future: T[] }` history
- **Lazy mutations**: Mutation hooks are composed on-demand via `useBoardMutations` → `useColumnMutations`, `useCardMutations`, etc.
- **Modular persistence**: IndexedDB + localStorage migration + host mode (MCP) abstraction via `db.ts`

## Layers

**AppLoader Layer:**

- Purpose: Bootstrap application by opening IndexedDB and requesting initial state from host (if in host mode)
- Location: `src/components/AppLoader.tsx`
- Contains: Async initialization logic, suspense boundary
- Depends on: `src/utils/db.ts` (openDatabase)
- Used by: `main.tsx` (wraps everything)

**Theme Layer:**

- Purpose: Manage light/dark modes, theme colors, card density, view modes, keyboard shortcuts, card types
- Location: `src/theme/` (ThemeProvider, useTheme, themes.ts, useStoredSetting.ts)
- Contains: 12 predefined themes (6 light, 6 dark), system preference detection, CSS custom properties
- Depends on: `src/utils/db.ts` (kvGet/kvSet), localStorage fallback
- Used by: All UI components, preference-driven rendering

**Board State Layer:**

- Purpose: Manage kanban board state, columns, cards, mutations, search, undo/redo, archive
- Location: `src/board/` (BoardProvider, useBoard, useBoardMutations, useCardSearch, useUndoableState)
- Contains: Context provider, mutation hooks, type definitions, validation, migration
- Depends on: `src/utils/db.ts` (saveBoard, subscribeToExternalBoardChange), host bridge
- Used by: Board, components, analytics, and views

**Clipboard Layer:**

- Purpose: Manage clipboard state for card copy/paste operations
- Location: `src/board/ClipboardProvider.tsx`, `src/board/useClipboard.ts`
- Contains: Clipboard context, copy/paste mutations
- Depends on: BoardProvider (for card data)
- Used by: Column, card detail modal

**Persistence Layer:**

- Purpose: Abstract storage backend (IndexedDB, localStorage fallback, host mode via MCP)
- Location: `src/utils/db.ts`
- Contains: Database initialization, caching, debounced writes, host bridge messaging, localStorage migration
- Depends on: None (low-level)
- Used by: BoardProvider, ThemeProvider, AppLoader

**UI Component Layer:**

- Purpose: Render kanban board, modals, settings, analytics, archive
- Location: `src/components/` (board/, settings/, analytics/, archive/, shared/, icons/)
- Contains: React components organized by feature domain
- Depends on: Context hooks (useBoard, useTheme, useClipboard), @dnd-kit for drag-and-drop
- Used by: App.tsx

**Utility Layer:**

- Purpose: Cross-cutting logic: search, metrics, export/import, formatting, drag utilities
- Location: `src/utils/` (boardMetrics, cycleTime, exportBoard, importBoard, formatCardId, etc.)
- Contains: Pure functions, Fuse.js fuzzy search, analytics calculations, data formatters
- Depends on: Type definitions only
- Used by: Components, hooks, and board provider

## Data Flow

### Primary Request Path (User adds a card to "To Do" column)

1. User clicks "+ Add" in a column (`src/components/board/Column.tsx`)
2. Component calls `useBoard().addCard(columnId, title)` from `src/board/useBoardMutations.ts`
3. `addCard` mutation creates new Card object, finds Column, returns updated BoardState
4. `useBoardMutations` calls `setState(newState)` which triggers `useUndoableState`
5. `useUndoableState` pushes previous state to history.past, updates history.present
6. BoardProvider's dependency on `state` triggers `saveBoard(state)` in `useEffect`
7. `saveBoard` calls `scheduleBoardWrite()` which debounces IndexedDB write by 500ms
8. If in host mode, `postToHost('host:saveBoard', { state })` pushes to MCP extension
9. UI re-renders from new context value; new column appears in Column component

### Search Flow

1. User types in SearchInput (`src/components/SearchInput.tsx`)
2. Component calls `setSearchQuery(query)` from `useBoard()`
3. BoardProvider's `useCardSearch` hook recalculates `matchingCardIds` via Fuse.js (threshold 0.4)
4. Cards with matching IDs are highlighted with blue ring class in CardList
5. Match count displayed in input: "3 matches"

### Undo/Redo Flow

1. User performs action (e.g., moves card to "Done")
2. Mutation hook calls `setState(newState)`
3. `useUndoableState.setState` updates history: pushes `present` to `past`, sets `newState` as `present`, clears `future`
4. Undo button becomes enabled (`canUndo` becomes true)
5. User presses Cmd+Z or clicks Undo
6. `useUndoableState.undo` pops from `past`, sets as `present`, pushes old `present` to `future`
7. UI re-renders; redo button becomes enabled

**State Management:**

- All state held in React Context (BoardContext, ThemeContext, ClipboardContext)
- Mutations return new object references (immutable)
- No-op detection: mutations that return same reference skip history and don't trigger effects
- External changes (from host/MCP) call `replaceState`, which clears undo/redo history to prevent echo

## Key Abstractions

**Card & Column Types:**

- Purpose: Represent kanban data model with rich metadata (timestamps, type IDs, due dates, column history)
- Examples: `src/board/types.ts` defines `Card`, `Column`, `BoardState`, `ArchivedCard`
- Pattern: Readonly types for immutability, snapshots (cardTypeLabel, cardTypeColor) for rendering after type deletion

**Theme System:**

- Purpose: Provide unified color and density management across app
- Examples: `src/theme/themes.ts` defines 12 themes; `src/theme/classNames.ts` exports `tc` object for class tokens
- Pattern: CSS custom properties (--color-bg, --color-surface, --color-text, --color-accent) applied to `<html>` element; Tailwind dark: prefix for opacity patterns

**Mutation Composition:**

- Purpose: Modular board mutations assembled on-demand
- Examples: `useBoardMutations` composes `useColumnMutations`, `useCardMutations`, `useCardTypeMutations`, `useArchiveMutations`
- Pattern: Each hook takes `setState` and returns an object of mutation functions; composed via object spread

**Undoable State:**

- Purpose: Generic undo/redo history management decoupled from domain logic
- Examples: `useUndoableState<BoardState>` in BoardProvider wraps board mutations
- Pattern: Maintains `{ past: T[], present: T, future: T[] }`; no-op detection skips history entries

**Drag Context:**

- Purpose: Encapsulate @dnd-kit drag-and-drop state and event handlers
- Examples: `useBoardDragAndDrop` in BoardProvider; handlers passed to DesktopBoard/MobileBoard
- Pattern: Separate active type ("card" | "column" | null) and active card; handlers coordinate moves and reorders via BoardState mutations

## Entry Points

**Web Entry:**

- Location: `index.html` → `src/main.tsx` → React root at `#root`
- Triggers: Page load
- Responsibilities: Render provider hierarchy, initialize app

**Component Entry:**

- Location: `src/App.tsx`
- Triggers: After AppLoader initializes database
- Responsibilities: Route between Board/List/Calendar views, render header/footer, manage command palette state

**Persistence Entry:**

- Location: `src/utils/db.ts` → `openDatabase()`
- Triggers: AppLoader on mount
- Responsibilities: Open IndexedDB, migrate from localStorage, subscribe to host messages

**State Entry:**

- Location: `src/board/BoardProvider.tsx` → `loadState()`
- Triggers: Provider initialization
- Responsibilities: Load board from cache (populated by AppLoader), migrate timestamps and card numbers

## Architectural Constraints

- **Threading:** Single-threaded event loop (browser). Debounced writes (500ms) prevent blocking on IndexedDB.
- **Global state:** Module-level caches in `db.ts` (kvCache, boardCache) are the authoritative runtime state; must be initialized by AppLoader before any board operations.
- **Circular imports:** Avoided via careful module organization; BoardProvider imports from `utils/db`, not vice versa.
- **History limit:** `MAX_UNDO_HISTORY` (50 by default) prevents memory bloat; older history entries are truncated.
- **Host mode:** When running as VS Code extension (isHostMode() true), all board saves post to host via postToHost(); external changes received via onHostMessage.
- **No cross-page sync:** Board state is single-instance per window; no SharedWorker or other cross-tab synchronization.

## Anti-Patterns

### Mutation objects returned directly instead of via immutable copy

**What happens:** Mutation hooks call setState with modified objects that share references with the previous state (e.g., mutating a card object directly, then calling setState with the same card reference in the column).

**Why it's wrong:** No-op detection and undo/redo history rely on reference equality (`next === prev.present`). Shared references cause mutations to not be recorded in history.

**Do this instead:** Always create new object references. In `useCardMutations.ts`, cards are created via `{ ...existingCard, updatedField: value }` and columns via spreading and reconstruction. Example at `src/board/useCardMutations.ts:updateCard` — it creates `newColumns` with spread, rebuilds the card, and ensures `setState` sees a new reference.

### Synchronous state reads during render

**What happens:** Components directly access context state during render and make decisions based on it without memoization, causing unnecessary re-renders when sibling state changes.

**Why it's wrong:** Context subscribers re-render when context value changes, even if only unrelated fields were updated. Without careful memoization of context value, the entire component tree re-renders on any board mutation.

**Do this instead:** BoardProvider memoizes the context value (see `useMemo` at line 232 in `BoardProvider.tsx`). Components destructure only fields they use (e.g., `const { columns, addColumn } = useBoard()` in Board.tsx).

### Storing UI state (detail modal open/close) in global context

**What happens:** CardDetailModal open state is lifted to Board.tsx and passed via props, not stored in BoardContext.

**Why it's wrong:** UI state (which modal is open) should not persist in board state or be undoable. If stored in global context, undo would close the modal unexpectedly.

**Do this instead:** UI state lives in local React state (`useState`) at the component that needs it (Board.tsx for detail modal, App.tsx for command palette). Only domain data (board, cards, settings) goes in global context.

## Error Handling

**Strategy:** Graceful degradation with console warnings in development, silent fallback to in-memory state in production.

**Patterns:**

- If IndexedDB is unavailable, fall back to in-memory cache and localStorage migration (see `src/utils/db.ts` line 226).
- If host bridge fails to post, log in dev mode and continue with local state (see `postToHost` in `src/utils/hostBridge.ts`).
- If a mutation receives an invalid card ID, it's a no-op; the card is not found and state is unchanged.
- Type validation via `isCard`, `isColumn`, `isArchivedCard` guards in `src/board/validation.ts` prevent loading corrupted data.

## Cross-Cutting Concerns

**Logging:** Sparse in production; development logs in `db.ts` and validation. No centralized logger; use `console.warn` for warnings, `console.error` for errors.

**Validation:** Type guards (`isCard`, `isColumn`) in `src/board/validation.ts` validate loaded data from IndexedDB. No schema validation library; hand-coded type checks.

**Authentication:** None. App is fully local; no server or user accounts. Host mode enables extension host (VS Code) to control persistence, but authentication is handled by the host.

**Drag & Drop:** Centralized via `useBoardDragAndDrop` in BoardProvider. @dnd-kit handles collision detection and sensor setup in DesktopBoard/MobileBoard. Modifiers restrict column drags to horizontal axis.

---

_Architecture analysis: 2026-06-29_
