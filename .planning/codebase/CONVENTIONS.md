# Coding Conventions

**Analysis Date:** 2026-06-29

## Naming Patterns

**Files:**

- Components: PascalCase (e.g., `SearchInput.tsx`, `Board.tsx`, `CardDetailModal.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useInlineEdit.ts`, `useBoardMutations.ts`, `useCardMutations.ts`)
- Utilities/helpers: camelCase (e.g., `dragUtils.ts`, `validation.ts`, `migration.ts`)
- Types: PascalCase exported from `types.ts` files (e.g., `Board.types.ts` → `Card`, `Column`, `BoardState`)

**Functions:**

- Use camelCase, imperative mood: `addCard`, `removeCard`, `updateCard`, `sortCards`, `reorderCard`
- Hooks always start with `use`: `useBoard`, `useBoardMutations`, `useCardMutations`, `useTheme`
- Validation/type guards: `isCard`, `isColumn`, `isArchivedCard` (predicate pattern)

**Variables:**

- Use camelCase: `activeCard`, `selectedTypeIds`, `columnOrderLocked`, `matchingCardIds`
- Refs end with `Ref`: `containerRef`, `buttonRef`, `popoverRef`, `nextCardNumberRef`
- State setters use `set` prefix: `setState`, `setColumns`, `setSearchQuery`, `setDetailCardId`

**Types:**

- Use PascalCase for all exported types: `Card`, `Column`, `BoardState`, `CardClipboard`, `BoardContextValue`
- Use `Readonly<T>` wrapper for immutable data structures (see `src/board/types.ts`)
- Discriminated unions via type composition: `Card & Readonly<{ archivedAt: number }>` for `ArchivedCard`

**Component Props:**

- Props types suffixed with object literal inline: `export function SearchInput({ fullWidth = false }: { fullWidth?: boolean })`
- When multiple props, define interface: `type Options = Readonly<{ originalValue: string; onSave: (value: string) => void; ... }>`

## Code Style

**Formatting:**

- Tool: Prettier (config: `.prettierrc`)
- Line width: 80 characters
- Quotes: Double quotes (`"`)
- Semicolons: Always included
- Trailing commas: All (objects, arrays, function params)
- Tabs: 2 spaces

**Linting:**

- Tool: ESLint with TypeScript (config: `eslint.config.js`)
- Strict equality: `eqeqeq` enforced (`===` and `!==` only)
- No console.log: Disallowed unless explicitly `console.warn()` or `console.error()`
- Prefer const: Variables never reassigned must use `const`
- No unused variables: `@typescript-eslint/no-unused-vars` error, underscore prefix `_arg` allows intentional ignores

## Import Organization

**Order:**

1. React and external libraries (e.g., `import { useCallback } from "react"`)
2. Internal components, hooks, and utilities (e.g., `import { Board } from "./components/board/Board"`)
3. Type imports (e.g., `import type { Card, Column } from "./board/types"`)

**Type imports:**

- All type-only imports use `import type` syntax (enforced by `@typescript-eslint/consistent-type-imports`)
- Example: `import type { RefObject } from "react"; import { useCallback } from "react";`

**Path organization:**

- No path aliases configured in tsconfig; all imports use relative paths
- Example: `import { useBoard } from "../../board/useBoard"`
- Test utilities import from `../utils/db`, `../test/renderApp`

**Barrel exports:**

- Used strategically: `src/hooks/index.ts`, `src/components/icons/index.ts`
- Simplifies consumer imports: `import { useInlineEdit, useUndoRedoKeyboard } from "../../hooks"`

## Error Handling

**Patterns:**

- Runtime validation via type guards (discriminated unions and assertion functions)
  - `isCard(x): x is Card` — checks `id` string and `title` string
  - `isColumn(x): x is Column` — checks `id`, `title` strings and validates all cards
  - `isArchivedCard(x): x is ArchivedCard` — extends `isCard`, adds `archivedAt` and `archivedFromColumnId`
- Located in `src/board/validation.ts`

**Application-level:**

- Data mutations use conditional early returns to skip stale operations:
  ```typescript
  const idx = prev.columns.findIndex((c) => c.id === columnId);
  if (idx === -1) return prev; // Column not found — skip mutation
  ```
- Example: `src/board/useCardMutations.ts` lines 49–51 (removeCard)

**Consumer responsibility:**

- Errors are typically averted by defensive coding (guards before access)
- No try/catch blocks observed; localStorage read/write handled silently via Context
- Invalid data is rejected during import via type guard validation in `src/utils/importBoard.ts`

## Logging

**Framework:** `console` (standard JavaScript)

**Patterns:**

- Disallowed by default: `console.log` flagged as warning by ESLint
- Allowed: `console.warn()` and `console.error()` for intentional logging
- Configured in `eslint.config.js` rule: `"no-console": ["warn", { allow: ["warn", "error"] }]`

**Use cases:**

- No application-level logging observed in source code
- Development only: Console methods are used ad-hoc during debugging (not in production code)

## Comments

**When to Comment:**

- Clarify non-obvious edge cases or workarounds
- Example: `src/test/setup.ts` line 19 — "No-op for tests (non-empty to satisfy lint)"
- Example: `src/test/setup.ts` line 54 — "Node 26 introduced a built-in `localStorage` global..." (environment quirk)

**JSDoc/TSDoc:**

- Used in builder functions to document usage: `src/test/builders.ts`
  - `@example` blocks show typical call patterns
  - Parameter descriptions explain overrides

**Code clarity preferred over comments:**

- Variable names are self-documenting: `escaping.current`, `showMatchCount`, `filterDisabled`
- Logic is simple and direct; comments only when environment or API demands explanation

## Function Design

**Size:** Functions are typically 20–60 lines; hooks and components are kept focused

- Example: `useInlineEdit` is ~50 lines, handles single responsibility (inline edit state)
- Example: `SearchInput` is ~165 lines, manages search input + filter UI in one component

**Parameters:**

- Accept options object when multiple params (seen in `useInlineEdit({ originalValue, onSave, onRevert, multiline })`
- Callback props are typed: `onSave: (value: string) => void`

**Return Values:**

- Hooks return objects with named fields: `{ onKeyDown, onBlur }`
- Mutations return IDs or void: `addCard(...): string`, `removeCard(...): void`
- Data accessors are typed: `columns: Column[]`

## Module Design

**Exports:**

- Named exports preferred (no default exports from utilities)
- Example: `export function useBoard() { ... }` in `src/board/useBoard.ts`
- Exception: Components may export as default in rare cases; src/App.tsx uses `export default App`

**Barrel files:**

- Used for hook exports: `src/hooks/index.ts` exports all custom hooks
- Used for icon components: `src/components/icons/index.ts`
- Simplifies imports for consumers

**File-to-responsibility mapping:**

- One primary export per file (especially hooks and components)
- Utilities in `src/utils/` and `src/board/` are narrowly scoped
  - `dragUtils.ts` — drag/drop utilities only
  - `validation.ts` — type guards only
  - `migration.ts` — localStorage migration only

## TypeScript Specifics

**Strict mode enabled:** `tsconfig.app.json`

- `strict: true` — enforces null/undefined checks, implicit any disallowed
- `noUnusedLocals: true` — unused variables are errors
- `noUnusedParameters: true` — unused function params are errors

**Type precision:**

- All types are explicitly defined; no implicit `any`
- Example: `type Options = Readonly<{ originalValue: string; onSave: (value: string) => void; ... }>`
- Props types inline: `{ fullWidth?: boolean }`

**Immutability:**

- Use `Readonly<T>` wrapper on data types: `Card`, `Column`, `BoardState`
- Mutations create shallow copies: `col.cards.slice()` before modifying

---

_Convention analysis: 2026-06-29_
