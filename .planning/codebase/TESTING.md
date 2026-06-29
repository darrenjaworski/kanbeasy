# Testing Patterns

**Analysis Date:** 2026-06-29

## Test Framework

**Runner:**

- Vitest 4.1.9
- Config: `vitest.config.ts`
- Environment: jsdom (browser DOM simulation for unit tests)

**Assertion Library:**

- Vitest built-in `expect()` (compatible with Jest)
- Testing Library: `@testing-library/react` for component testing
- Additional matchers: `@testing-library/jest-dom` (toBeVisible, toBeDisabled, etc.)

**Run Commands:**

```bash
npm test                   # Run tests in watch mode
npm run test:watch        # Same as above
npm run test:run          # Run all tests once
npm run test:coverage     # Run tests with coverage report
```

## Test File Organization

**Location:**

- All unit tests co-located in `src/__tests__/` directory
- Test files do NOT sit alongside source files
- Example: `src/__tests__/use-undoable-state.test.tsx` tests `src/board/useUndoableState.ts`

**Naming:**

- Kebab-case: `use-undoable-state.test.tsx`, `search-cards.test.tsx`, `column-reorder.test.tsx`
- Pattern: `<feature>.test.tsx` for tests, `<feature>.spec.ts` for E2E (separate)

**Directory structure:**

```
src/
├── __tests__/
│   ├── use-undoable-state.test.tsx
│   ├── search-cards.test.tsx
│   ├── column-delete.test.tsx
│   ├── column-reorder.test.tsx
│   ├── app-shell.test.tsx
│   └── ... (22+ test files)
├── test/
│   ├── setup.ts          # Vitest global setup
│   ├── renderApp.tsx     # Test helper — renders full app
│   ├── renderWithProviders.tsx
│   └── builders.ts       # Test data factories
└── [source files]
```

## Test Structure

**Suite Organization:**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { renderApp } from "../test/renderApp";

describe("search cards", () => {
  beforeEach(() => {
    seedBoard({ columns: [], archive: [] });
  });

  it("disables search input when there are no cards", () => {
    renderApp();
    const searchInput = screen.getByRole("searchbox", {
      name: /search cards/i,
    });
    expect(searchInput).toBeDisabled();
  });
});
```

**Patterns:**

- One `describe()` per feature/component
- `beforeEach()` seeds test data via `seedBoard()` helper (resets board state for each test)
- Each `it()` describes user-facing behavior in plain English

## Test Types

**Unit Tests:**

- Scope: Single hooks or utility functions
- Example: `src/__tests__/use-undoable-state.test.tsx`
  ```typescript
  const { result } = renderHook(() => useUndoableState(0));
  act(() => result.current.setState(1));
  expect(result.current.canUndo).toBe(true);
  ```
- Focus on black-box behavior (what it does, not how)

**Integration Tests:**

- Scope: Components + providers (context, state, hooks)
- Example: `src/__tests__/search-cards.test.tsx`
  - Renders full app via `renderApp()`
  - Simulates user interactions: clicks, typing, tabbing
  - Verifies search highlighting, match count, filter behavior
- Use `userEvent` from `@testing-library/user-event` for realistic input

**E2E Tests:**

- Framework: Playwright (separate from unit tests)
- Location: `tests-e2e/` directory
- Config: `playwright.config.ts`
- Run: `npm run e2e` or `npm run e2e:ui`
- Pattern: `tests-e2e/columns.spec.ts` — drag/drop, navigation, form input
- Browsers: Chromium, Firefox, WebKit (cross-browser)

## Mocking

**Framework:** No mocking library used (vitest.config.ts has no mock setup)

**Patterns:**

- Prefer real dependencies over mocks
- Use test data factories: `makeCard()`, `makeColumn()`, `makeArchivedCard()` (in `src/test/builders.ts`)
- Seed board state: `seedBoard({ columns: [...], archive: [...] })` before tests
- Example: Search test with pre-built cards (lines 234–269 in `search-cards.test.tsx`)

**What to Mock:** (None required)

- User interactions are simulated via `userEvent` (Testing Library)
- Data is seeded via factories and `seedBoard()`
- localStorage is automatically cleared between tests via `setup.ts`

**What NOT to Mock:**

- React Context providers (use real BoardProvider, ThemeProvider)
- Hooks (render via renderHook or via rendered component)
- localStorage (polyfilled and cleared per-test)
- DOM APIs (ResizeObserver, matchMedia polyfilled in `setup.ts`)

## Fixtures and Factories

**Test Data:**
Located in `src/test/builders.ts`:

```typescript
/**
 * Build a Card with sensible defaults. Every field can be overridden.
 *
 * @example
 *   makeCard({ id: "c1", title: "Buy milk" })
 */
export function makeCard(overrides: Partial<Card> & { id: string }): Card {
  return {
    number: ++autoNumber,
    title: "",
    description: "",
    cardTypeId: null,
    dueDate: null,
    createdAt: 0,
    updatedAt: 0,
    columnHistory: [],
    ...overrides,
  };
}

export function makeColumn(
  overrides: Partial<Column> & { id: string },
): Column {
  return {
    title: "",
    cards: [],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

export function makeArchivedCard(
  overrides: Partial<ArchivedCard> & { id: string },
): ArchivedCard {
  return {
    number: ++autoNumber,
    title: "",
    // ... defaults
    archivedAt: 0,
    archivedFromColumnId: "col-1",
    ...overrides,
  };
}
```

**Auto-incrementing card numbers:**

- `autoNumber` counter auto-increments for each card built
- Reset via `resetCardNumber(start)` in `beforeEach()` if tests depend on specific numbers

**seedBoard() helper:**

- Seeds test data directly into localStorage/db
- Located in `src/utils/db.ts`
- Called in `beforeEach()` to establish initial board state
- Example:
  ```typescript
  const now = Date.now();
  seedBoard({
    columns: [
      {
        id: "col-1",
        title: "To Do",
        createdAt: now,
        updatedAt: now,
        cards: [{ id: "card-1", title: "Fix login bug", ... }],
      },
    ],
    archive: [],
  });
  ```

**Render helpers:**

- `renderApp()`: Renders full App with all providers (ThemeProvider, BoardProvider, ClipboardProvider)
- `renderWithProviders()`: (available but less commonly used)
- Located in `src/test/renderApp.tsx`

## Coverage

**Requirements:** No hard target enforced

**View Coverage:**

```bash
npm run test:coverage
```

**Provider:** v8

**Excluded from coverage:** (vitest.config.ts)

- `playwright-report/**`
- `tests-e2e/**`
- Config files: `playwright.config.ts`, `vite.config.ts`, `vitest.config.ts`
- `dist/**`, `vite-env.d.ts`

## Test Setup & Polyfills

**Global Setup:** `src/test/setup.ts`

Runs before every test file (configured in `vitest.config.ts`):

**1. ResizeObserver polyfill (lines 7–26):**

```typescript
class RO {
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe(target: Element) {
    const entry = [{ target }] as unknown as ResizeObserverEntry[];
    this.cb(entry, this as unknown as ResizeObserver);
  }
  unobserve(): void {
    return;
  }
  disconnect(): void {
    return;
  }
}
globalThis.ResizeObserver = RO;
```

- Fires callback once synchronously to approximate initial measure
- Required for components using ResizeObserver (e.g., drag-drop)

**2. matchMedia polyfill (lines 40–51):**

```typescript
window.matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  // ...
});
```

- Returns "no match" by default for all media queries
- Prevents errors in theme system that checks dark mode

**3. localStorage polyfill (lines 57–86):**

- Provides in-memory Storage implementation if Node 26+ shadows window.localStorage
- Allows tests to pass without `--localstorage-file` flag

**4. Per-test cleanup (lines 88–92):**

```typescript
beforeEach(() => {
  resetDb();
  localStorage.clear();
});
```

- Clears in-memory database
- Clears all localStorage keys
- Prevents state leakage between tests

## Common Patterns

**Async Testing:**

```typescript
it("highlights matching cards when searching", async () => {
  const user = userEvent.setup();
  renderApp();

  await user.click(screen.getByRole("button", { name: /add column/i }));
  await user.type(textarea, "Buy groceries");
  await user.tab();

  expect(card).toHaveAttribute("data-search-highlight", "true");
});
```

- Use `userEvent.setup()` for realistic user interactions
- `await user.click()`, `await user.type()`, `await user.tab()`
- `await user.clear()` before typing to replace text

**Testing with DOM queries:**

```typescript
// By role (preferred — most accessible)
screen.getByRole("button", { name: /add column/i });
screen.getByRole("searchbox", { name: /search cards/i });
screen.getByRole("region", { name: /new column/i });

// By testid (when role not available)
screen.getByTestId("card-0");
screen.getByTestId("add-column-button");

// Within a container
within(column).getByRole("button", { name: /add card to/i });
within(column).getAllByTestId(/^card-\d+$/);
```

**Attribute assertions:**

```typescript
expect(card).toHaveAttribute("data-search-highlight", "true");
expect(card).toHaveClass("border-accent");
expect(input).toHaveValue("test header");
```

**Error Testing:**

- No explicit error-case tests observed
- Runtime validation via type guards (see CONVENTIONS.md)
- Invalid data rejected silently during import

**Hook Testing:**

```typescript
import { renderHook, act } from "@testing-library/react";
import { useUndoableState } from "../board/useUndoableState";

const { result } = renderHook(() => useUndoableState(0));
act(() => result.current.setState(1));
expect(result.current.canUndo).toBe(true);
```

- Use `renderHook()` for hook-only tests
- Wrap state updates in `act()`
- Access return value via `result.current`

## E2E Testing

**Framework:** Playwright 1.61.0

**Config:** `playwright.config.ts`

- Base URL: `http://localhost:5173` (dev server) or `E2E_BASE_URL` env var
- Browsers: Chromium, Firefox, WebKit
- Retries: 1 on CI, 0 locally
- Video/screenshot: Retained on failure

**Run Commands:**

```bash
npm run e2e                   # Run all E2E tests
npm run e2e:ui               # Interactive UI mode
npm run e2e:report           # View last HTML report
npm run e2e:visual           # Run visual regression tests only
npm run e2e:snapshot         # Update visual snapshots
E2E_BASE_URL=https://deployed.site npm run e2e  # Test deployed site
```

**Fixtures:**

- Located in `tests-e2e/fixtures.ts` (custom fixtures with seedBoard helper)
- Example: `tests-e2e/columns.spec.ts` uses `test()` from fixtures

**Query pattern:**

```typescript
import { test, expect } from "./fixtures";

test("add a new column to the board", async ({ page }) => {
  await page.getByTestId("add-column-button").click();
  const newColumn = page.getByTestId("column-0");
  await expect(newColumn).toBeVisible();
});
```

**Drag-drop in E2E:**

- Mouse-based drag (compatible with @dnd-kit)
- Example from `tests-e2e/columns.spec.ts` (lines 59–76):

  ```typescript
  const handleBox = await dragHandleFirst.boundingBox();
  const targetBox = await secondColumn.boundingBox();

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 6, startY); // Exceed 5px activation distance
  await page.mouse.move(targetX, targetY, { steps: 12 });
  await page.mouse.up();
  ```

**Visual Regression:**

- Tests: `tests-e2e/visual-regression.spec.ts`
- Run: `npm run e2e:visual`
- Update: `npm run e2e:snapshot`
- Stores baselines in `tests-e2e/__screenshots__/`

---

_Testing analysis: 2026-06-29_
