# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Features

- Add card count badge to column headers that slides left on hover to clear controls.

### Fixed

- Column controls staying visible after drag-and-drop due to lingering focus.

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
