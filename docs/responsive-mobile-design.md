# Responsive Design & Mobile Support — Design Document

## Overview and Goals

Kanbeasy is currently a desktop-first kanban board application. All layouts assume wide viewports: the board uses horizontal flexbox with fixed-width columns (`w-80` / 320px), modals cap at `max-w-md` (448px) centered on screen, the header lays out all controls in a single row, and drag-and-drop is configured exclusively with `PointerSensor` (no touch-specific tuning). This design document covers the complete strategy to make Kanbeasy fully usable on mobile phones and tablets without degrading the desktop experience.

**Goals:**

1. Functional, usable kanban board on screens as narrow as 320px (iPhone SE).
2. Touch-friendly drag-and-drop with proper gesture handling.
3. All interactive elements meet the 44x44px minimum tap target guideline.
4. Modals behave as full-screen sheets on mobile.
5. Zero new dependencies — leverage existing @dnd-kit touch support and Tailwind responsive utilities.
6. Progressive enhancement: mobile changes should not alter desktop behavior.

**Non-goals (for this phase):**

- PWA/service worker (separate roadmap item — see `docs/offline-pwa.md`).
- Pull-to-refresh (requires service worker context to be meaningful).
- Bottom navigation bar (deferred until multi-board support adds navigation complexity).

---

## Breakpoint Strategy

Tailwind CSS v4 provides these default breakpoints. The plan uses three tiers:

| Tier    | Tailwind prefix      | Range        | Target                             |
| ------- | -------------------- | ------------ | ---------------------------------- |
| Mobile  | (default, no prefix) | 0 - 639px    | Phones in portrait                 |
| Tablet  | `sm:` (640px+)       | 640 - 1023px | Phones in landscape, small tablets |
| Desktop | `lg:` (1024px+)      | 1024px+      | Tablets in landscape, desktops     |

The `md:` breakpoint (768px) is available for fine-tuning if needed (e.g., calendar grid), but the primary split is mobile-first with `sm:` and `lg:` overrides.

---

## Layout Changes Per Breakpoint

### Mobile (< 640px)

- **Board:** Single column visible at a time, horizontal swipe to navigate between columns. Column selector tabs at top.
- **Header:** Logo + hamburger menu. Search, view toggle, analytics/archive/settings behind menu.
- **Modals:** Full-screen (100vh, 100vw), no rounded corners.
- **Calendar:** Compact list-based view for each day instead of full 7-column grid.
- **List view:** Card-based layout instead of table (one card per row, stacked fields).
- **Bottom bar:** Undo/redo pills shrink, keyboard shortcut hint hidden.
- **Column resizing:** Disabled entirely (columns fill viewport width).

### Tablet (640px - 1023px)

- **Board:** Two columns visible, horizontal scroll for more. Column width adapts.
- **Header:** Full row but with `compactHeader` forced (icons only, no text labels).
- **Modals:** Standard centered modal, slightly wider padding.
- **Calendar:** Full 7-column grid but with smaller cells.
- **List view:** Table layout preserved but with fewer visible columns (hide Created, collapse Type).

### Desktop (1024px+)

- **No changes** to current behavior. Everything stays as-is.

---

## Component-by-Component Plan

### 1. Board (`src/components/board/Board.tsx`)

**Current state:** Horizontal `flex gap-4` with `overflow-x-auto`. Each column is `w-80` (320px) or resizable.

**Mobile plan — Column carousel with tab navigation:**

- Add a `useIsMobile` hook (pure JS, `window.matchMedia('(max-width: 639px)')`) to detect mobile.
- On mobile, render a column selector strip (horizontal scrollable tabs showing column titles + card counts) at the top of the board area.
- Show only the selected column, filling the full viewport width with padding.
- Swipe gestures on the column body advance to next/previous column (use touch start/end delta detection — no library needed, ~30 lines of code).
- The `DndContext` still wraps everything. Cards can be dragged within the visible column. To move cards between columns on mobile, users tap the card to open `CardDetailModal` and use the column selector dropdown (already exists).

**Key changes:**

- Desktop renders all columns in a flex row; mobile renders a single column with tab navigation.
- `SortableContext` on mobile only includes the active column's cards.
- Column drag-and-drop (reordering columns) is disabled on mobile.
- The `AddColumn` button appears as a "+" tab in the column selector strip.

**Tablet plan:**

- Same horizontal scroll layout as desktop, but columns get a minimum width of `min-w-[280px]` and `flex-shrink-0` to prevent crushing.
- Column resizing is disabled on tablet (too fiddly with touch).

### 2. Column (`src/components/board/Column.tsx`)

**Mobile plan:**

- Column fills width: remove `w-80` and resizing entirely. Use `w-full`.
- Column controls (drag handle + delete button) that appear on hover: make them always visible on mobile. Use `@media (hover: hover)` CSS media query for hover-visibility on desktop.
- Card count badge: position statically in the column header instead of absolutely positioned.

### 3. SortableCardItem (`src/components/board/SortableCardItem.tsx`)

**Mobile plan:**

- Increase card control button sizes from `h-6 w-6` to `h-10 w-10` on mobile for 44px tap targets.
- Make `CardControls` always visible on mobile (no hover-reveal).
- Add a tap handler: tapping a card on mobile opens `CardDetailModal` directly. The entire card surface becomes tappable on mobile.

### 4. CardControls (`src/components/board/CardControls.tsx`)

**Mobile plan — Option A (recommended):**

On mobile, replace the hover-reveal pill with a single "..." button that opens an action sheet / dropdown menu. This keeps the card surface clean and avoids cluttering every card with 4 buttons.

Add a `CardActionMenu` component that renders as a bottom sheet on mobile with options: Drag, Copy, Details, Archive. On desktop, the existing hover-reveal pill is preserved unchanged.

### 5. Header (`src/components/Header.tsx`)

**Mobile plan — Two-row header:**

- **Row 1:** Logo ("Kanbeasy") on the left, hamburger menu button on the right.
- **Row 2 (collapsed by default):** When hamburger is tapped, a dropdown/sheet reveals: Search input (full width), View toggle, Analytics button, Archive button, Settings button — stacked vertically.
- On tablet (`sm:`+): Single row, but force `compactHeader` behavior (icon-only buttons).
- On desktop (`lg:`+): Current layout unchanged.

### 6. Modal (`src/components/shared/Modal.tsx`)

**Mobile plan — Full-screen sheet:**

```
// Current:
className="... w-full max-w-md max-h-[85vh] rounded-lg ..."
// Mobile-first:
className="... w-full h-full sm:h-auto sm:max-w-md sm:max-h-[85vh] sm:rounded-lg ..."
```

This change in `Modal.tsx` automatically propagates to SettingsModal, AnalyticsModal, ArchiveModal, CardDetailModal, and WelcomeModal.

### 7. CommandPalette (`src/components/CommandPalette.tsx`)

**Mobile plan:**

- Full-width on mobile: `max-w-lg` becomes `max-w-[calc(100%-2rem)] sm:max-w-lg`.
- Position closer to top on mobile: `pt-[10vh] sm:pt-[20vh]`.
- List items increase to `py-3` on mobile for 44px+ tap targets.
- Can be triggered from the hamburger menu or a mobile-specific button.

### 8. SearchInput type filter (`src/components/SearchInput.tsx`)

**Mobile plan:**

- The type filter is a multi-select dropdown anchored to the search bar. On mobile, a small anchored dropdown is awkward to interact with precisely.
- On mobile, open the type filter as a bottom sheet (similar to `CardActionMenu`) instead of an inline dropdown.
- The bottom sheet lists all card types with checkbox toggles and a "Clear" / "Apply" button row at the bottom.

### 9. CalendarView (`src/components/CalendarView.tsx`)

**Mobile plan:**

- On mobile (< 640px), switch from the 7-column grid to a vertical list of days with cards (show only days that have cards).
- On tablet (`sm:`+), keep the 7-column grid but reduce cell height to `h-24`.
- On desktop (`lg:`+), current layout unchanged.

### 10. ListView (`src/components/ListView.tsx`)

**Mobile plan:**

- On mobile, replace the table with a card-based list: each row becomes a tappable card showing card number/type badge, title, column name, and due date. Created timestamp is hidden.
- Use a responsive conditional: `<table>` on `sm:`, card list on mobile.

### 10. ArchiveModal (`src/components/ArchiveModal.tsx`)

**Mobile plan:**

- The archive modal contains a data table (similar to `ListView`) with columns for card number, title, type, column, and archived date. On mobile, replace the table with a card-based list matching the `ListView` mobile treatment.
- Full-screen modal behavior is inherited from the `Modal.tsx` change.

### 11. OwlAssistant (`src/components/OwlAssistant.tsx`)

**Mobile plan:**

- The floating owl button lives in a fixed corner. On mobile, it may overlap the bottom bar or intercept swipe gestures used for column navigation.
- Reposition to the opposite corner from the bottom bar buttons, or anchor it above the bottom bar using a fixed offset (e.g., `bottom-16` when on mobile).
- Reduce the owl button size slightly on mobile to minimize accidental taps during swipes.

### 12. BottomBar (`src/components/BottomBar.tsx`)

**Mobile plan:**

- Hide the keyboard shortcut hint on mobile.
- Undo/redo buttons: reduce label to icon-only on mobile.
- Increase padding for 44px tap target minimum.

---

## Touch Interaction Design

### @dnd-kit Sensor Configuration

**Current state:** Board.tsx configures only `PointerSensor` (with 5px distance constraint) and `KeyboardSensor`.

**Required change:** `PointerSensor` handles both mouse and touch events via the Pointer Events API. Touch-specific tuning is needed:

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      delay: 200, // ms to hold before drag activates (touch-friendly)
      tolerance: 5, // px of movement allowed during delay
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  }),
);
```

**Why `delay` instead of `distance`:** On touch devices, a distance-based activation conflicts with scrolling. A short delay (200ms) lets the user start scrolling immediately but activates drag after a deliberate press-and-hold.

### Touch Target Sizes

Per Apple Human Interface Guidelines, all interactive elements must be at least 44x44 points. Current violations:

| Element                   | Current Size                | Required Change                                          |
| ------------------------- | --------------------------- | -------------------------------------------------------- |
| Card control buttons      | 24x24px (`h-6 w-6`)         | 44x44px on mobile via responsive classes or action sheet |
| Column drag handle        | 32x32px (`h-8 w-8`)         | Bump to 44x44px on mobile                                |
| Column delete button      | 32x32px (`h-8 w-8`)         | Same as above                                            |
| Calendar day card buttons | ~20px tall                  | Increase padding for 44px height on mobile               |
| View toggle buttons       | `p-1.5 px-2.5` (~28px tall) | Increase to `p-2.5 px-3` on mobile                       |
| Undo/redo buttons         | `px-3 py-1.5` (~30px tall)  | Increase to `py-2.5` on mobile                           |

### iOS Safari Dynamic Viewport Height (`dvh`)

On iOS Safari, `100vh` is computed against the full page height including the retractable URL bar, causing elements sized with `h-screen` or `h-full` to be clipped when the bar is visible. Use `h-dvh` (dynamic viewport height) instead:

```css
/* Instead of h-screen or h-full on the board and full-screen modals */
h-dvh          /* maps to height: 100dvh */
min-h-dvh      /* safe minimum for the main board container */
```

Apply this to:

- The main board container in `Board.tsx`
- The full-screen modal wrapper in `Modal.tsx` (`h-dvh` instead of `h-full`)

Tailwind CSS v4 supports `dvh` natively — no config change needed.

### Virtual Keyboard / Input Focus

When a soft keyboard opens on mobile, the visible area shrinks, potentially hiding focused inputs. Ensure focused elements scroll into view:

- In `SortableCardItem.tsx`: after focusing the inline title textarea, call `textarea.scrollIntoView({ block: 'nearest', behavior: 'smooth' })`.
- In `CardDetailModal.tsx`: the modal uses `overflow-y-auto`; inputs inside will naturally scroll within the modal, but the modal itself must not be clipped by the keyboard. Use `env(safe-area-inset-bottom)` padding at the modal bottom if needed.
- In the hamburger menu search input: ensure the menu panel itself scrolls or resizes when the keyboard opens rather than being pushed off-screen.

### Drag Overlay Width on Mobile

During a card drag, `DragOverlay` renders a floating clone at the card's natural size. On mobile, cards are full-width — the overlay will be 100% viewport width, completely obscuring the drop target below it. Constrain the overlay on mobile:

```tsx
// In Board.tsx DragOverlay usage:
<DragOverlay>
  {activeCard && (
    <div className="w-4/5 mx-auto opacity-90"> {/* mobile: 80% width */}
      <Card ... />
    </div>
  )}
</DragOverlay>
```

Use `useIsMobile` to apply the constrained width only on mobile, keeping the full-width overlay on desktop.

### Gesture Design

- **Tap card:** Opens `CardDetailModal` (mobile only — on desktop, tap edits title inline as currently).
- **Long-press card:** Initiates drag (via @dnd-kit delay activation).
- **Swipe left/right on column:** Navigate between columns in the carousel (custom touch handler, not @dnd-kit).

### Preventing Conflicts Between Scroll and Drag

The `delay` activation constraint solves this:

- Quick flick = scroll (touch ends before delay expires).
- Press and hold = drag (delay expires, drag activates).

On mobile with the single-column carousel, there is no horizontal scroll conflict for cards — only vertical scroll within the column.

---

## New Hook: `useIsMobile`

```typescript
// src/hooks/useIsMobile.ts
import { useSyncExternalStore } from "react";

const query = "(max-width: 639px)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

Uses `useSyncExternalStore` for tear-free reads, has zero dependencies, and avoids re-renders except when the breakpoint actually changes. Export from `src/hooks/index.ts` barrel.

---

## Performance Considerations

### Viewport-Based Lazy Rendering

On mobile, only one column is rendered at a time, which is inherently performant. On desktop with many columns, React only renders DOM nodes and the browser handles visibility. No virtualization needed for typical use.

### Animation Performance

- All existing animations use CSS transitions, which are GPU-accelerated.
- @dnd-kit's drag overlay uses `transform: translate3d(...)`, which is GPU-accelerated.
- The `backdrop-blur` used on modals and glass effects can be expensive on low-end devices. Add a `prefers-reduced-motion` media query to disable backdrop-blur and non-essential transitions (this is a concrete Phase 5 task — see Testing and Polish below).

### Touch Event Handling

- @dnd-kit uses passive event listeners where possible.
- The existing `{ passive: true }` on the scroll listener in `Board.tsx` is correct.

---

## Migration / Rollout Plan (Progressive Enhancement)

### Phase 1: Foundation (2-3 days)

1. Create `useIsMobile` hook.
2. Update `Modal.tsx` for full-screen on mobile — use `h-dvh` instead of `h-full`.
3. Update main board container in `Board.tsx` to use `min-h-dvh` (iOS Safari safe area).
4. Update `BottomBar.tsx` for mobile sizing.
5. Update tap target sizes across the board.
6. Change `PointerSensor` activation constraint to `{ delay: 200, tolerance: 5 }`.

### Phase 2: Header and Navigation (1-2 days)

1. Implement hamburger menu in `Header.tsx`.
2. Move search, view toggle, and action buttons into the mobile menu.
3. Adjust `SearchInput.tsx` for full-width in the mobile menu; implement bottom-sheet type filter for mobile.
4. Update `CommandPalette.tsx` for mobile positioning and sizing.

### Phase 3: Board Layout (2-3 days)

1. Implement column carousel with tab navigation in `Board.tsx`.
2. Implement swipe-to-navigate between columns.
3. Adapt `Column.tsx` for full-width mobile layout.
4. Disable column resizing on mobile.
5. Implement mobile `CardControls` strategy (action sheet).
6. Make card tap open `CardDetailModal` on mobile; add `scrollIntoView` on title focus.
7. Update `AddColumn.tsx` for mobile.
8. Constrain `DragOverlay` to 80% width on mobile.
9. Reposition `OwlAssistant` above the bottom bar on mobile.

### Phase 4: Alternative Views (1-2 days)

1. Implement mobile-friendly `CalendarView` (day list instead of grid; use `md:` breakpoint — 768px — for calendar specifically).
2. Implement card-based `ListView` for mobile (instead of table).
3. Implement card-based `ArchiveModal` content for mobile (instead of table).

### Phase 5: Testing and Polish (1-2 days)

1. Write Playwright mobile viewport tests.
2. Add visual regression snapshots at mobile breakpoints.
3. Test on real devices (iOS Safari, Android Chrome).
4. Add `@media (prefers-reduced-motion: reduce)` to disable backdrop-blur and non-essential transitions in `src/index.css`.
5. Fine-tune spacing, animations, and edge cases.

---

## Testing Plan

### Unit Tests (Vitest)

1. **`useIsMobile` hook:** Test with mocked `matchMedia` returning true/false. Verify it responds to change events.
2. **Sensor configuration:** Verify `PointerSensor` is configured with delay/tolerance.
3. **Conditional rendering logic:** Test that mobile layout components render when `useIsMobile` returns true.

### E2E Tests (Playwright)

**New Playwright projects for mobile viewports:**

Add to `playwright.config.ts`:

```typescript
projects: [
  // Existing desktop projects...
  { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  { name: "mobile-safari", use: { ...devices["iPhone 14"] } },
  { name: "tablet", use: { ...devices["iPad (gen 7)"] } },
],
```

**New test file: `tests-e2e/mobile.spec.ts`**

Test cases:

1. Column carousel displays one column at a time on mobile viewport.
2. Swipe gesture navigates between columns.
3. Column tab navigation works.
4. Tapping a card opens the detail modal.
5. Hamburger menu opens and closes.
6. All menu items (search, view toggle, analytics, settings) are accessible.
7. Modal renders full-screen on mobile.
8. Calendar view shows day-list layout on mobile.
9. List view shows card-based layout on mobile.
10. Add column works from mobile UI.
11. Undo/redo buttons are usable on mobile.

**Visual regression:** Add mobile viewport snapshots to `tests-e2e/visual-regression.spec.ts`.

### Real Device Testing

Before release, manually test on:

- iPhone SE (320px, smallest common viewport)
- iPhone 14/15 (390px, most common iPhone)
- iPad Mini (768px, tablet breakpoint edge)
- Android phone (various, Chrome)
- iPad (1024px, desktop breakpoint edge)

---

## Open Questions

1. **Column reordering on mobile:** Should we support column reordering on mobile at all? Current plan disables it. Alternative: add a "Manage Columns" screen in settings.

2. **Card editing on mobile:** Currently tapping a card focuses the inline textarea for title editing. On mobile, should tapping the card open the detail modal instead? **Recommendation**: on mobile, tap opens the modal; the modal's title field handles editing.

3. **Landscape orientation:** The column carousel works in portrait but in landscape on a phone (568-896px wide), we could fit 2 columns. Should we dynamically adjust? **Recommendation**: defer — the `sm:` breakpoint (640px) will naturally show the tablet layout in landscape on most phones.

4. **@dnd-kit delay vs distance trade-off:** The 200ms delay for drag activation means the UI feels slightly slower to initiate a drag. Test with real users.

5. **Hover-dependent interactions:** Several components use `group-hover` for visibility. **Recommendation**: use `@media (hover: hover)` in CSS for hover-visibility, and `useIsMobile` for layout changes. This way, desktop touch devices (Surface) still get hover behavior via mouse.

6. **Calendar view mobile threshold:** ~~Should the compact calendar kick in at 640px or 768px?~~ **Resolved:** Use `md:` (768px) as the calendar-specific breakpoint. The 7-column grid is too cramped below 768px and the `sm:` (640px) tier will use the day-list layout.

7. **Column count in tab strip:** With many columns (10+), the column selector tabs on mobile will overflow horizontally. The tab strip should be horizontally scrollable with edge fade gradients — `BoardScrollGradients` already exists; confirm it's reusable before building new edge-fade logic.
