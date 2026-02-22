# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (starts Vite dev server on localhost:5173)
- **Build**: `npm run build` (TypeScript compilation + Vite build)
- **Type checking**: `npm run type:check` (TypeScript without emit)
- **Linting**: `npm run lint` (ESLint)
- **Full validation**: `npm run static-checks` (runs lint, type-check, build, and test:run)

### Testing

- **Unit tests**: `npm test` or `npm run test:watch` (Vitest with jsdom)
- **Run tests once**: `npm run test:run`
- **Coverage**: `npm run test:coverage`
- **E2E tests**: `npm run e2e` (Playwright across Chromium, Firefox, WebKit)
- **E2E UI**: `npm run e2e:ui` (interactive test runner)
- **E2E report**: `npm run e2e:report` (view last HTML report)

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
- **Vitest** for unit testing with jsdom environment
- **Playwright** for end-to-end testing

### State Management
The app uses React Context for state management with two main providers:

1. **BoardProvider** (`src/board/`): Manages kanban board state
   - Stores columns and cards data in localStorage (`kanbeasy:board`)
   - Provides CRUD operations for columns and cards
   - Handles drag-and-drop reordering logic

2. **ThemeProvider** (`src/theme/`): Manages UI themes and settings
   - Light/dark mode with system preference detection
   - Card density settings (small/medium/large)
   - Persists to localStorage (`kanbeasy:theme`, `kanbeasy:cardDensity`)

### Data Flow
- All data is stored locally using localStorage
- Type-safe state management with TypeScript interfaces
- Context providers wrap the entire app in `main.tsx`

### localStorage Versioning
All localStorage data is part of the export/import system (`src/utils/exportBoard.ts`). The export format includes a `version` field (currently `1`). When making changes to localStorage data structures:
- **Bump the export version number** in `exportBoard.ts` when the shape of stored data changes
- **Write a migration** in the future import tool that can upgrade older export versions to the current version
- This ensures users can export on one version and import on a newer version without data loss
- Storage keys are centralized in `src/constants/storage.ts`

### Component Structure
- `App.tsx`: Main layout with Header, Board, Footer, and WelcomeModal
- `components/Board.tsx`: Main drag-and-drop board implementation
- `components/Column.tsx`: Individual column with cards
- `components/SortableCardItem.tsx` & `SortableColumnItem.tsx`: Drag-and-drop wrappers
- Modal components for settings and welcome flow

### Key Features
- Drag-and-drop cards between columns and within columns
- Customizable column management
- Light/dark mode theming
- Card density options (affects UI compactness)
- Local data persistence
- Welcome modal for first-time users

## Model Selection & Cost Optimization

To minimize costs while maintaining quality, follow these guidelines for model selection:

### Use Haiku (Fast & Cheap) For:
- **Running tests**: Spawn Bash agent with Haiku model
- **Linting & type checking**: Straightforward validation tasks
- **Building**: Compilation and build verification
- **Simple fixes**: Typos, formatting, obvious corrections
- **Package management**: Installing/updating dependencies
- **Verification tasks**: Confirming tests pass, checking output

**Example:** `Use Bash agent with Haiku to run npm run test:run`

### Use Sonnet (Default) For:
- **Implementation**: Writing new features or components
- **Refactoring**: Restructuring existing code
- **Bug fixes**: Non-trivial debugging and fixes
- **Code reviews**: Analyzing code quality and suggesting improvements
- **Documentation**: Writing or updating docs
- **Moderate complexity tasks**: Anything requiring context understanding

### Use Opus (Complex Reasoning) For:
- **Architectural decisions**: System design and structure
- **Complex debugging**: Multi-layered issues requiring deep analysis
- **Planning**: Breaking down large features into tasks
- **Performance optimization**: Analyzing and improving performance
- **Security reviews**: Identifying vulnerabilities

### Cost-Saving Strategy:
1. Default to Sonnet for general work
2. Delegate routine tasks (tests, builds, simple checks) to Haiku agents
3. Only escalate to Opus when truly needed for complex reasoning
4. When in doubt, try Sonnet first before using Opus

**Note:** This project has custom Haiku-powered agents available in `.claude/agents/` for common tasks.

## Quality Standards

Before making any changes, ensure:
- TypeScript typecheck passes (`npm run type:check`)
- ESLint passes (`npm run lint`)
- Unit tests pass (`npm run test:run`)
- No `any` types without justification
- New features include tests and cover edge cases

## Testing Approach

- Use Vitest with jsdom environment for unit tests
- Place test files adjacent to source: `*.test.ts(x)` in `src/`
- Use `@testing-library/react` and `@testing-library/user-event` for UI tests
- Focus on black-box testing of observable behavior
- Test setup is configured in `src/test/setup.ts`

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

When committing `feat:`, `fix:`, or other user-facing changes, also add a corresponding entry under the `## [Unreleased]` section of `CHANGELOG.md` in the same commit. Use the appropriate heading (`### Features`, `### Fixed`, `### Changed`, `### Removed`) following the Keep a Changelog format.

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
   npm run static-checks
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

## Code Conventions

- Strict TypeScript with no implicit `any`
- Export precise types for shared data models
- Components and hooks must be fully typed
- Follow existing patterns for Context providers and hooks
- Keep components lean and avoid unnecessary re-renders