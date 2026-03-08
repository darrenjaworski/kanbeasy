# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Unify `UndoRedoControls` and `KeyboardShortcutHint` into a single `BottomBar` component so the shortcut hint sits flush right on views without undo/redo
- Absorb ModalHeader and content wrapper into Modal component via `icon`/`title` props, simplifying all modal consumers with consistent padding

## [1.33.0]

### Features

- Add command palette (`Cmd+K` / `Ctrl+K`) with filtered quick actions: add card, add column, switch views, open analytics/archive/settings, and focus search
- Add keyboard shortcut hint pill in bottom-right corner showing `⌘k Shortcuts`
- Add keyboard shortcuts toggle in Settings > Preferences to enable/disable shortcuts and hint (defaults to off)

### Added

- Card layout editor design document (`docs/card-layout-editor.md`)

### Tests

- Add unit tests for `useCommandPaletteShortcut` hook (5 tests: Cmd+K, Ctrl+K, works in inputs, modifier guard, unrelated keys)
- Add unit tests for `CommandPalette` component (23 tests: rendering, filtering, keyboard navigation, action execution, default card type, disabled states, view mode filtering, selection wrapping, query reset, settings via header button)
- Add unit tests for `KeyboardShortcutHint` component (2 tests: renders hint text, kbd element)
- Add regression test for keyboard shortcuts defaulting to off

## [1.32.7]

### Changed

- Rename "Ticket Types" to "Card Types" throughout the application (UI labels, code identifiers, file names, documentation)
- Bump export format to v9 with backward-compatible import for v1–v8 exports
- Add card view editor to roadmap backlog

## [1.32.6]

### Fixed

- Backfill card type label and color snapshot fields on legacy cards during migration (prevents loss of colored badges for existing users)

### Changed

- Add push step with user confirmation to `/release` skill
- Add multi-board design document (`docs/multi-board-design.md`)

## [1.32.5]

### Fixed

- Fix React duplicate key warning in card type default dropdown during type ID editing
- Tighten visual regression pixel threshold from 0.01 to 0.0005 to catch single-character text changes
- Pin calendar view visual regression test date to June 2025 to match seeded card due dates

### Changed

- Add `e2e:visual` and `e2e:snapshot` npm scripts for running visual regression tests in isolation
- Exclude visual regression tests from deployed CI e2e runs via `--grep-invert`
- Update `/check` and `/commit` skills to run full kitchen-sink (static checks, lighthouse, e2e)
- Replace Haiku agents with `/check`, `/commit`, `/snapshot` skills

### Tests

- Add Playwright visual regression snapshot tests covering all 6 themes (Slate, Stone, Rose, Midnight, Forest, Twilight), welcome modal, card detail, settings, analytics, archive, list view, calendar view, and empty board

## [1.32.4]

### Fixed

- Fix tooltips showing on column drag preview during reorder

## [1.32.3]

### Changed

- Card card type data is now static — badge color and label are snapshot at assignment time and no longer depend on current type configuration
- CardTypeBadge renders from card snapshot data instead of looking up the live type definition
- ListView type column uses card snapshot data for label and color

### Fixed

- Fix card type ID rename firing on every keystroke instead of on blur (corrupted card data during editing)
- Fix duplicate card type IDs allowed — now reverts on blur and shows red border while duplicate
- Fix removing a card type definition permanently clearing card type assignments (now preserves card data)
- Fix card migration stripping `cardTypeLabel` and `cardTypeColor` snapshot fields from localStorage data

## [1.32.2]

### Fixed

- Fix column reorder destroying all card timestamps and column history (analytics data loss)
- Fix `removeCard` no-op detection (filter always returns new array, polluting undo history)
- Fix `renameCardType`/`clearCardType` updating all columns even when unaffected
- Fix column resize event listener leak when component unmounts during active resize
- Fix card type preset switch wiping type definitions used by existing cards

## [1.32.1]

### Fixed

- Preserve non-default theme on page reload when theme preference is set to "system"
- Disable calendar view toggle when no cards have due dates

### Tests

- Add regression test for card controls hidden during drag (tooltip flash prevention)
- Add regression test for system theme preference preserving theme choice on reload
- Add tests for calendar view disabled without due dates

## [1.32.0]

### Features

- Add due date badge to column-view cards with color-coded urgency (red for overdue, amber for due within 2 days, muted for further out)
- Add search highlighting to calendar view cards, matching board and list view behavior
- Add match count badge on calendar days with 5+ cards when search matches are present
- Sticky day header with backdrop blur on calendar day cells

### Fixed

- Hide card controls during drag to prevent tooltip flash on source card
- Inline AllProviders to resolve react-refresh lint error

### Changed

- Adjust card action buttons positioning to `top: 8px, right: 8px`
- Add `margin-top: 4px` to card textarea for improved spacing
- Place checklist progress and due date badge on the same line within cards
- Increase calendar "Today" button size for easier click target

### Tests

- Extract shared Playwright fixture (`tests-e2e/fixtures.ts`) to eliminate duplicated `beforeEach` setup across 19 e2e spec files
- Extract shared `makeE2eCard` and `seedBoard` helpers for e2e test data seeding, replacing 3 duplicate `makeCard` definitions
- Replace CSS class and style attribute assertions with `data-*` attributes in e2e search and badge-heat tests
- Replace hard-coded `page.mouse.click(5, 5)` backdrop clicks with `modal-backdrop` element clicks in analytics and card-detail e2e tests
- Replace hard-coded table cell `.nth()` indices with `data-testid` selectors in list-view e2e tests
- Replace hard-coded export version assertion with `toBeGreaterThanOrEqual(2)` in export-import e2e test
- Standardize keyboard shortcut modifier detection in card-archive e2e test
- Remove redundant `smoke.spec.ts` e2e test (covered by all other specs)
- Remove stale copy-pasted comments from cards, columns, and settings e2e specs
- Fix unnecessary `await` on Playwright locator assignments in columns e2e spec
- Add `data-testid` attributes to ListView table cells for semantic test selectors
- Replace Tailwind class assertions with `data-*` attributes in search, tooltip, and badge heat tests for resilience against styling refactors
- Extract shared `renderWithProviders` test helper to eliminate duplicated provider/context boilerplate across Column tests
- Replace SVG DOM queries in OwlBuddy tests with `data-testid` attributes on owl icon components
- Consolidate repetitive tests using `it.each` in importBoard, badgeHeat, and validation test files
- Scope AnalyticsModal metric assertions to specific MetricCard containers and tighten formatDate assertions
- Add missing test coverage for ConfirmDialog (Escape key, backdrop click) and cycleTime edge cases
- Fix trivial `typeof` assertion in isNightOwlHour test with real `vi.setSystemTime` verification

## [1.31.0]

### Features

- Add 17 feature-discovery owl tips to introduce users to calendar view, list view, compact header, checklists, analytics, archive, search, undo/redo, and export/import
- Add 14 night owl puns encouraging users to log off late at night

## [1.30.0]

### Features

- Add calendar view as third viewing mode (Board | List | Calendar) with month navigation
- Add card detail modal to calendar and list views (click card/row to open)
- Replace description column with due date column in list view
- Add scrollable day cells in calendar view with fixed-height layout
- Reduce search bar width for better header layout
- Add compact header setting to hide text labels on header buttons (Appearance > Compact header)

### Fixed

- Fix ThemeProvider to accept "calendar" as a valid persisted view mode

### Tests

- Add CalendarView unit tests (12 tests: empty state, grid rendering, navigation, year boundary wrap)
- Add CalendarView e2e tests (8 tests: grid display, card visibility, month navigation, persistence)
- Add calendar view toggle tests to ViewToggle test suite
- Add compact header unit tests (5 tests: default state, label hiding, aria labels, persistence, toggle)
- Add list view due date column tests (4 tests: header, formatted date, em dash, card detail modal)
- Add calendar view card detail modal test
- Add list view card detail modal e2e test
- Add compact header e2e test (label hiding, icon accessibility, localStorage persistence)
- Fix export version expectation in e2e tests (v7 → v8)

## [1.29.0]

### Features

- Add due date field to card data model and card detail modal with native browser date picker

### Fixed

- Improve checklist progress bar track contrast on light themes (use `bg-black/10` instead of `bg-white/40`)

### Tests

- Add migration tests for `dueDate` backfill (null when missing, preserves existing, rejects non-string)
- Add CardDetailModal tests for due date input (renders empty/populated, updates on change, clears to null)

## [1.28.0]

### Features

- Add interactive checklists in card descriptions — click checkboxes to toggle in preview mode without entering edit mode
- Add "+ Add checklist item" button below description for easy item creation without typing markdown syntax
- Inline input stays focused for rapid multi-item entry (Enter to add, Escape to dismiss)
- Add checklist progress bar on board cards and card detail modal showing checked/total with accent-colored fill

### Tests

- Add unit tests for `toggleMarkdownCheckbox` utility (8 tests: toggle on/off, mixed state, uppercase X, out-of-range, indented, alternate list markers)
- Add unit tests for `checklistStats` utility (8 tests: null for no checkboxes, count checked/unchecked, mixed, uppercase X, indented, alternate markers)
- Add unit tests for interactive checkbox rendering in `MarkdownPreview` (enabled/disabled state, click callback, index attributes)
- Add e2e tests for checklist feature (9 tests: toggle checkboxes, add items, progress bar, keyboard interactions)

## [1.27.0]

### Features

- Add styled tooltip component for icon-only buttons — themed glass-blur tooltips replace native `title` attributes across card controls, column controls, undo/redo, and modal close buttons
- Add visible text labels to undo/redo buttons for improved discoverability
- Add `disabled` prop to Tooltip component to suppress tooltips on disabled buttons
- Add `aria-label` to card density buttons for screen reader accessibility

### Fixed

- Round hover backgrounds on edge buttons in control pills to match container shape
- Fix tooltip delay applying on both show and hide — delay now only applies on hover-in for instant dismissal
- Fix modal close button pushed flush-left by tooltip wrapper breaking flex layout
- Suppress undo/redo tooltips when buttons are disabled

### Tests

- Add unit tests for Tooltip component (rendering, positioning, click passthrough, accessibility attributes)
- Add e2e tests for tooltip visibility on hover (undo/redo, card controls, column controls)

## [1.26.0]

### Features

- Add default card type setting — new cards are automatically pre-tagged with the selected type; dropdown in Card Types settings section with "None" and all configured types
- Include default card type in export/import (export format bumped to v7); v1–6 imports default to null

### Changed

- Replace inline `dark:` Tailwind patterns with centralized `tc` theme tokens (`glassSubtle`, `glassOpaque`, `placeholder`, `borderHover`, `error`, `codeBg`, `searchHighlight`) across 9 component files
- Enable type-aware ESLint rules (`recommendedTypeChecked`) to catch unsafe promises, floating promises, unnecessary type assertions, and type-unsafe patterns
- Add local Lighthouse audit (`npm run lighthouse`) and include it in `kitchen-sink` pipeline between static-checks and e2e
- Ignore `open` system binary in knip config to fix false positive unlisted binary warning

### Tests

- Add unit tests for `useBoardMutations` hook — 52 tests covering all 18 mutation functions (column CRUD, card CRUD, archive, card types, reset)
- Suppress `console.warn` stderr noise in storage utility error-path tests
- Add isolated unit tests for `CardList` (13 tests), `Column` (25 tests), and `Board` (9 tests) components
- Add e2e tests for default card type setting (6 tests across 3 browsers)

## [1.25.0]

### Features

- Auto-archive cards when deleting a column instead of permanently destroying them; cards can be restored from the archive
- Dynamic theme-based favicon that updates to match the active theme's colors

### Changed

- Disable analytics button, search input, and list view toggle when there are no cards on the board
- Disable archive button when archive is empty
- Move owl assistant and undo/redo buttons to bottom of page now that footer is removed
- Add visible text labels ("Board" / "List") to view mode toggle buttons for improved discoverability
- Switch default card density from "Comfortable" (medium) to "Compact" (small) to reduce dead space; existing users who previously set a density preference are unaffected
- Reorganize settings modal into collapsible sections (Appearance, Card Types, Preferences, Data) — all collapsed by default with persistent open/close state via localStorage
- Collapse card type editor behind "Edit types" disclosure — preset dropdown always visible, type list and add button hidden until expanded
- Add descriptive subtitle to "Owl assistant" toggle explaining what it does
- Move footer credit into settings modal next to version link; remove fixed footer to reclaim vertical space
- Move card density control from Preferences to Appearance section in settings
- Add `kitchen-sink` npm script that runs static-checks and e2e tests in one command

### Fixed

- Copy/paste card now preserves the card type

### Tests

- Fix e2e tests for collapsible settings sections (Appearance, Preferences, Data must be expanded before interacting)
- Fix e2e tests for disabled navigation controls on empty boards (analytics, search, list view)
- Add dedicated e2e test suite for disabled UI states (analytics, archive, search, list view toggle)
- Bolster unit test coverage for archive, toggle switch, settings sections, and analytics components

### Documentation

- Add UI polish roadmap items: view toggle labels, compact default density, settings modal reorganization, card type disclosure, owl assistant description, footer relocation, column delete warning revisit, dynamic favicon
- Update release process to use `kitchen-sink` script for full validation

## [1.24.1]

### Changed

- Clarify analytics disclaimer to explain which metrics include archived cards vs board-only

### Tests

- Fix analytics e2e strict mode violations from disclaimer text matching metric headings

## [1.24.0]

### Features

- Include archived cards in historical analytics (cycle time, throughput, reverse time); snapshot metrics (total cards, cards in flight) remain board-only
- Show "(archived)" indicator next to archived card titles in analytics cycle time and reverse time tables

### Fixed

- Fix archive table clipping "Archived" column when card titles are long

### Tests

- Add unit tests for `additionalCards` parameter in `cycleTime` and `boardMetrics` functions
- Add integration tests verifying archived cards appear in AnalyticsModal historical metrics
- Add `isArchived` flag tests for `getCardCycleTimes` and `getCardReverseTimes`
- Add edge case tests: empty columnHistory, all-additionalCards, duplicate IDs, boundary throughput, nonexistent column refs
- Add integration test for "(archived)" label rendering in AnalyticsModal

## [1.23.0]

### Features

- Add type column to list view table showing card type label with color
- Add card archive (soft-delete): cards go to an archive instead of being permanently deleted, with browse, restore, and permanent delete from archive modal
- Add archive button in header between Analytics and Settings
- Add "Archive card" button in card detail modal

### Changed

- Replace card "Remove" button with "Archive" button on card controls
- Bump export version to 6 to include archive data; v1–5 imports default to empty archive
- Refactor archive modal from flat list to table with checkbox selection and bulk restore/delete actions

### Tests

- Add unit tests for ListView type column
- Add e2e test suite for list view (headers, type column, descriptions, empty state)
- Add unit tests for `isArchivedCard` validation
- Add integration tests for archive/restore/permanentlyDelete/clearArchive mutations and undo/redo
- Add import/export tests for v6 archive data
- Add e2e test suite for card archive workflow (archive, restore, permanent delete, undo)

## [1.22.0]

### Features

- Add night owl mode: between 10 PM and 4 AM, the owl assistant shows sleepy eyes, "go to bed!" style tips, and a "Good night!" dismiss button

### Changed

- Add `eslint-plugin-jsx-a11y` for accessibility linting (recommended preset)
- Add `eslint-plugin-import-x` for import hygiene checks (recommended + typescript presets)
- Fix duplicate import from `utils/storage` in ThemeProvider
- Replace unassociated `<label>` with `<span>` for description heading in CardDetailModal

### Fixed

- Generate HTML report in CI so Playwright report artifact is uploaded correctly
- Fix high severity vulnerabilities in minimatch and rollup dependencies

### Tests

- Implement skipped e2e test for welcome modal "show once" behavior
- Add unit tests for `isNightOwlHour` utility and night owl mode in OwlBuddy
- Update e2e owl assistant tests to handle time-dependent dismiss button text

## [1.21.1]

### Fixed

- Clear all localStorage keys (theme, density, preferences, etc.) when resetting settings

### Changed

- Add e2e tests to quality standards checklist and release process in CLAUDE.md
- Remove design notes

## [1.21.0]

### Features

- Add card type field to cards with configurable types (e.g. `feat-42`, `fix-13`) and colored badge display
- Add card type settings with preset selector (Development, Personal) and full customization (add/remove/rename/recolor)
- Add type selector dropdown in card detail modal
- Display card type badges on board cards, list view, and card detail modal header
- Export/import preserves card type data (export format bumped to v5)
- Bulk rename and clear card type mutations participate in undo/redo
- Add auto-incrementing card numbers (`#1`, `#2`, ...) displayed on board cards, card detail modal, list view, and analytics tables
- Card numbers persist outside the undo stack to prevent number reuse on undo/redo
- Duplicated cards receive fresh numbers
- Migration assigns sequential numbers to existing cards by `createdAt` order
- Export/import preserves card numbers (export format bumped to v4)

### Changed

- Replace single "Clear board data" button with three separate actions: clear board, clear settings, and clear all
- Centralize `hasSeenWelcome` localStorage key into `STORAGE_KEYS` constant
- Add `resetSettings` to ThemeProvider for resetting all settings to defaults
- Standardize modal layout: fixed header with scrollable body and consistent `p-4` spacing across all modals
- Add `max-h-[85vh]` constraint to Modal component with flex column layout
- Replace `import React from "react"` with named type imports across icon components, tests, and CardControls
- Optimize `migrateColumnsWithNumbering` conflict-avoidance from O(n²) to O(n) using Set-based lookups
- Simplify `setNextCardNumber` in BoardProvider by removing redundant wrapper around `saveCounter`

### Tests

- Add comprehensive tests for CardTypeSection (preset selection, editing, adding, removing types, color picker)
- Add unit tests for `formatCardId`, `findCardType`, migration `cardTypeId` backfill, v5 import/export
- Add e2e tests for card numbering (ascending numbers on board, modal header, list view, localStorage persistence, duplicate fresh numbers, no number reuse after deletion)
- Fix card detail modal close button e2e tests to match `#N Card Details` header format

## [1.20.1]

### Fixed

- Column reorder now resets all card analytics data (columnHistory, createdAt, updatedAt) as the analytics modal warning promises

### Documentation

- Remove known bug from roadmap: column reorder analytics reset is now implemented

## [1.20.0]

### Features

- Add WIP badge heat indicator on middle columns — card count badge progressively shifts to accent color as card count rises (3–4: light, 5–6: medium, 7–9: strong, 10+: full)

### Changed

- Extract shared `ROWS_FOR_DENSITY` constant to `src/theme/types.ts`, replacing duplicate density-to-rows mappings in CardDetailModal and SortableCardItem
- Reorganize `src/components/` into domain-based subdirectories (`board/`, `analytics/`, `shared/`, `settings/`) with per-subdirectory `__tests__/` folders
- Extract clipboard state into ClipboardContext to eliminate prop drilling through SortableColumnItem
- Extract shared `renderApp()` test utility to `src/test/renderApp.tsx`, removing duplicated function and provider imports from 22 test files
- Extract shared `formatDate` and `formatDateTime` utilities to `src/utils/formatDate.ts`, replacing duplicate definitions in CardDetailModal and ListView
- Extract `DescriptionField` component from CardDetailModal, encapsulating ~100 lines of description editing state, refs, effects, and callbacks
- Extract `MetricsTable` component from AnalyticsModal, replacing two structurally identical table blocks (~120 duplicate lines)
- Decompose `SettingsModal` into `ThemeSection`, `BoardSettingsSection`, and `DataSection` sub-components, reducing it from 333 to ~40 lines

### Tests

- Add unit tests for ClipboardProvider (useClipboard hook, copyCard, pasteCard, multiple pastes)
- Add e2e tests for copy/paste cards (hover controls, same-column paste, cross-column paste, multiple pastes, button text change)
- Add unit tests for `formatDate` and `formatDateTime` utilities
- Add unit tests for `getBadgeHeat` utility (all branches: null returns, accent percentages, bold threshold)
- Add integration tests for badge heat rendering in Column component (background-color, font-bold)
- Add e2e tests for badge heat indicator (first/last column no heat, middle column heat at 3+, bold at 10+)

## [1.19.0]

### Features

- Copy and paste cards — copy a card via card controls, then paste into any column as a duplicate with fresh ID and timestamps

### Changed

- Stretch column header input to full width with action buttons and badge overlaid using frosted glass background
- Unify column action buttons and card count badge styling to match card controls (frosted glass with backdrop blur)

## [1.18.0]

### Features

- Auto-select new card title text on add for quick editing — clicking "Add card" now focuses the textarea with the default title selected so you can immediately type to replace it

## [1.17.1]

### Fixed

- Fix e2e test hangs: attach anchor element to DOM before triggering download in `exportBoard` to ensure download event fires reliably in headless browsers
- Fix owl assistant e2e tests: replace overly broad `page.locator("p").first()` with `data-testid="owl-tip"` to avoid matching unrelated page elements
- Fix owl assistant toggle click intercepted by decorative overlay span in e2e tests
- Fix stale version assertion in export e2e test (v2 → v3)
- Fix e2e tests badge in README pointing to wrong workflow file

### Changed

- Replace `react-markdown` + `remark-gfm` (96 transitive deps) with `marked` (0 transitive deps) for smaller bundle size
- Add dependency evaluation guidelines to CLAUDE.md (bundle size, maintenance, transitive deps)
- Split post-deploy e2e workflow into install and run jobs with Playwright browser caching
- Bump `actions/checkout` and `actions/setup-node` to v5 in CI workflows

## [1.17.0]

### Features

- Add markdown rendering for card descriptions with click-to-edit UX
- Add `MarkdownPreview` component using `react-markdown` + `remark-gfm` (GFM tables, task lists, strikethrough)
- Render markdown descriptions in list view (truncated to one line)
- Show helper text in description editor indicating markdown support

### Fixed

- Fix card detail modal title textarea losing visible border due to Tailwind class conflict
- Preserve description container height across edit/preview transitions to prevent size jumps

## [1.16.1]

### Changed

- Restrict card search to titles only (exclude descriptions)

## [1.16.0]

### Features

- Add card detail modal with description field, accessible via detail button on cards
- Add `description` field to card data model with extensible `CardUpdates` partial update pattern
- Add description column to list view
- Bump export version to 3 with backward-compatible import migration for v1/v2 data
- Add column selector dropdown in card detail modal to move cards between columns
- Add `moveCard` mutation to board context for programmatic cross-column moves
- Card detail modal stays open when moving card to a different column

### Changed

- Style list view table inside a card matching column styles
- Card controls use translucent backdrop-blur background to reduce text overlap
- Replace expand icon with document icon for card detail button
- Card detail modal title rows match card density setting
- Lift card detail modal state to Board component for cross-column persistence

### Tests

- Add unit tests for `moveCard` undo/redo and same-column no-op
- Add unit tests for column selector and `onMoveCard` callback in CardDetailModal
- Add e2e tests for card detail modal (open, edit title/description, move card, close via Escape/backdrop)

## [1.15.0]

### Features

- Add read-only list view with board/list toggle in header
- Persist view mode preference in localStorage
- Include view mode in board export/import

### Tests

- Add ViewToggle unit tests and view toggle integration tests

## [1.14.0]

### Features

- Add text labels ("Analytics", "Settings") to header icon buttons for better discoverability

### Changed

- Differentiate "Add card" button with dashed border, muted text, and "+" prefix
- Hide card textarea resize handle by default, show only on hover/focus

## [1.13.1]

### Changed

- Simplify owl assistant dialog to two buttons ("One more" / "Thanks!") and add spacing between text and buttons

### Tests

- Add e2e tests for owl assistant (enable via settings, show tip, dismiss, one more)

## [1.13.0]

### Features

- Add "Owl assistant" easter egg: a floating owl buddy in the bottom-left corner that shares productivity tips and programming jokes

## [1.12.3]

### Changed

- Update kanban favicon with twilight purple theme colors

### Tests

- Add unit tests for MetricCard and AnalyticsModal components

## [1.12.2]

### Changed

- Add bottom padding to board to compensate for footer size

## [1.12.1]

### Changed

- Adjust search match count and clear button spacing for better alignment

## [1.12.0]

### Features

- Use theme accent color for focus rings, search card highlights, and drop target indicators

### Fixed

- Preserve theme choice when switching preferences within the same mode (e.g., "system" to "dark" when OS is dark)

### Changed

- Upgrade testing-library and typescript to latest patch versions
- Upgrade react and react-dom to 19.2.4
- Upgrade vitest and @vitest/coverage-v8 to v4
- Lower lighthouse performance threshold to 0.8

## [1.11.3]

### Fixed

- Fix bundle size badge showing literal `${SIZE}` due to ANSI color codes in CI build output

## [1.11.2]

### Changed

- Add Lighthouse score thresholds for accessibility (error), performance, best practices, and SEO (warn)
- Parse bundle size badge from Vite build output for accurate reporting
- Remove bundle-size PR comment workflow

## [1.11.1]

### Changed

- Add Prettier for code formatting with `format` and `format:check` scripts
- Add eslint-config-prettier to disable conflicting ESLint formatting rules
- Apply Prettier formatting to entire codebase
- Add Knip for unused code detection with `knip` script (included in static-checks)
- Remove unused exports found by Knip
- Add bundle size tracking via `preactjs/compressed-size-action` on PRs and push to main
- Add `rollup-plugin-visualizer` with `build:analyze` script for local bundle analysis
- Add shields.io bundle size badge via deployed endpoint
- Add Lighthouse CI audit workflow triggered after GitHub Pages deploy
- Add Lighthouse audit badge to README
- Extract static checks into a reusable composite GitHub Action
- Prepend `format:check` and `knip` to `static-checks` pipeline
- Harden ESLint config with eqeqeq, no-console, prefer-const, consistent-type-imports, and stricter no-unused-vars rules
- Fix all lint warnings across codebase
- Deploy to GitHub Pages only on tagged releases instead of every push to main
- Update CLAUDE.md with new scripts, architecture overview, and commit conventions
- Expand roadmap with new feature ideas and mobile/tablet usability

## [1.11.0]

### Features

- Enable undo/redo and analytics for all users (previously behind dev-only feature flag)

### Changed

- Extract reusable ToggleSwitch, ModalHeader, and MetricCard components from settings and analytics modals
- Extract useInlineEdit hook to deduplicate inline edit logic across Column and SortableCardItem
- Split BoardProvider into useBoardMutations and useCardSearch hooks for maintainability
- Add barrel exports for icons and hooks directories

### Tests

- Add unit tests for useInlineEdit hook and validation type guards
- Add e2e tests for undo/redo buttons and keyboard shortcuts
- Remove outdated feature flag mock from undo/redo integration tests

## [1.10.0]

### Features

- Add undo/redo for board actions via Cmd+Z / Cmd+Shift+Z with floating UI controls (dev-only feature flag)
- Add e2e test coverage for analytics, search, export/import, and card count badges

### Fixed

- Search match count overlapping native clear button in search input

## [1.9.2]

### Fixed

- Fix test failures from removed Close button in settings modal

## [1.9.1]

### Changed

- Remove redundant Close button from settings modal

## [1.9.0]

### Features

- Add total cards, cards in flight, throughput, and reverse time metrics to analytics modal
- Add data disclaimer note to analytics modal
- Add per-card cycle time table to analytics modal
- Add average cycle time metric to analytics modal
- Add development-only feature flag system for gating in-progress features
- Add analytics button and modal shell in header
- Add timestamps (createdAt, updatedAt) and column history tracking to cards and columns
- Bump export format to v2 with seamless v1 import migration

### Fixed

- Chrome warning about missing id attribute on search input

## [1.8.0]

### Features

- Export board data as JSON file from Settings modal for backup purposes.
- Import board data from JSON file in Settings modal to restore backups, with loading indicator and completion feedback.

### Fixed

- Card count badge sliding under column action buttons when editing column title without hovering.

## [1.7.0]

### Features

- Add card count badge to column headers that slides left on hover to clear controls.

### Fixed

- Column controls staying visible after drag-and-drop due to lingering focus.
- Column controls staying visible after adding a card due to retained button focus.
- Card count badge position when hovering a single column with no drag handle.

## [1.6.1]

### Changed

- Fix npm audit vulnerabilities in dependencies (ajv, js-yaml, lodash, playwright, tar, vite).

## [1.6.0]

### Features

- Seed initial board with example columns (To Do, In Progress, Done) for new users.
- Respect delete column warning setting — skip confirmation dialog when disabled.

## [1.5.0]

### Features

- System/auto theme preference that follows OS light/dark mode automatically.

## [1.4.0]

### Features

- Confirmation dialog when deleting a column that contains cards, preventing accidental data loss.
- Reusable `ConfirmDialog` component built on the existing `Modal`.

## [1.3.2]

### Features

- Display app version and GitHub repository link in settings modal.

## [1.3.1]

### Changed

- Improved welcome modal text with clearer explanation of kanban concepts and application usage.

## [1.3.0]

### Features

- 6 predefined color themes (3 light, 3 dark) with centralized configuration in `src/theme/themes.ts`.
- Theme picker in settings modal with light/dark segmented toggle and color swatch buttons.
- Centralized theme class tokens (`src/theme/classNames.ts`) to reduce repeated Tailwind class patterns across components.
- Accent color support via CSS custom property (`--color-accent`), used for toggle switches and focus rings.

### Changed

- ThemeProvider now dynamically applies CSS custom properties (`--color-bg`, `--color-surface`, `--color-text`, `--color-accent`) on the root element.
- Simplified Tailwind `@theme` block from 6 separate light/dark vars to 4 unified tokens.
- Migrated component classes from `bg-bg-light dark:bg-bg-dark` pattern to unified `bg-bg` pattern.
- Legacy localStorage theme values (`"light"`/`"dark"`) auto-migrate to new theme IDs.
- Footer credit updated to include Claude.
- Added conventional commits and release process to CLAUDE.md.

## [1.2.0]

### Features

- Fuzzy search for cards across all columns.

### Changed

- Search requires a minimum of 2 characters before matching.

## [1.1.1]

### Fixed

- Additional search functionality test coverage.

## [1.1.0]

### Features

- Column resizing: Users can now resize columns horizontally with a drag handle (feature-flagged).
- New setting in Settings modal to enable/disable column resizing (default: off).
- Resizing is fully accessible, persists per session, and is visually consistent with the UI.

## [1.0.1]

### Fixed

- Restore hover grab/grabbing cursor on card and column drag handles after Tailwind update.
- Fix scroll indicator gradients not appearing when content overflows horizontally after Tailwind update.

## [1.0.0]

- kanbeasy initial release version
