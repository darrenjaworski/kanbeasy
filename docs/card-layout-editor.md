# Card Layout Editor

## Context

Users currently have limited control over what appears on board cards — the layout is hardcoded with card badge, title, checklist progress, and due date badge in a fixed order. Card density (small/medium/large) only controls title row count. The card layout editor gives users full control over which fields appear on board cards, their order, and per-field display options, with a live WYSIWYG preview.

## Design

### UX: Stacked preview + field list

The editor lives in a new **"Card Layout"** settings section. It has two parts:

**1. Live preview card (top)** — A realistic card rendered with sample data, using the actual shared components (CardTypeBadge, ChecklistProgress, DueDateBadge). Updates instantly as the user toggles fields and reorders. Matches the current theme.

```
Preview
┌───────────────────────────────┐
│ feat-42                       │
│ My example task               │
│ ━━━━━━━━━━━━━━ 2/3    Mar 7  │
└───────────────────────────────┘
```

**2. Field list (below)** — Each row has:

- Drag handle (left) — reorder via @dnd-kit sortable
- Checkbox (middle) — toggle visibility
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

### Displayable fields

| Field ID      | Default | Options        | Notes                                          |
| ------------- | ------- | -------------- | ---------------------------------------------- |
| `badge`       | visible | —              | Card number + type badge (feat-42 / #42)       |
| `title`       | visible | lines: 1, 2, 3 | Editable textarea, line count replaces density |
| `description` | hidden  | lines: 1, 2, 3 | New: plain-text preview of description         |
| `checklist`   | visible | —              | Progress bar, only renders if checklist exists |
| `dueDate`     | visible | —              | Date badge with urgency color                  |
| `createdAt`   | hidden  | —              | Timestamp, e.g., "Mar 7, 2026"                 |
| `updatedAt`   | hidden  | —              | Timestamp                                      |

Fields with conditional data (checklist, dueDate) still only render when data exists — the layout controls whether they _can_ show, not whether there's data.

### Card density integration

The layout editor **replaces** the card density setting. Title `lines` option serves the same purpose. Migration: current density maps to title lines (small=1, medium=2, large=3). The card density localStorage key and context value remain for backward compat but become derived from the layout.

### Scope

- **Board view only** — List view is a table (columns are fixed), calendar view is ultra-compact. The layout editor controls `SortableCardItem` rendering.
- Does not affect the card detail modal (that shows all fields always).

## Data Model

```typescript
// src/constants/cardLayout.ts

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

const CARD_FIELD_LABELS: Record<CardFieldId, string> = {
  badge: "Card Number",
  title: "Title",
  description: "Description",
  checklist: "Checklist Progress",
  dueDate: "Due Date",
  createdAt: "Created Date",
  updatedAt: "Updated Date",
};

const DEFAULT_CARD_LAYOUT: CardLayout = [
  { id: "badge", visible: true },
  { id: "title", visible: true, options: { lines: 1 } },
  { id: "checklist", visible: true },
  { id: "dueDate", visible: true },
  { id: "description", visible: false, options: { lines: 2 } },
  { id: "createdAt", visible: false },
  { id: "updatedAt", visible: false },
];
```

## Implementation Plan

### 1. Constants & types (`src/constants/cardLayout.ts`, `src/theme/types.ts`)

- Define `CardFieldId`, `CardFieldConfig`, `CardLayout` types
- Define `DEFAULT_CARD_LAYOUT`, `CARD_FIELD_LABELS`
- Define `FIELDS_WITH_LINE_OPTIONS: Set<CardFieldId>` for fields that support `lines`
- Define `isValidCardLayout()` validation function
- Add `cardLayout` / `setCardLayout` to `ThemeContextValue`

### 2. Storage key (`src/constants/storage.ts`)

- Add `CARD_LAYOUT: "kanbeasy:cardLayout"` key

### 3. ThemeProvider (`src/theme/ThemeProvider.tsx`)

- Add `cardLayout` state initialized from localStorage (JSON parsed, validated, falls back to default)
- Persist with `useEffect` -> `saveToStorage`
- Derive `cardDensity` from layout's title field `lines` option (backward compat)
- Add to `resetSettings`, context value, and dependency arrays

### 4. Card layout settings UI (`src/components/settings/CardLayoutSection.tsx`)

- **Preview**: Render a mock card using the actual shared components with sample data
  - Sample: `{ number: 42, title: "My example task", cardTypeId: "feat", description: "A description with\n- [ ] Todo item\n- [x] Done item", dueDate: tomorrow, createdAt: weekAgo, updatedAt: now }`
  - Iterate over `cardLayout` in order, render each visible field using the real components
  - Wrap in a container styled like a real card (`tc.glass`, `tc.border`, rounded, etc.)
- **Field list**: @dnd-kit sortable list
  - Each item: drag handle + checkbox + label + optional lines dropdown
  - Reorder updates `cardLayout` array order
  - Toggle updates `visible` flag
  - Lines dropdown updates `options.lines`
- **Reset button**: Restores `DEFAULT_CARD_LAYOUT`
- Uses existing `tc` class helpers for consistent styling

### 5. Update SortableCardItem (`src/components/board/SortableCardItem.tsx`)

- Accept `cardLayout` prop (from `useTheme()` in parent)
- Replace hardcoded field rendering with a loop over `cardLayout`:
  ```tsx
  {cardLayout.map((field) => {
    if (!field.visible) return null;
    switch (field.id) {
      case "badge": return <CardTypeBadge ... />;
      case "title": return <textarea rows={field.options?.lines ?? 1} ... />;
      case "description": return card.description ? <p className="line-clamp-{lines}">...</p> : null;
      case "checklist": return <ChecklistProgress ... />;
      case "dueDate": return <DueDateBadge ... />;
      case "createdAt": return <span>...</span>;
      case "updatedAt": return <span>...</span>;
    }
  })}
  ```
- CardControls remain fixed (always top-right, not part of layout)
- Title remains the only editable-inline field

### 6. SettingsModal integration (`src/components/settings/SettingsModal.tsx`)

- Add new `<SettingsSection title="Card Layout">` with `<CardLayoutSection />`
- Remove card density from Appearance section (it's now part of layout editor)
- Reorder sections: Appearance -> Card Layout -> Card Types -> Preferences -> Data

### 7. Export/import (`src/utils/exportBoard.ts`, `src/utils/importBoard.ts`)

- Bump export version to 10
- Add `cardLayout` to export settings (JSON stringified)
- Import: parse and validate `cardLayout` from v10+ exports, fall back to default for older versions
- Validate each field config has a known `id`, boolean `visible`, and valid `options`

### 8. Backward compat

- Existing `cardDensity` setting derived from layout's title lines
- `setCardDensity` still works (updates layout's title lines)
- Old exports without `cardLayout` get the default layout with title lines mapped from their `cardDensity`

## Files to modify

| File                                            | Change                                             |
| ----------------------------------------------- | -------------------------------------------------- |
| `src/constants/cardLayout.ts`                   | **New** — types, defaults, labels                  |
| `src/constants/storage.ts`                      | Add `CARD_LAYOUT` key                              |
| `src/theme/types.ts`                            | Add `cardLayout` / `setCardLayout` to context type |
| `src/theme/ThemeProvider.tsx`                   | Add state, persistence, derive density             |
| `src/components/settings/CardLayoutSection.tsx` | **New** — preview + field editor                   |
| `src/components/settings/SettingsModal.tsx`     | Add Card Layout section, adjust density            |
| `src/components/board/SortableCardItem.tsx`     | Render fields from layout config                   |
| `src/components/board/CardList.tsx`             | Pass `cardLayout` through to SortableCardItem      |
| `src/components/board/Column.tsx`               | Pass `cardLayout` through to CardList              |
| `src/components/board/Board.tsx`                | Read `cardLayout` from theme context               |
| `src/utils/exportBoard.ts`                      | Bump version, add cardLayout                       |
| `src/utils/importBoard.ts`                      | Parse/validate cardLayout                          |
| `src/components/settings/DataSection.tsx`       | Restore cardLayout on import                       |
| `src/components/settings/ThemeSection.tsx`      | Remove card density controls                       |
| Tests for all of the above                      |

## Verification

1. `npm run type:check` — no type errors
2. `npm run static-checks` — format, lint, knip, build all pass
3. `npm run test:run` — all unit tests pass (including new ones)
4. Manual testing in dev server:
   - Open Settings -> Card Layout
   - Verify preview card renders correctly
   - Toggle fields on/off -> preview and board cards update
   - Drag to reorder fields -> preview and board cards reflect new order
   - Change title lines -> cards resize
   - Export/import preserves layout
   - Reset to default works
5. `npm run e2e` — all e2e tests pass
6. `npm run e2e:visual` — check for visual regression (may need snapshot updates)
