# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Update CLAUDE.md architecture overview with undo/redo, data model, search, analytics, feature flags, and all extracted components/hooks
- Update CLAUDE.md commit conventions to require changelog entries before every commit
- Expand roadmap with new feature ideas and mobile/tablet usability
- Deploy to GitHub Pages only on tagged releases instead of every push to main
- Harden ESLint config with eqeqeq, no-console, prefer-const, consistent-type-imports, and stricter no-unused-vars rules
- Fix all lint warnings: add coverage to global ignores, correct React hook dependency arrays, enforce strict equality across codebase, replace inline import() types with proper type imports
- Update CLAUDE.md to require routine static checks during development and tests alongside every feature or fix

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
