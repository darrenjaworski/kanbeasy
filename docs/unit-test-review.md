# Unit Test Review

729 tests across 71 files. The suite is generally solid and well-structured, but has accumulated maintainability debt. The biggest systemic issues are **duplicated test helpers**, **Tailwind class assertions**, and **tight coupling to implementation details**.

---

## 1. ~~Duplicated Seed Data Builders~~ ✅ DONE

Resolved: Shared builders extracted to `src/test/builders.ts` and all 13 test files migrated.

~~The most widespread problem. `makeCard()`, `makeColumn()`, and `makeArchivedCard()` are independently redefined in **5+ files** with slightly different signatures:~~

| Location | Signature difference |
|---|---|
| `dragUtils.test.ts` | Global counter, takes `columnId` |
| `cycleTime.test.ts` | Global `cardNum` counter |
| `boardMetrics.test.ts` | Global `cardNum` counter |
| `useBoardMutations.test.ts` | No counter |
| `ListView.test.tsx` | Takes overrides object |
| `CalendarView.test.tsx` | Takes overrides object |
| `AnalyticsModal.test.tsx` | Different defaults |

**Recommendation**: Extract a single set of builders to `src/test/builders.ts`:
```ts
export function makeCard(id: string, overrides?: Partial<Card>): Card { ... }
export function makeColumn(id: string, cards?: Card[], overrides?: Partial<Column>): Column { ... }
```

---

## 2. ~~Tailwind Class Assertions~~ ✅ DONE

Resolved: Added `data-search-highlight`, `data-side`, and `data-heat-level` attributes to components. Tests now assert on data attributes instead of Tailwind classes. Removed brittle `opacity-0` and `pointer-events-none` assertions.

~~Multiple test files assert on specific CSS classes that will break on any styling refactor.~~

---

## 3. ~~Duplicated Provider/Context Boilerplate~~ ✅ DONE

Resolved: Created `src/test/renderWithProviders.tsx` with shared `makeThemeContext`, `makeBoardContext`, `makeClipboardContext` factories and a `renderWithProviders` wrapper. Updated `badgeHeatColumn.test.tsx`, `ColumnResize.test.tsx`, and `Column.test.tsx` to use it. Also fixed missing `compactHeader` field in theme mocks.

---

## 4. Implementation-Coupled Tests (MEDIUM -- Validity)

- **`useBoardMutations.test.ts`** (910 lines): Extracts `setState` callbacks from mock calls via `applyLatest()` helper, then manually reconstructs state. Tests *how* the hook updates state internally rather than *what* the resulting state looks like. If the hook's internal setState pattern changes, all 55 tests break.

- **`useBoardDragAndDrop.test.ts`**: 70-line mock event builders (`createDragStartEvent`, `createDragEndEvent`) that construct deeply nested `@dnd-kit` event objects. Tests blur behavior on `document.activeElement` -- an implementation detail.

- **`OwlBuddy.test.tsx`** (lines 144-177): Tests night owl mode by querying SVG internals (`svg?.querySelector("ellipse")`). Will break if the icon changes from `<ellipse>` to `<circle>`.

**Recommendation**: Test observable outputs. For `useBoardMutations`, use `renderHook` with real state. For OwlBuddy, add `data-testid="sleepy-owl"` instead of querying SVG structure.

---

## 5. Repetitive Tests That Should Be Parameterized (MEDIUM -- Maintainability)

- **`importBoard.test.ts`**: Version acceptance tests (v2, v3, v4, v5, v6, v7, v8) are identical except the version number. Should be `it.each`.

- **`badgeHeat.test.ts`**: Four separate tests for "returns null for edge columns" with hardcoded inputs. One `it.each` would cover them.

- **`validation.test.ts`**: 20+ individual tests for type guard field checks (`"returns false when id is not a string"`, `"returns false when title is not a string"`). These could be consolidated.

---

## 6. Weak/Vague Assertions (MEDIUM -- Validity)

- **`AnalyticsModal.test.tsx`**: Asserts `getByText("3")` and `getByText("2")` exist somewhere in the modal without scoping to the specific metric card. These would pass even if the numbers appeared in the wrong metric.

- **`exportBoard.test.ts`**: Captures the exported JSON but only checks `blob.type === "application/json"`. Doesn't verify the actual exported data structure.

- **`formatDate.test.ts`**: Uses regex like `expect(result).toContain("Jun")` instead of checking the full formatted string.

---

## 7. Missing Test Coverage (LOW-MEDIUM)

| Area | What's missing |
|---|---|
| **Drag-and-drop** | No real DnD interaction tests; all mocked |
| **Negative paths** | `formatCardId` with invalid inputs, `cycleTime` with out-of-order timestamps |
| **Accessibility** | `ConfirmDialog` missing focus trap, Escape key, backdrop click tests |
| **Edge cases** | Archiving same card twice, drag card to itself, import with circular refs |

---

## 8. Minor Issues (LOW)

- **`ColumnResize.test.tsx`**: Uses `fireEvent` instead of `userEvent` for mouse interactions -- less realistic
- **`isNightOwlHour.test.ts` line 42**: Tests `typeof isNightOwlHour() === "boolean"` -- trivially always true
- **Hardcoded timestamps**: `vi.setSystemTime(new Date("2025-06-15"))` repeated independently in 5+ files
- **Inconsistent query strategy**: Some files rely heavily on `testId`, others use accessible queries (role, label). No consistent convention.

---

## Recommendations -- Priority Order

### 1. Create shared test utilities (`src/test/builders.ts`, `src/test/renderWithProviders.tsx`)
- Single `makeCard`, `makeColumn`, `makeArchivedCard` with overrides
- Lightweight provider wrapper for component tests
- Shared time fixtures for `vi.setSystemTime`
- This is the highest-ROI change -- reduces duplication across 15+ files

### 2. Replace CSS class assertions with data attributes
- Add `data-highlighted`, `data-heat-level`, `data-position` to components
- Update tests to assert on semantic attributes instead of Tailwind classes
- Prevents breakage during the planned theme class refactor

### 3. Parameterize repetitive tests with `it.each`
- `importBoard.test.ts` version tests
- `badgeHeat.test.ts` edge column tests
- `validation.test.ts` field type checks

### 4. Strengthen weak assertions
- Scope `AnalyticsModal` metric assertions to their parent MetricCard
- Add JSON structure verification to `exportBoard.test.ts`
- Use exact format checks in `formatDate.test.ts`

### 5. Consider splitting `useBoardMutations.test.ts`
- 910 lines in one file is hard to navigate
- Split by mutation type: `addColumn.test.ts`, `moveCard.test.ts`, etc.
- Refactor away from `applyLatest` pattern to test via rendered output
