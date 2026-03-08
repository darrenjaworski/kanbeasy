# Card Layout Editor

## Context

Users currently have limited control over what appears on board cards — the layout is hardcoded with card badge, title, checklist progress, and due date badge in a fixed order. Card density (small/medium/large) only controls title row count. The card layout editor gives users full control over which fields appear on board cards, their order, and display options, with a live WYSIWYG preview.

The editor is accessed via a "Card Layout Editor" button in Settings > Appearance, which swaps the modal content to a dedicated editor view with a "Back to Settings" navigation.

## Phased Approach

The feature is delivered in three phases, each building on the last. Each phase is independently useful and deployable behind the `cardLayoutEditor` feature flag (`import.meta.env.DEV` during development, tree-shaken in production).

### Phase 1 — Vertical stacking with toggle & reorder

Fields are full-width, stacked vertically. Users can toggle visibility and drag to reorder. This covers ~90% of the value.

### Phase 2 — Row grouping

Users can place two fields side-by-side on the same row with a configurable split (e.g., 50/50, 75/25). Handles cases like checklist progress + due date on one line.

### Phase 3 — Grid layout

Full quarter-width (25%) grid system. Fields can span 1–4 columns within a row. Drag-to-grid placement with snap-to-quarter and resize controls. Only justified once custom card properties exist and users have 10+ fields to arrange.

---

## Phase 1 — Vertical Stacking (current)

### UX

The editor is a sub-view within the settings modal, matching the same modal frame and styling. It consists of two parts:

**1. Live preview card (top)** — Rendered at the default card width (`w-80` / 320px) using the shared `CardBody` component with sample data. Updates instantly as the user toggles fields and reorders. Matches the current theme.

```
Preview
┌───────────────────────────────┐
│ feat-42                       │
│ My example task               │
│ ━━━━━━━━━━━━━━ 2/3    Mar 7  │
└───────────────────────────────┘
```

**2. Field list (below preview)** — Each row has:

- Drag handle (left) — reorder via @dnd-kit sortable
- Checkbox — toggle visibility
- Field name label
- Optional dropdown (right) — field-specific options (e.g., title line count)

```
Fields
☰  [✓] Card Number
☰  [✓] Title                    [1 line ▾]
☰  [ ] Description              [2 lines ▾]
☰  [✓] Checklist Progress
☰  [✓] Due Date
☰  [ ] Created Date
☰  [ ] Updated Date

[Reset to default]
```

### Constraints

- **Max 5 visible rows** — users cannot enable more than 5 fields simultaneously. The toggle is disabled (with a tooltip) when the limit is reached.
- **Board view only** — list view is a table (columns are fixed), calendar view is ultra-compact. The layout editor controls `CardBody` rendering within `SortableCardItem`.
- Does not affect the card detail modal (that shows all fields always).

### Displayable fields

| Field ID      | Default | Options        | Notes                                          |
| ------------- | ------- | -------------- | ---------------------------------------------- |
| `badge`       | visible | —              | Card number + type badge (feat-42 / #42)       |
| `title`       | visible | lines: 1, 2, 3 | Editable textarea, line count replaces density |
| `description` | hidden  | lines: 1, 2, 3 | Plain-text preview of description              |
| `checklist`   | visible | —              | Progress bar, only renders if checklist exists |
| `dueDate`     | visible | —              | Date badge with urgency color                  |
| `createdAt`   | hidden  | —              | Timestamp, e.g., "Mar 7, 2026"                 |
| `updatedAt`   | hidden  | —              | Timestamp                                      |

Fields with conditional data (checklist, dueDate) still only render when data exists — the layout controls whether they _can_ show, not whether there's data.

### Card density integration

The layout editor **replaces** the card density setting. The title field's `lines` option serves the same purpose. Migration: current density maps to title lines (small=1, medium=2, large=3). The `cardDensity` context value remains for backward compat but becomes derived from the layout's title lines.

### Data model

```typescript
// src/constants/cardLayout.ts (already implemented)

type CardFieldId =
  | "badge"
  | "title"
  | "description"
  | "checklist"
  | "dueDate"
  | "createdAt"
  | "updatedAt";

type CardFieldConfig = Readonly<{
  id: CardFieldId;
  visible: boolean;
  options?: Readonly<{ lines?: number }>;
}>;

type CardLayout = readonly CardFieldConfig[];
```

### What's built

- ✅ `CardFieldId`, `CardFieldConfig`, `CardLayout` types and `DEFAULT_CARD_LAYOUT` constant
- ✅ `CARD_FIELD_LABELS` mapping and `isValidCardLayout()` validator
- ✅ `CARD_LAYOUT` storage key in IndexedDB
- ✅ `cardLayout` / `setCardLayout` state in ThemeProvider with persistence and reset
- ✅ `cardLayoutEditor` feature flag (dev-only, tree-shaken in prod)
- ✅ Settings modal view switching (settings ↔ card layout editor)
- ✅ "Card Layout Editor" button in Appearance section (gated by feature flag)
- ✅ "Back to Settings" navigation in editor view
- ✅ `CardBody` component shared between `SortableCardItem` and the editor preview
- ✅ Preview card rendered with `CardBody` using sample data
- ✅ Settings section open/close persistence to IndexedDB
- ✅ Field visibility toggles with max 5 enforcement and tooltip
- ✅ Drag-to-reorder with @dnd-kit sortable (vertical axis, keyboard support)
- ✅ Line count dropdowns for title and description fields
- ✅ Visible count indicator ("4/5 visible")
- ✅ Reset to default button
- ✅ `CardBody` renders fields dynamically from `cardLayout` config
- ✅ New field renderers: description (clamped preview), createdAt, updatedAt
- ✅ `SortableCardItem` passes `cardLayout` to `CardBody` (gated by feature flag)
- ✅ Export/import support (v11) with density-to-lines migration for older exports
- ✅ Card density controls hidden when layout editor flag is on
- ✅ Unit tests for `isValidCardLayout` (11 tests)
- ✅ Unit tests for `SettingsSection` persistence (5 tests)
- ✅ Integration tests for card layout editor (12 tests)
- ✅ Import tests for cardLayout (5 tests)

### Remaining Phase 1 work

#### 1. E2e tests

- E2e test: toggle fields and verify board cards update
- E2e test: reorder fields and verify board cards reflect new order
- Visual regression snapshot updates if needed

### Files to modify (Phase 1)

| File                                            | Change                                               |
| ----------------------------------------------- | ---------------------------------------------------- |
| `src/constants/cardLayout.ts`                   | Re-export `FIELDS_WITH_LINE_OPTIONS`                 |
| `src/components/board/CardBody.tsx`             | Render from `cardLayout` config, add new field types |
| `src/components/board/SortableCardItem.tsx`     | Pass `cardLayout` to `CardBody`                      |
| `src/components/settings/CardLayoutSection.tsx` | Wire up toggles, reorder, dropdowns, reset           |
| `src/components/settings/ThemeSection.tsx`      | Remove card density controls                         |
| `src/theme/ThemeProvider.tsx`                   | Derive `cardDensity` from layout                     |
| `src/utils/exportBoard.ts`                      | Bump version, add cardLayout                         |
| `src/utils/importBoard.ts`                      | Parse/validate cardLayout                            |
| `src/components/settings/DataSection.tsx`       | Restore cardLayout on import                         |
| Tests for all of the above                      |                                                      |

---

## Phase 2 — Row Grouping

### Concept

Users can optionally pair two adjacent fields on the same row with a configurable width split. This is a lightweight extension of the vertical stacking model — the data model adds a `group` flag or `row` index to indicate which fields share a row.

### Data model extension

```typescript
type CardFieldConfig = Readonly<{
  id: CardFieldId;
  visible: boolean;
  options?: Readonly<{ lines?: number }>;
  /** Row index — fields sharing the same row render side-by-side. */
  row?: number;
  /** Width as a fraction of the card (0.25, 0.5, 0.75, 1.0). Default: 1.0 */
  width?: number;
}>;
```

### UX additions

- A "group" affordance in the field list (e.g., a link icon between adjacent fields)
- Clicking it merges two fields onto the same row
- A width control (e.g., slider or preset buttons: 50/50, 75/25, 25/75)
- The preview card renders grouped fields using flexbox
- Max 2 fields per row (keeps it simple, avoids cramped layouts on 320px cards)

### Constraints

- Min field width: 50% (160px at 320px card width) — ensures content remains readable
- Only adjacent fields in the list can be grouped
- Ungrouping splits them back to separate full-width rows

---

## Phase 3 — Grid Layout

### Concept

A full grid-based layout where the card is divided into rows × 4 columns (each 25% / ~80px). Fields can span 1–4 columns and be placed at specific grid positions. This becomes valuable once custom card properties add many user-defined fields.

### Data model extension

```typescript
type CardFieldConfig = Readonly<{
  id: CardFieldId;
  visible: boolean;
  options?: Readonly<{ lines?: number }>;
  /** Grid row (1-based). */
  gridRow: number;
  /** Grid column start (1-4). */
  gridCol: number;
  /** Number of columns to span (1-4). */
  gridSpan: number;
}>;
```

### UX additions

- The field list is replaced by a visual grid editor
- The card preview shows a grid overlay with snap zones
- Fields are dragged from a palette onto grid cells
- Resize handles on fields to adjust column span
- Row management: add/remove rows (max 5)
- Grid cells show drop zone highlights during drag

### Constraints

- Max 5 rows
- Max 4 columns (quarter-width blocks)
- Fields cannot overlap — placing a field pushes others aside or prevents the drop
- Card width in the editor matches the default column width (`w-80` / 320px)
- Min field span: 1 column (~80px) for compact content (badges, icons), 2 columns (~160px) for text content (title, description)

### Prerequisites

- Custom card properties feature must be implemented first (otherwise only 7 fields, not enough to justify a grid)
- Phase 2 row grouping provides intermediate value while the grid editor is developed

---

## Verification (all phases)

1. `npm run type:check` — no type errors
2. `npm run static-checks` — format, lint, knip, build all pass
3. `npm run test:run` — all unit tests pass (including new ones)
4. Manual testing in dev server:
   - Open Settings > Appearance > Card Layout Editor
   - Verify preview card renders correctly at default card width
   - Toggle fields on/off → preview and board cards update
   - Drag to reorder fields → preview and board cards reflect new order
   - Change title lines → cards resize
   - Export/import preserves layout
   - Reset to default works
   - Max 5 visible fields enforced
5. `npm run e2e` — all e2e tests pass
6. `npm run e2e:visual` — check for visual regression (may need snapshot updates)
