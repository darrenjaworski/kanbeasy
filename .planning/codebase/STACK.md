# Technology Stack

**Analysis Date:** 2026-06-29

## Languages

**Primary:**

- TypeScript 6.0.3 - All source code, configuration files, and tests
- JavaScript (via TypeScript) - Runtime execution in browsers and Node.js

**Secondary:**

- CSS (Tailwind CSS v4.3.1) - Styling and design tokens
- Markdown - Documentation (parsed via marked v17.0.6)

## Runtime

**Environment:**

- Node.js LTS/jod (specified in `.nvmrc`)
- Browser environment: Chrome, Firefox, Safari/WebKit (tested via Playwright)

**Package Manager:**

- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**

- React 19.2.7 - UI framework and component library
- Vite 8.0.16 - Build tool and development server (localhost:5173)
- @vitejs/plugin-react 6.0.3 - Vite plugin for React

**Styling:**

- Tailwind CSS 4.3.1 - Utility-first CSS framework
- @tailwindcss/vite 4.3.1 - Vite plugin for Tailwind CSS
- CSS custom properties - Theme system via `--color-*` variables on `<html>`

**Drag & Drop:**

- @dnd-kit/core 6.3.1 - Core drag-and-drop library
- @dnd-kit/sortable 10.0.0 - Sortable list functionality
- @dnd-kit/modifiers 9.0.0 - Drag modifiers (constraints, etc.)
- @dnd-kit/utilities 3.2.2 - Utility functions

**Testing:**

- Vitest 4.1.9 - Unit testing framework with jsdom environment
- @testing-library/react 16.3.2 - React component testing utilities
- @testing-library/user-event 14.6.1 - User interaction simulation
- @testing-library/dom 10.4.1 - DOM testing utilities
- @testing-library/jest-dom 6.9.1 - Jest matchers for DOM testing
- Playwright 1.61.0 - End-to-end testing across browsers
- fake-indexeddb 6.2.5 - IndexedDB mock for testing

**Search:**

- Fuse.js 7.4.2 - Fuzzy search library (threshold: 0.4, min chars: 2)

**Build/Dev:**

- rollup-plugin-visualizer 7.0.1 - Bundle size analysis
- knip 5.88.1 - Detects unused files, exports, dependencies
- marked 17.0.6 - Markdown parser

**Linting & Formatting:**

- ESLint 10.5.0 - Linting with flat config
- @eslint/js 10.0.1 - ESLint core rules
- typescript-eslint 8.61.1 - TypeScript linting
- eslint-plugin-react-hooks 7.1.1 - React Hooks validation
- eslint-plugin-react-refresh 0.5.2 - React Refresh validation
- eslint-plugin-jsx-a11y 6.10.2 - Accessibility linting
- eslint-plugin-import-x 4.16.2 - ES module import/export validation
- eslint-plugin-testing-library 7.16.2 - Testing Library best practices
- eslint-config-prettier 10.1.8 - Prettier integration
- Prettier 3.8.4 - Code formatter (settings: 2-space tabs, single quotes off, 80-char print width, trailing commas, LF line endings)

**Development Tools:**

- react-doctor 0.4.0 - React architecture analysis CLI
- jsdom 26.1.0 - DOM implementation for Vitest
- @vitest/coverage-v8 4.1.9 - Code coverage via V8

**Type Checking:**

- TypeScript 6.0.3 - Strict type checking with no implicit `any`
- Type-safe imports enforced (`import type` for type-only imports)

## Key Dependencies

**Critical:**

- React 19.2.7 - Core UI framework
- Vite 8.0.16 - Build system and dev server (essential for rapid development)
- @dnd-kit/\* - Drag-and-drop functionality is central to kanban board UX
- Tailwind CSS 4.3.1 - Complete styling system with custom theme support
- TypeScript 6.0.3 - Type safety across entire codebase

**Infrastructure:**

- Fuse.js 7.4.2 - Card search feature (fuzzy matching)
- marked 17.0.6 - Markdown parsing for card content and documentation
- Playwright 1.61.0 - Cross-browser E2E testing ensures quality across Chrome/Firefox/Safari
- Vitest 4.1.9 - Fast unit testing with jsdom environment

## Configuration

**Environment:**

- Development: `npm run dev` (Vite dev server with hot reload on :5173)
- Production: `npm run build` (TypeScript compilation + Vite bundle)
- `PUBLIC_URL` env var - Controls app base path for deployment (e.g., GitHub Pages)
- `E2E_BASE_URL` env var - Directs E2E tests to deployed environment (default: localhost:5173)
- `CI` env var - Triggers CI-specific test configuration (sharding, retries, reporters)
- `ANALYZE` env var - Enables bundle visualization during build

**Build:**

- `tsconfig.json` - References `tsconfig.app.json` and `tsconfig.node.json`
- `vite.config.ts` - React plugin, Tailwind CSS, optional visualizer
- `vitest.config.ts` - jsdom environment, global test utilities, coverage exclusions
- `eslint.config.js` - Flat config with TypeScript, React, A11y, import rules
- `.prettierrc` - Formatting preferences
- `playwright.config.ts` - E2E testing across Chromium, Firefox, WebKit with reporting

**Feature Flags:**

- Located in `src/constants/featureFlags.ts`
- Set to `import.meta.env.DEV` for dev-only features
- `analytics` and `undoRedo` currently enabled (shipped features)

**Version Tracking:**

- App version defined in `package.json` (currently 1.53.3)
- Injected into build via Vite `__APP_VERSION__` define
- Used for export/import versioning and migrations

## Platform Requirements

**Development:**

- Node.js LTS/jod
- npm 9+ (for lockfile handling)
- Modern browser for local testing (Chrome recommended)
- macOS, Linux, or Windows with bash-compatible shell

**Production:**

- Modern browser with:
  - IndexedDB support (primary storage)
  - localStorage support (fallback/migration)
  - ES2020+ JavaScript support
  - CSS custom properties support
  - Drag-and-drop API (via @dnd-kit polyfills)
- No server-side runtime required (static app)
- GitHub Pages compatible (current deployment target)
- Can be embedded in VS Code webview (host mode via `?host=vscode` query param)

**CI/CD:**

- GitHub Actions
- Playwright container: `mcr.microsoft.com/playwright:v1.61.0-noble` (keeps browsers in sync with @playwright/test version)
- Ubuntu latest runner for static checks and deployment

---

_Stack analysis: 2026-06-29_
