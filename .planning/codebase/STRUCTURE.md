# Codebase Structure

**Analysis Date:** 2026-06-29

## Directory Layout

```
kanbeasy/
├── src/
│   ├── main.tsx                    # Vite entry point: renders React root with provider hierarchy
│   ├── App.tsx                     # Main app component: routes between views, manages command palette
│   ├── index.css                   # Tailwind CSS, custom CSS variables, reset
│   ├── vite-env.d.ts               # Vite type definitions
│   │
│   ├── board/                      # Board state management and mutations
│   │   ├── BoardProvider.tsx       # Main provider: initializes state, loads from db, composes mutations
│   │   ├── BoardContext.tsx        # Context definition and type
│   │   ├── types.ts                # Card, Column, BoardState type definitions
│   │   ├── useBoard.ts             # Hook to access BoardContext
│   │   ├── useBoardMutations.ts    # Composes all mutation hooks (column, card, type, archive)
│   │   ├── useColumnMutations.ts   # addColumn, updateColumn, removeColumn
│   │   ├── useCardMutations.ts     # addCard, updateCard, removeCard, moveCard, duplicateCard
│   │   ├── useCardTypeMutations.ts # renameCardType, clearCardType
│   │   ├── useArchiveMutations.ts  # archiveCard, restoreCard, deleteCard operations
│   │   ├── useUndoableState.ts     # Generic undo/redo hook: maintains past/present/future history
│   │   ├── useBoardDragAndDrop.ts  # @dnd-kit drag state and event handlers
│   │   ├── useCardSearch.ts        # Fuzzy search via Fuse.js, type filtering
│   │   ├── validation.ts           # Type guards: isCard, isColumn, isArchivedCard
│   │   ├── migration.ts            # Backfill timestamps, assign card numbers on load
│   │   ├── dragUtils.ts            # Helper: findCardWithColumn, etc.
│   │   ├── ClipboardProvider.tsx   # Clipboard context for copy/paste cards
│   │   ├── ClipboardContext.tsx    # Clipboard context definition
│   │   └── useClipboard.ts         # Hook: copyCard, pasteCard, clipboardState
│   │
│   ├── components/                 # UI components organized by domain
│   │   ├── App-level components:
│   │   │   ├── AppLoader.tsx       # Initializes IndexedDB and host bridge, suspense boundary
│   │   │   ├── Header.tsx          # Top bar with settings, analytics, archive buttons
│   │   │   ├── BottomBar.tsx       # Bottom bar with undo/redo, keyboard shortcuts hint
│   │   │   ├── CommandPalette.tsx  # Keyboard-driven action palette (Cmd+K)
│   │   │   ├── WelcomeModal.tsx    # First-time user onboarding modal
│   │   │   ├── OwlBuddy.tsx        # Easter egg owl character with tips
│   │   │   ├── ViewToggle.tsx      # Board/List/Calendar view switcher
│   │   │   ├── SearchInput.tsx     # Fuzzy search and type filter input
│   │   │
│   │   ├── board/                  # Kanban board components
│   │   │   ├── Board.tsx           # Main board orchestrator: routes to Desktop/Mobile, manages detail modal
│   │   │   ├── DesktopBoard.tsx    # Horizontal multi-column layout with @dnd-kit
│   │   │   ├── MobileBoard.tsx     # Single-column tab-based layout for mobile
│   │   │   ├── BoardColumnTabs.tsx # Mobile tabs showing active column
│   │   │   ├── Column.tsx          # Single column: title edit, card list, add button, resize
│   │   │   ├── CardList.tsx        # Renders cards in a column (SortableCardItem wrappers)
│   │   │   ├── SortableCardItem.tsx # @dnd-kit wrapper for individual card
│   │   │   ├── SortableColumnItem.tsx # @dnd-kit wrapper for individual column
│   │   │   ├── CardDetailModal.tsx # Full card editor modal with title, description, type, due date
│   │   │   ├── CardControls.tsx    # Action buttons on card: drag, copy, delete, archive
│   │   │   ├── DescriptionField.tsx # Markdown editor for card description
│   │   │   ├── ColumnTitleEdit.tsx # Inline title editor for column
│   │   │   ├── ColumnCardCountBadge.tsx # Badge showing card count in column
│   │   │   ├── ColumnResizeHandle.tsx # Resize handle for column width
│   │   │   ├── AddColumn.tsx       # "Add column" button/placeholder
│   │   │   ├── BoardDragOverlay.tsx # Drag overlay preview
│   │   │   ├── BoardScrollGradients.tsx # Fade gradients for horizontal scroll
│   │   │   ├── useColumnResize.ts  # Hook: handle column width resizing
│   │   │   └── useBoardScroll.ts   # Hook: manage horizontal scroll state and gradients
│   │   │
│   │   ├── settings/               # Settings modal sections
│   │   │   ├── SettingsModal.tsx   # Main settings modal orchestrator
│   │   │   ├── SettingsSection.tsx # Reusable collapsible settings section
│   │   │   ├── ThemeSection.tsx    # Theme (light/dark) and theme picker
│   │   │   ├── BoardSettingsSection.tsx # Card density, column resize, column order lock
│   │   │   ├── CardTypeSection.tsx # Card type preset picker and custom type editor
│   │   │   └── DataSection.tsx     # Export, import, clear all data
│   │   │
│   │   ├── analytics/              # Analytics modal
│   │   │   ├── AnalyticsModal.tsx  # Main analytics modal
│   │   │   ├── MetricCard.tsx      # Single metric display card
│   │   │   └── MetricsTable.tsx    # Per-card analytics table with pagination
│   │   │
│   │   ├── archive/                # Archive modal
│   │   │   ├── ArchiveModal.tsx    # Archived cards list with restore/delete
│   │   │   └── ArchiveTableRow.tsx # Single archived card row
│   │   │
│   │   ├── shared/                 # Reusable UI components
│   │   │   ├── Modal.tsx           # Base modal component
│   │   │   ├── ModalHeader.tsx     # Modal header with icon, title, close button
│   │   │   ├── ToggleSwitch.tsx    # Toggle switch component
│   │   │   ├── ConfirmDialog.tsx   # Confirmation dialog for destructive actions
│   │   │   ├── Tooltip.tsx         # Tooltip component
│   │   │   ├── CardTypeBadge.tsx   # Colored badge for card type
│   │   │   ├── DueDateBadge.tsx    # Badge showing due date status
│   │   │   ├── ChecklistProgress.tsx # Progress bar for markdown checklist
│   │   │   ├── MarkdownPreview.tsx # Render markdown with checklist support
│   │   │   └── SelectChevron.tsx   # Chevron icon for select elements
│   │   │
│   │   ├── icons/                  # SVG icon components (exported via index.ts)
│   │   │   ├── index.ts            # Barrel export of all icons
│   │   │   ├── AnalyticsIcon.tsx
│   │   │   ├── ArchiveIcon.tsx
│   │   │   ├── BoardViewIcon.tsx
│   │   │   ├── CalendarIcon.tsx
│   │   │   ├── ListViewIcon.tsx
│   │   │   ├── SettingsGearIcon.tsx
│   │   │   └── [other icon components...]
│   │   │
│   │   ├── ListView.tsx            # Table-based view of all cards
│   │   ├── CalendarView.tsx        # Calendar view of cards by due date
│   │   └── __tests__/              # Component tests (*.test.tsx)
│   │
│   ├── theme/                      # Theme and settings management
│   │   ├── ThemeProvider.tsx       # Theme context provider: light/dark, themes, card density, view mode
│   │   ├── ThemeContext.tsx        # Theme context definition
│   │   ├── useTheme.ts             # Hook to access ThemeContext
│   │   ├── themes.ts               # 12 theme definitions (6 light, 6 dark) with color values
│   │   ├── types.ts                # ThemeMode, CardDensity, ViewMode, ThemeContextValue types
│   │   ├── classNames.ts           # tc object with Tailwind class tokens (base + composites)
│   │   ├── favicon.ts              # Update favicon based on theme
│   │   ├── useStoredSetting.ts     # Hook: read/write to localStorage with validation
│   │   └── __tests__/              # Theme tests
│   │
│   ├── constants/                  # Application constants
│   │   ├── storage.ts              # STORAGE_KEYS: IndexedDB key names for all persisted values
│   │   ├── behavior.ts             # MAX_UNDO_HISTORY, WRITE_DEBOUNCE_MS, search thresholds
│   │   ├── cardTypes.ts            # CARD_TYPE_PRESETS, DEFAULT_PRESET_ID, predefined card type definitions
│   │   ├── column.ts               # Default column width, min/max, step values
│   │   ├── featureFlags.ts         # Feature flags (currently analytics and undoRedo both true)
│   │   └── owlTips.ts              # Owl buddy tips for the easter egg
│   │
│   ├── utils/                      # Utility functions and persistence layer
│   │   ├── db.ts                   # IndexedDB abstraction: openDatabase, getBoard, saveBoard, kvGet/kvSet
│   │   │                            # Includes: localStorage migration, host bridge subscription
│   │   ├── hostBridge.ts           # MCP communication: isHostMode, postToHost, onHostMessage
│   │   ├── exportBoard.ts          # Export board to JSON with version field
│   │   ├── importBoard.ts          # Import board with version migration (legacy compat)
│   │   ├── boardMetrics.ts         # Calculate: total cards, in-flight, cycle time, throughput, reverse time
│   │   ├── cycleTime.ts            # Compute cycle time and reverse time for individual cards
│   │   ├── checklistStats.ts       # Parse markdown checklist and count completed items
│   │   ├── dnd.ts                  # Drag-and-drop helper utilities
│   │   ├── dragUtils.ts            # findCardWithColumn, column/card validators
│   │   ├── formatCardId.ts         # Format card ID for display (e.g., "#1")
│   │   ├── formatDate.ts           # Format timestamps as readable dates
│   │   ├── isNightOwlHour.ts       # Check if current time is night (for owl buddy)
│   │   ├── toggleMarkdownCheckbox.ts # Toggle checkbox in markdown (for card description)
│   │   └── __tests__/              # Utility tests
│   │
│   ├── hooks/                      # Shared React hooks
│   │   ├── index.ts                # Barrel export
│   │   ├── useDocumentKeyDown.ts   # Listen for document-level keyboard events
│   │   ├── useKeyboardShortcuts.ts # Register keyboard shortcuts (Cmd+K, Cmd+Z, etc.)
│   │   ├── useUndoRedoKeyboard.ts  # Cmd+Z / Cmd+Shift+Z undo/redo shortcuts
│   │   ├── useInlineEdit.ts        # Manage inline text editing state
│   │   ├── useIsMobile.ts          # Detect mobile viewport
│   │   ├── useSwipeNavigation.ts   # Swipe left/right for mobile view switching
│   │   └── __tests__/              # Hook tests
│   │
│   ├── test/                       # Test utilities and setup
│   │   ├── setup.ts                # Vitest setup: jsdom environment, mocking
│   │   ├── renderApp.tsx           # Render full app with providers for integration tests
│   │   ├── renderWithProviders.tsx # Render component with board/theme providers
│   │   └── builders.ts             # Test data builders: buildCard, buildColumn, etc.
│   │
│   └── __tests__/                  # Top-level integration tests
│
├── e2e/                            # Playwright end-to-end tests
│   └── [test files organized by feature]
│
├── docs/                           # Documentation
│   ├── README.md                   # Project overview
│   ├── refactor-review.md          # Ranked list of refactor candidates
│   └── [other docs]
│
├── .agents/                        # Claude Code agent skills (if any)
├── .claude/                        # Claude Code configuration
├── .github/workflows/              # GitHub Actions CI/CD
├── .vscode/                        # VS Code settings
│
├── package.json                    # Dependencies, scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
├── vitest.config.ts                # Vitest test configuration
├── playwright.config.ts            # Playwright E2E configuration
├── eslint.config.js                # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── knip.config.ts                  # Knip unused code detection
│
├── index.html                      # HTML entry point
├── CHANGELOG.md                    # Version history with entries per commit
├── ROADMAP.md                      # Feature roadmap (upcoming vs shipped)
└── AGENTS.md                       # Claude Code agent documentation
```

## Directory Purposes

**`src/board/`** — Board state management and mutations

- Purpose: Centralize all kanban board logic (columns, cards, search, undo/redo, archive)
- Contains: Context providers, mutation hooks, data types, validation, persistence hooks
- Key files: BoardProvider.tsx (orchestrator), useBoard\* (mutation composition), useUndoableState (history)

**`src/components/`** — React UI components organized by feature domain

- Purpose: Render the user interface (kanban views, modals, settings)
- Contains: Component hierarchy split into: board (kanban), settings (modal sections), analytics, archive, shared (reusable), icons
- Key subdirectories:
  - `board/`: Kanban display and editing components
  - `settings/`: Settings modal sections (theme, board, card types, data)
  - `analytics/`: Analytics modal and metric displays
  - `archive/`: Archive viewing and management
  - `shared/`: Reusable UI components (Modal, ToggleSwitch, Tooltip, etc.)
  - `icons/`: SVG icon components

**`src/theme/`** — Theme and appearance configuration

- Purpose: Centralize theme logic (light/dark modes, color selection, card density, view modes)
- Contains: ThemeProvider, theme definitions (12 themes), CSS class tokens, favicon
- Key files: themes.ts (color definitions), classNames.ts (tc object), useTheme.ts (hook)

**`src/constants/`** — Application-wide constants and configuration

- Purpose: Centralize magic strings, default values, feature flags
- Contains: Storage key names, behavior thresholds, card type presets, feature flags
- Key files: storage.ts (STORAGE_KEYS), behavior.ts (MAX_UNDO_HISTORY, WRITE_DEBOUNCE_MS)

**`src/utils/`** — Utility functions and persistence layer

- Purpose: Cross-cutting logic and storage abstraction
- Contains: IndexedDB/localStorage management, data export/import, metrics calculation, formatters
- Key files: db.ts (persistence layer), hostBridge.ts (MCP integration), boardMetrics.ts (analytics)

**`src/hooks/`** — Reusable React hooks

- Purpose: Encapsulate React logic for reuse across components
- Contains: Keyboard shortcuts, inline editing, mobile detection, swipe navigation
- Key files: useKeyboardShortcuts.ts, useUndoRedoKeyboard.ts, useIsMobile.ts

**`src/test/`** — Test utilities and setup

- Purpose: Shared test infrastructure (providers, builders, setup)
- Contains: Vitest configuration, test renderers with providers, test data builders
- Key files: setup.ts (Vitest setup), renderWithProviders.tsx (component testing)

**`e2e/`** — End-to-end tests via Playwright

- Purpose: Test complete user workflows across browsers
- Command: `npm run e2e` (Chromium, Firefox, WebKit)

**`docs/`** — Project documentation

- Purpose: Guide contributors on architecture, refactoring, roadmap
- Key files: refactor-review.md (ranked refactor candidates), README.md (overview)

## Key File Locations

**Entry Points:**

- `index.html`: Static HTML with `<div id="root">`
- `src/main.tsx`: Vite entry point, renders React app with provider hierarchy
- `src/App.tsx`: Main component, routes between views and renders layout

**Configuration:**

- `vite.config.ts`: Vite build config
- `tsconfig.json`: TypeScript compiler options
- `vitest.config.ts`: Unit test runner config
- `playwright.config.ts`: E2E test runner config

**Core Logic:**

- `src/board/BoardProvider.tsx`: Board state orchestrator
- `src/theme/ThemeProvider.tsx`: Theme state orchestrator
- `src/utils/db.ts`: Persistence layer (IndexedDB, localStorage, host bridge)
- `src/constants/storage.ts`: Storage key definitions

**Kanban Views:**

- `src/components/board/Board.tsx`: Main board controller
- `src/components/board/DesktopBoard.tsx`: Multi-column layout
- `src/components/board/MobileBoard.tsx`: Single-column layout
- `src/components/board/Column.tsx`: Individual column component

**Modals:**

- `src/components/settings/SettingsModal.tsx`: Settings with theme, density, data management
- `src/components/analytics/AnalyticsModal.tsx`: Board metrics and per-card analytics
- `src/components/archive/ArchiveModal.tsx`: Archived cards management
- `src/components/board/CardDetailModal.tsx`: Full card editor

**Alternative Views:**

- `src/components/ListView.tsx`: Table-based view of all cards
- `src/components/CalendarView.tsx`: Calendar-based view by due date

## Naming Conventions

**Files:**

- Component files: PascalCase (e.g., `Board.tsx`, `CardDetailModal.tsx`)
- Hook files: camelCase with `use` prefix (e.g., `useBoard.ts`, `useUndoableState.ts`)
- Utility files: camelCase (e.g., `boardMetrics.ts`, `exportBoard.ts`)
- Type definition files: `types.ts` (e.g., `src/board/types.ts`, `src/theme/types.ts`)
- Test files: `*.test.ts` or `*.test.tsx` (co-located with source)

**Directories:**

- Feature domains: lowercase, plural when containing multiple related files (e.g., `components/`, `utils/`, `board/`)
- Modular sections: lowercase (e.g., `board/`, `settings/`, `analytics/`, `archive/`, `shared/`)
- Constants: `constants/` — centralized configuration
- Test directories: `__tests__/` — mirrors source structure (e.g., `src/board/__tests__/`, `src/components/board/__tests__/`)

**Types and Constants:**

- Exported type names: PascalCase (e.g., `Card`, `Column`, `BoardState`, `ThemeMode`)
- Exported const objects: UPPER_SNAKE_CASE (e.g., `STORAGE_KEYS`, `CARD_TYPE_PRESETS`, `SEARCH_FUZZY_THRESHOLD`)
- Interface names: PascalCase with "Definition" or "Value" suffix for clarity (e.g., `ThemeDefinition`, `BoardContextValue`)

## Where to Add New Code

**New Feature (e.g., card tags/labels):**

- Primary code:
  - State logic: `src/board/useTagMutations.ts` (new hook for tag operations)
  - Context type: Update `src/board/types.ts` to add tag fields to `Card`
  - Mutations: Include in `src/board/useBoardMutations.ts` composition
- UI:
  - Card display: Update `src/components/board/CardDetailModal.tsx` (add tag picker)
  - Card detail modal: Add tag field and editor
- Tests:
  - Unit: `src/board/__tests__/useTagMutations.test.ts`
  - Component: `src/components/board/__tests__/CardDetailModal.test.tsx`

**New Modal/View:**

- Component: `src/components/[feature]/[FeatureName].tsx`
- Hook to toggle open: Lift state to `App.tsx` (e.g., `useState<boolean>`)
- Context (if needed): Create `src/[domain]/[Feature]Context.tsx` + `[Feature]Provider.tsx`
- Tests: `src/components/[feature]/__tests__/[FeatureName].test.tsx`

**New Utility Function:**

- If board-agnostic: `src/utils/[descriptive-name].ts`
- If board-specific: Consider adding to `src/board/` (e.g., card search is in `useCardSearch.ts`)
- Tests: `src/utils/__tests__/[descriptive-name].test.ts`

**New Theme Variant:**

- Add to `src/theme/themes.ts` themes array with id, name, mode, colors
- Update `src/theme/types.ts` if adding new theme mode or settings
- Test: `src/theme/__tests__/themes.test.ts`

**New Keyboard Shortcut:**

- Register in `src/hooks/useKeyboardShortcuts.ts` or `useUndoRedoKeyboard.ts`
- Add help text in `CommandPalette.tsx` or BottomBar

**New Stored Setting:**

- Add key to `src/constants/storage.ts` (STORAGE_KEYS object)
- Add getter/setter in `ThemeProvider.tsx` (for UI settings) or `BoardProvider.tsx` (for board settings)
- Read/write via `kvGet`/`kvSet` from `src/utils/db.ts`

**New Test:**

- Unit test: Co-locate with source (e.g., `src/board/useCardMutations.test.ts` next to `src/board/useCardMutations.ts`)
- Component test: `src/components/[domain]/__tests__/[Component].test.tsx`
- E2E test: `e2e/[feature].spec.ts`

## Special Directories

**`src/__tests__/`** — Top-level integration tests

- Generated: No (checked into git)
- Committed: Yes
- Purpose: Tests that exercise multiple layers (e.g., app initialization, cross-provider state flow)

**`e2e/`** — Playwright end-to-end tests

- Generated: No (source files checked in)
- Committed: Yes
- Purpose: Browser-based testing of complete user workflows

**`.planning/codebase/`** — GSD codebase mapping

- Generated: Yes (created by `/gsd-map-codebase` skill)
- Committed: No (git ignored via `.gitignore`)
- Purpose: Architecture and structure documentation for other Claude Code skills

**`dist/`** — Build output

- Generated: Yes (by `npm run build`)
- Committed: No
- Purpose: Compiled and bundled app ready for deployment

**`coverage/`** — Test coverage reports

- Generated: Yes (by `npm run test:coverage`)
- Committed: No
- Purpose: Coverage statistics from Vitest

**`.playwright-mcp/`** — Playwright browser artifacts

- Generated: Yes (by `npm run e2e`)
- Committed: No
- Purpose: Screenshots, traces, video recordings from E2E tests

**`node_modules/`** — Installed dependencies

- Generated: Yes (by `npm install`)
- Committed: No (in .gitignore)

---

_Structure analysis: 2026-06-29_
