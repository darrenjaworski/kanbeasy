# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (starts Vite dev server on localhost:5173)
- **Build**: `npm run build` (TypeScript compilation + Vite build)
- **Bundle analysis**: `npm run build:analyze` (opens interactive treemap of bundle contents)
- **Type checking**: `npm run type:check` (TypeScript without emit)
- **Linting**: `npm run lint` (ESLint)
- **Formatting**: `npm run format` (Prettier — write) / `npm run format:check` (Prettier — verify)
- **Unused code**: `npm run knip` (detect unused files, exports, and dependencies)
- **Full validation**: `npm run static-checks` (runs format:check, lint, knip, type-check, build, and test:run)

### Testing

- **Unit tests**: `npm test` or `npm run test:watch` (Vitest with jsdom)
- **Run tests once**: `npm run test:run`
- **Coverage**: `npm run test:coverage`
- **E2E tests**: `npm run e2e` (Playwright across Chromium, Firefox, WebKit)
- **E2E UI**: `npm run e2e:ui` (interactive test runner)
- **E2E report**: `npm run e2e:report` (view last HTML report)
- **Visual regression**: `npm run e2e:visual` (run visual snapshot tests only)
- **Update snapshots**: `npm run e2e:snapshot` (regenerate visual regression baselines)

For deployed environment testing, set `E2E_BASE_URL`:

```bash
E2E_BASE_URL=https://darrenjaworski.github.io/kanbeasy npm run e2e
```

## Architecture Overview

This is a minimal kanban board application built with React + TypeScript + Vite, using:

### Core Stack

- **React 19** with TypeScript and Vite
- **Tailwind CSS** v4 for styling
- **@dnd-kit** for drag and drop functionality
- **Fuse.js** for fuzzy card search
- **Vitest** for unit testing with jsdom environment
- **Playwright** for end-to-end testing

### State Management

The app uses React Context for state management with two main providers:

1. **BoardProvider** (`src/board/`): Manages kanban board state
   - Stores columns and cards data in localStorage (`kanbeasy:board`)
   - `useBoardMutations.ts`: All CRUD operations for columns and cards (addColumn, removeColumn, addCard, updateCard, sortCards, reorderCard, resetBoard, etc.)
   - `useCardSearch.ts`: Fuzzy search over card titles using Fuse.js, returns matching card IDs
   - `useUndoableState.ts`: Generic undo/redo history hook wrapping React state — tracks past/present/future states with configurable max history (50)
   - `useBoardDragAndDrop.ts`: Drag-and-drop state and event handlers for @dnd-kit
   - `validation.ts`: Type guards (`isCard`, `isColumn`) for runtime data validation during loading
   - `migration.ts`: Backfills timestamps on legacy data missing `createdAt`/`updatedAt`

2. **ThemeProvider** (`src/theme/`): Manages UI themes and settings
   - Light/dark mode with system preference detection
   - 6 predefined themes (3 light, 3 dark) defined in `src/theme/themes.ts`
   - Card density settings (small/medium/large)
   - Column resizing and delete warning preferences
   - Applies CSS custom properties (`--color-bg`, `--color-surface`, `--color-text`, `--color-accent`) on `<html>`
   - Persists to localStorage (`kanbeasy:theme`, `kanbeasy:themePreference`, `kanbeasy:cardDensity`, `kanbeasy:columnResizingEnabled`, `kanbeasy:deleteColumnWarning`)

### Data Model

Cards and columns carry timestamps and history for analytics:

- **Card**: `id`, `title`, `createdAt`, `updatedAt`, `columnHistory[]` — where `columnHistory` is an array of `{ columnId, enteredAt }` entries tracking every column transition
- **Column**: `id`, `title`, `cards[]`, `createdAt`, `updatedAt`
- **BoardState**: `{ columns: Column[] }` — the single top-level state object

### Undo/Redo

- `useUndoableState<T>` maintains a `{ past: T[], present: T, future: T[] }` history stack
- Every board mutation pushes to the past stack; undo/redo shift between past/present/future
- No-op mutations (where the setState callback returns the same reference) are skipped to avoid polluting history
- UI: floating Undo/Redo buttons (`UndoRedoControls.tsx`) + keyboard shortcuts Cmd+Z / Cmd+Shift+Z (`useUndoRedoKeyboard.ts`)

### Search

- Fuzzy search via Fuse.js with threshold 0.4 and location-independent matching
- Requires minimum 2 characters before searching
- Returns a `Set<string>` of matching card IDs; cards are highlighted with a blue ring in the UI
- Match count displayed in the search input

### Analytics

- `AnalyticsModal.tsx` displays board metrics computed from card timestamps and column history
- Metrics in `src/utils/boardMetrics.ts` and `src/utils/cycleTime.ts`:
  - Total cards, cards in flight (not in first or last column)
  - Average cycle time (first column → last column)
  - Average reverse time (time spent moving backwards)
  - Throughput (cards completed in last 7/30 days)
  - Per-card cycle time and reverse time tables with pagination

### Feature Flags

- Defined in `src/constants/featureFlags.ts`
- Set to `import.meta.env.DEV` for dev-only features, `true` for shipped features
- Currently both `analytics` and `undoRedo` are `true` (shipped)

### Data Flow

- All data is stored locally using localStorage
- Type-safe state management with TypeScript interfaces
- Context providers wrap the entire app in `main.tsx`

### localStorage Versioning

All localStorage data is part of the export/import system (`src/utils/exportBoard.ts`). The export format includes a `version` field (currently `2`). When making changes to localStorage data structures:

- **Bump the export version number** in `exportBoard.ts` when the shape of stored data changes
- **Write a migration** in the import tool (`src/utils/importBoard.ts`) that can upgrade older export versions to the current version
- This ensures users can export on one version and import on a newer version without data loss
- Storage keys are centralized in `src/constants/storage.ts`

### Component Structure

- `App.tsx`: Main layout with Header, Board, Footer, WelcomeModal, and UndoRedoControls
- `components/Board.tsx`: Main drag-and-drop board implementation
- `components/Column.tsx`: Individual column with inline title editing, card list, resize handle
- `components/SortableCardItem.tsx` & `SortableColumnItem.tsx`: Drag-and-drop wrappers
- `components/ModalHeader.tsx`: Shared modal header (icon + title + close button)
- `components/ToggleSwitch.tsx`: Reusable toggle switch for settings
- `components/MetricCard.tsx`: Reusable metric display card for analytics
- `components/SettingsModal.tsx`: Theme, density, column resizing, export/import, clear data
- `components/AnalyticsModal.tsx`: Board metrics and per-card tables
- `components/SearchInput.tsx`: Fuzzy search input with match count
- `components/UndoRedoControls.tsx`: Floating undo/redo buttons
- `components/icons/`: SVG icon components with barrel export (`index.ts`)
- `hooks/`: Shared hooks with barrel export (`index.ts`) — `useInlineEdit`, `useUndoRedoKeyboard`

### Key Features

- Drag-and-drop cards between columns and within columns
- Undo/redo for all board actions (buttons + keyboard shortcuts)
- Fuzzy card search with highlighting and match count
- Board analytics with cycle time, throughput, and reverse time metrics
- Customizable column management with optional resizing
- 6 color themes with light/dark/system mode
- Card density options (small/medium/large)
- Export/import board data (versioned JSON format with migration)
- Local data persistence
- Welcome modal for first-time users

## Quality Standards

Run `npm run static-checks` routinely as you develop — after implementing changes, after fixing bugs, and before committing. Do not wait until the end of a task to validate; catch issues early and often.

Before making any changes, ensure:

- TypeScript typecheck passes (`npm run type:check`)
- ESLint passes (`npm run lint`)
- Unit tests pass (`npm run test:run`)
- E2E tests pass (`npm run e2e`)
- No `any` types without justification
- New features include tests and cover edge cases

## Testing Approach

- Use Vitest with jsdom environment for unit tests
- Place test files adjacent to source: `*.test.ts(x)` in `src/`
- Use `@testing-library/react` and `@testing-library/user-event` for UI tests
- Focus on black-box testing of observable behavior
- Test setup is configured in `src/test/setup.ts`
- **Write tests alongside code**: Every new feature or bug fix should include corresponding unit tests and/or e2e tests in the same commit. Do not defer test writing to a separate task.

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages:

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code restructuring (no behavior change)
- `style:` formatting, whitespace (no code change)
- `test:` adding or updating tests
- `docs:` documentation only
- `chore:` tooling, dependencies, config
- `perf:` performance improvement

Use lowercase, imperative mood, no period at the end. Include scope when helpful: `feat(theme): add forest dark theme`.

**Before every commit**, add a corresponding entry under the `## [Unreleased]` section of `CHANGELOG.md` in the same commit. This applies to all commit types — `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, `perf:`, etc. Use the appropriate heading (`### Features`, `### Fixed`, `### Changed`, `### Removed`, `### Tests`) following the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. This ensures the changelog is always up to date, and during a release you only need to move items from `[Unreleased]` into the new version heading and review for anything missed.

## Releasing

Follow these steps to prepare a new release:

1. **Determine version bump** by reading commits since the last tag:

   ```bash
   git log $(git describe --tags --abbrev=0)..HEAD --oneline
   ```

   Apply semver based on conventional commits:
   - `fix:` → patch (e.g. 1.1.0 → 1.1.1)
   - `feat:` → minor (e.g. 1.1.0 → 1.2.0)
   - `BREAKING CHANGE` or `!` after type → major (e.g. 1.1.0 → 2.0.0)

2. **Run all checks** — everything must pass before releasing:

   ```bash
   npm run kitchen-sink
   ```

3. **Update ROADMAP.md**:
   - Compare commits since the last tag against items in `ROADMAP.md`
   - Move any completed items from **upcoming** to **shipped** (mark with ✅)
   - Ensure new features not already listed are added to the shipped section

4. **Update CHANGELOG.md**:
   - Move items from `[Unreleased]` into a new version heading
   - Group changes under `### Features`, `### Fixed`, `### Changed`, `### Removed` as appropriate
   - Derive entries from the conventional commit messages since the last tag
   - Follow the existing [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format

5. **Bump version and tag**:

   ```bash
   npm version <patch|minor|major>
   ```

   This updates `package.json`, creates a commit, and creates a git tag.

6. **Verify the build** compiles cleanly at the new version:
   ```bash
   npm run build
   ```

## Dependencies

Minimize the number of dependencies. Before adding any new package, evaluate:

- **Bundle size**: Check the gzipped size on [bundlephobia.com](https://bundlephobia.com). Prefer smaller libraries — every kilobyte counts for a client-side app. Use `npm run build:analyze` to verify actual impact after adding.
- **Maintenance**: Check the npm page and GitHub repo. Prefer packages that are actively maintained (recent commits, responsive issues), have a healthy contributor base, and are not deprecated.
- **Transitive dependencies**: Fewer is better. A package that pulls in dozens of sub-dependencies adds supply-chain risk and bloat. Prefer packages with zero or minimal dependencies.
- **Necessity**: Before reaching for a library, consider whether the functionality can be implemented in a small amount of code. A 20-line utility is better than a 20 KB dependency.

When proposing a new dependency, state the gzipped size and dependency count so we can make an informed decision.

## Code Conventions

- Strict TypeScript with no implicit `any`
- Export precise types for shared data models
- Components and hooks must be fully typed
- Follow existing patterns for Context providers and hooks
- Keep components lean and avoid unnecessary re-renders
