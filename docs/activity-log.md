# Activity Log — Design Document

## Overview and Goals

The activity log is an append-only timeline recording every meaningful mutation to the kanban board: card movements, edits, archiving, deletion, and column-level operations. It serves two purposes:

1. **Auditability** — Users can look back at what changed and when, answering questions like "When did I move that card?" or "What happened to the card I deleted?"
2. **Richer analytics** — The log provides raw event data that can power future features like activity heatmaps, "most active card" metrics, and card aging indicators.

The existing `columnHistory` array on each `Card` tracks column transitions for cycle-time analytics. The activity log complements rather than replaces it: `columnHistory` is a per-card structural field used by the analytics engine, while the activity log is a global, human-readable timeline that captures a broader set of events including deletions (where the card no longer exists to hold its own history).

### Non-Goals (Phase 1)

- Multi-user attribution (no user identity exists yet)
- Real-time collaboration notifications
- Replacing `columnHistory` on cards

---

## Data Model

### Event Types

Every event has a `type` discriminator. The initial set covers all current mutations in `useBoardMutations.ts`:

| Type                | Trigger (mutation)         | Details payload                                                                               |
| ------------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| `card_created`      | `addCard`                  | `{ cardId, cardNumber, cardTitle, columnId, columnTitle }`                                    |
| `card_moved`        | drag-and-drop / `moveCard` | `{ cardId, cardNumber, cardTitle, fromColumnId, fromColumnTitle, toColumnId, toColumnTitle }` |
| `card_reordered`    | `reorderCard`              | `{ cardId, cardNumber, cardTitle, columnId, columnTitle }`                                    |
| `card_updated`      | `updateCard`               | `{ cardId, cardNumber, cardTitle, columnId, columnTitle, fields: string[] }`                  |
| `card_duplicated`   | `duplicateCard`            | `{ cardId, cardNumber, cardTitle, sourceTitle, columnId, columnTitle }`                       |
| `card_sorted`       | `sortCards`                | `{ columnId, columnTitle }`                                                                   |
| `card_archived`     | `archiveCard`              | `{ cardId, cardNumber, cardTitle, columnId, columnTitle }`                                    |
| `card_restored`     | `restoreCard`              | `{ cardId, cardNumber, cardTitle, toColumnId, toColumnTitle }`                                |
| `cards_restored`    | `restoreCards`             | `{ cardIds: string[], count: number }`                                                        |
| `card_deleted`      | `permanentlyDeleteCard`    | `{ cardId, cardNumber, cardTitle }`                                                           |
| `cards_deleted`     | `permanentlyDeleteCards`   | `{ count: number }`                                                                           |
| `archive_cleared`   | `clearArchive`             | `{ count: number }`                                                                           |
| `column_created`    | `addColumn`                | `{ columnId, columnTitle }`                                                                   |
| `column_renamed`    | `updateColumn`             | `{ columnId, oldTitle, newTitle }`                                                            |
| `column_deleted`    | `removeColumn`             | `{ columnId, columnTitle, archivedCardCount: number }`                                        |
| `columns_reordered` | `setColumns` (drag)        | `{}`                                                                                          |
| `board_reset`       | `resetBoard`               | `{}`                                                                                          |
| `board_imported`    | import flow                | `{ columnCount: number, cardCount: number }`                                                  |

### Event Schema

```typescript
// src/activity/types.ts

export type ActivityEventType =
  | "card_created"
  | "card_moved"
  | "card_reordered"
  | "card_updated"
  | "card_duplicated"
  | "card_sorted"
  | "card_archived"
  | "card_restored"
  | "cards_restored"
  | "card_deleted"
  | "cards_deleted"
  | "archive_cleared"
  | "column_created"
  | "column_renamed"
  | "column_deleted"
  | "columns_reordered"
  | "board_reset"
  | "board_imported";

export interface ActivityEvent {
  readonly id: string; // crypto.randomUUID()
  readonly type: ActivityEventType;
  readonly timestamp: number; // Date.now()
  readonly cardId?: string; // when the event concerns a specific card
  readonly columnId?: string; // primary column involved
  readonly details: Record<string, unknown>; // type-specific payload
}

export interface ActivityLog {
  readonly events: ActivityEvent[];
}
```

### Storage

- **Separate localStorage key**: `kanbeasy:activityLog` — added to `STORAGE_KEYS` in `src/constants/storage.ts`.
- **Format**: JSON array of `ActivityEvent` objects, stored append-only.
- **Size limit**: Cap at **500 events** (configurable constant `MAX_ACTIVITY_EVENTS`). When the limit is reached, the oldest events are pruned on each write. At roughly 200-300 bytes per event, 500 events is approximately 100-150 KB, well within localStorage limits.
- **Pruning strategy**: Simple FIFO. On every `appendEvent` call, if `events.length > MAX_ACTIVITY_EVENTS`, slice from `events.length - MAX_ACTIVITY_EVENTS`.
- **No time-based pruning** in Phase 1 — count-based is simpler and more predictable.

### Undo/Redo Interaction

Undo and redo actions will **not** generate activity log entries. Rationale: undo/redo is a transient UI operation, and logging "undid card move" then "redid card move" would create noise. The activity log records intentional user actions.

### Relationship to `columnHistory`

`columnHistory` on `Card` is retained as-is. It serves the cycle-time and reverse-time analytics computations in `src/utils/cycleTime.ts` and `src/utils/boardMetrics.ts`. The activity log is a separate, UI-facing timeline.

---

## Architecture and Integration

### Hook: `useActivityLog`

A new custom hook at `src/activity/useActivityLog.ts` manages the activity log state:

```typescript
interface UseActivityLogReturn {
  events: ActivityEvent[];
  appendEvent: (
    type: ActivityEventType,
    details: Record<string, unknown>,
    cardId?: string,
    columnId?: string,
  ) => void;
  clearLog: () => void;
}
```

- Loads from localStorage on mount (lazy init, same pattern as `BoardProvider`).
- Exposes `appendEvent` which appends a new event, prunes if over limit, and saves to localStorage.
- Does NOT use `useUndoableState` — the log is outside the undo system.

### Provider: `ActivityLogProvider`

A new context provider at `src/activity/ActivityLogProvider.tsx`, wrapping children in `main.tsx` alongside `BoardProvider` and `ThemeProvider`.

### Hooking into Mutations: Wrapper Pattern

The cleanest integration point is a **wrapper hook** around `useBoardMutations`. Rather than modifying `useBoardMutations.ts` directly (which would couple mutation logic to logging), create `useLoggedBoardMutations.ts`:

This hook:

1. Calls `useBoardMutations(setState, nextCardNumberRef, saveCounter)` to get the raw mutations.
2. Wraps each mutation in a function that calls the original, then calls `appendEvent` with the appropriate event type and details.
3. Returns the wrapped mutations with the same type signature as `BoardContextValue`.

The `BoardProvider` then uses `useLoggedBoardMutations` instead of `useBoardMutations` directly. This preserves the purity of the mutation logic and makes logging easy to test independently.

### Integration with Drag-and-Drop

**Preferred approach**: Refactor `useBoardDragAndDrop` to call `moveCard` / `reorderCard` instead of `setColumns` directly. This channels all mutations through the same logged functions.

### File Structure

```
src/activity/
  types.ts                    -- ActivityEvent, ActivityEventType
  constants.ts                -- MAX_ACTIVITY_EVENTS
  ActivityLogContext.ts        -- React.createContext
  ActivityLogProvider.tsx      -- Provider component with useActivityLog
  useActivityLog.ts           -- Core hook: load, append, prune, save
  useLoggedBoardMutations.ts  -- Wrapper that adds logging to mutations
  index.ts                    -- Barrel export
```

---

## UI Design

### Where the Activity Log Lives

**Recommendation: Dedicated modal**, accessed from a new button in the Header next to Analytics. This follows the established pattern (AnalyticsModal, ArchiveModal, SettingsModal).

```
+-----------------------------------------------------------+
| Kanbeasy   [Search...]   Board|List|Cal                   |
|              [Analytics] [Activity] [Archive] [Settings]  |
+-----------------------------------------------------------+
```

### Activity Log Modal Layout

```
+------------------------------------------+
| Activity Log                        [X]  |
+------------------------------------------+
| Filter: [All v]  [Search...        ]     |
|                                          |
| -- Today ----------------------------    |
| + Created card #42 "Fix login bug"       |
|   in To Do . 2 hours ago                 |
|                                          |
| -> Moved card #38 "Update docs"          |
|    To Do -> In Progress . 3 hours ago    |
|                                          |
| -- Yesterday -------------------------   |
| * Updated card #35 "API endpoint"        |
|   title, description . 1 day ago         |
|                                          |
| [] Archived card #31 "Old feature"       |
|    from Done . 1 day ago                 |
|                                          |
| # Created column "Review"                |
|   1 day ago                              |
|                                          |
|          [Show more]                     |
|                                          |
| ---------------------------------------- |
| Showing 25 of 142 events . Clear log     |
+------------------------------------------+
```

### Component Breakdown

```
src/components/activity/
  ActivityLogModal.tsx      -- Modal shell with filter bar and event list
  ActivityEventItem.tsx     -- Single event row (icon, description, timestamp)
  ActivityFilter.tsx        -- Filter dropdown (by event type category)
  ActivityLogIcon.tsx       -- SVG icon for the header button
  index.ts                 -- Barrel export
```

### Event Display

Each `ActivityEventItem` renders:

- **Icon**: A small SVG icon per event category (create = plus, move = arrow, edit = pencil, archive = box, delete = trash, column = columns icon). Reuse existing icons where possible.
- **Description**: Human-readable sentence built from the event details. E.g., "Moved card #38 'Update docs' from To Do to In Progress".
- **Timestamp**: Relative by default ("2 hours ago", "yesterday"). Use a `formatRelativeTime` utility. Show absolute time on hover via `title` attribute.

### Filtering

Phase 1 filtering is a single dropdown with categories:

- All events
- Card events (created, moved, updated, duplicated, archived, restored, deleted)
- Column events (created, renamed, deleted, reordered)
- Board events (reset, imported)

### Pagination

Use the same "Show more" pattern as `MetricsTable` in the analytics modal. Show 25 events initially, load 25 more on click. No virtualization needed in Phase 1 since we cap at 500 events.

### Per-Card Activity in CardDetailModal

Add a collapsible "Activity" section at the bottom of `CardDetailModal`, above the metadata footer. This section filters the global activity log for events matching the card's ID:

```
| > Activity (5 events)                    |
|                                          |
| -- Metadata --------------------------   |
| Created: Mar 5, 2026, 2:30 PM           |
| Updated: Mar 7, 2026, 10:15 AM          |
```

When expanded:

```
| v Activity (5 events)                    |
|   -> Moved To Do -> In Progress . 2h ago |
|   * Updated title . 1d ago              |
|   + Created in To Do . 3d ago           |
```

Reuses `ActivityEventItem` with a compact variant (no card name shown since we are already viewing that card).

### Color Coding

Use the theme's accent color for move events, muted text color for metadata events, and the existing danger color pattern for delete/archive events. Keep it subtle — icons provide the primary differentiation.

---

## Performance and Storage Management

### localStorage Size

- 500 events at ~250 bytes each = ~125 KB. Well under the 5 MB localStorage limit.
- Stored in its own key, so it does not inflate the board data payload.

### Mutation Overhead

Each mutation now has one additional function call (`appendEvent`) that creates a small object, pushes to an array, and calls `saveToStorage`. The `JSON.stringify` of 500 small events takes under 1ms on modern hardware. Negligible.

### Rendering

- The modal only renders when open (early return if `!open`).
- Pagination (25 at a time) keeps DOM node count low.
- No virtualization needed in Phase 1.

### Log Rotation

```typescript
const MAX_ACTIVITY_EVENTS = 500;

function appendEvent(event: ActivityEvent): ActivityEvent[] {
  const updated = [...events, event];
  if (updated.length > MAX_ACTIVITY_EVENTS) {
    return updated.slice(updated.length - MAX_ACTIVITY_EVENTS);
  }
  return updated;
}
```

---

## Export/Import Considerations

### Export

Add an optional `activityLog` field to the export data. For version < 10 imports, the activity log is simply empty. For version 10+ imports, validate that each entry has the required fields (`id`, `type`, `timestamp`).

A `board_imported` event is appended to the activity log after a successful import.

### Clear Data

The "Clear board data" action in settings should also clear the activity log. Add `STORAGE_KEYS.ACTIVITY_LOG` to the clear logic.

---

## Edge Cases

### Card permanently deleted

The event remains in the log with the card title and number captured at deletion time. Event details are self-contained and do not reference live card data.

### Archive then restore

Both actions produce separate log entries (`card_archived`, `card_restored`). The timeline accurately reflects the sequence.

### Undo/redo

Undo/redo does not generate log entries. An undo reverses the board state but the log entry for the original action remains. The log represents "what the user did," not "current state."

### Board reset

A `board_reset` event is logged. The log itself is NOT cleared on reset — the user can still review what happened before the reset.

### Column deletion

When a column with cards is deleted, those cards are archived. The log records a `column_deleted` event with `archivedCardCount`. Individual `card_archived` events are NOT generated for each card (to avoid log spam).

---

## Testing Plan

### Unit Tests

**`src/activity/useActivityLog.test.ts`**:

- `appendEvent` creates an event with correct id, type, timestamp
- Events are stored in chronological order
- Pruning removes oldest events when exceeding `MAX_ACTIVITY_EVENTS`
- `clearLog` empties the event array
- Events persist to localStorage on append
- Events load from localStorage on init
- Corrupted localStorage data falls back to empty log

**`src/activity/useLoggedBoardMutations.test.ts`**:

- Each mutation function appends the correct event type
- Event details contain expected fields (card title, column title, etc.)
- `updateColumn` captures old title in the event
- `updateCard` lists changed fields in details
- `resetBoard` appends a `board_reset` event
- Mutations still function correctly (board state changes as expected)

**`src/components/activity/ActivityEventItem.test.tsx`**:

- Renders correct icon for each event type
- Displays human-readable description
- Shows relative timestamp
- Shows absolute timestamp on hover (title attribute)

**`src/components/activity/ActivityLogModal.test.tsx`**:

- Renders event list when open
- Returns null when closed
- Filtering by category shows/hides correct events
- "Show more" button loads additional events
- "Clear log" button calls clearLog
- Empty state message when no events

### E2E Tests

**`tests-e2e/activity-log.spec.ts`**:

- Create a card, open activity log, verify "Created card" entry appears
- Move a card between columns, verify "Moved card" entry appears
- Edit a card title, verify "Updated card" entry appears
- Archive a card, verify "Archived card" entry appears
- Delete a column, verify "Deleted column" entry appears
- Filter to "Column events", verify only column events are visible
- Open card detail modal, verify per-card activity section shows relevant events
- Clear log, verify log is empty

---

## Implementation Plan (Phased)

### Phase 1: Core Data Layer (1-2 days)

1. Create `src/activity/types.ts` with `ActivityEvent` and `ActivityEventType`
2. Create `src/activity/constants.ts` with `MAX_ACTIVITY_EVENTS`
3. Add `ACTIVITY_LOG: "kanbeasy:activityLog"` to `src/constants/storage.ts`
4. Create `src/activity/useActivityLog.ts` hook (load, append, prune, save, clear)
5. Create `src/activity/ActivityLogContext.ts` and `src/activity/ActivityLogProvider.tsx`
6. Add `ActivityLogProvider` to `src/main.tsx`
7. Write unit tests for `useActivityLog`

### Phase 2: Mutation Logging (1-2 days)

1. Create `src/activity/useLoggedBoardMutations.ts` wrapping each mutation
2. Update `BoardProvider.tsx` to use `useLoggedBoardMutations`
3. Refactor `useBoardDragAndDrop.ts` to use `moveCard`/`reorderCard` mutations for card drags
4. Write unit tests for `useLoggedBoardMutations`
5. Add `activityLog` feature flag to `src/constants/featureFlags.ts`

### Phase 3: Activity Log Modal UI (1-2 days)

1. Create `ActivityLogIcon` SVG component
2. Create `ActivityEventItem` component with icon mapping and description builder
3. Create `ActivityFilter` dropdown component
4. Create `ActivityLogModal` with event list, filtering, pagination, and clear button
5. Add `formatRelativeTime` utility to `src/utils/formatDate.ts`
6. Add Activity Log button to `Header.tsx`
7. Write component unit tests

### Phase 4: Per-Card Activity (0.5-1 day)

1. Add collapsible "Activity" section to `CardDetailModal.tsx`
2. Filter global log by `cardId`, render compact `ActivityEventItem` list
3. Write tests for per-card filtering

### Phase 5: Export/Import (0.5-1 day)

1. Include `activityLog` in export data
2. Add activity log validation and migration in `importBoard.ts`
3. Add `board_imported` event logging to the import flow
4. Ensure "Clear board data" clears the activity log
5. Write tests for export/import with activity log

### Phase 6: Polish and Ship (0.5 day)

1. Add tooltip to activity log button
2. Add command palette action: "Open Activity Log"
3. Set feature flag to `true`
4. Final E2E tests
5. Update `ROADMAP.md` and `CHANGELOG.md`

---

## Future Enhancements

- **Activity sparkline/heatmap** on the board header showing activity level over time
- **"Most active card"** metric in analytics
- **Export activity log as CSV** for power users
- **Activity-based card aging** — show staleness based on last activity
- **Daily/weekly digest view** summarizing activity
- **Searchable log** — full-text search over event descriptions
- **User-configurable max event count**

---

## Open Questions

1. **Should `card_reordered` (within-column reorder) be logged?** Low-signal event that could generate noise. **Recommendation**: skip in Phase 1.

2. **Should the activity log be searchable?** Filter dropdown covers type-based filtering. Full-text search could be added later. **Recommendation**: defer.

3. **Multiple boards (future)?** Each board would have its own activity log, keyed by board ID (e.g., `kanbeasy:activityLog:{boardId}`).

4. **Should the max event count be user-configurable?** **Recommendation**: hardcode 500 in Phase 1, make configurable later if needed.

5. **Should `card_updated` events be debounced?** `updateCard` is only called on blur/save, not on every keystroke, so this is not a concern with the current UX.

6. **CSV export of activity log?** Low effort, high utility. **Recommendation**: add in a follow-up after Phase 1 ships.
