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