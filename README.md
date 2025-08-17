# Kanbeasy

[![static checks](https://github.com/darrenjaworski/kanbeasy/actions/workflows/static-checks.yml/badge.svg)](https://github.com/darrenjaworski/kanbeasy/actions/workflows/static-checks.yml)
[![post-deploy e2e](https://github.com/darrenjaworski/kanbeasy/actions/workflows/post-deploy-e2e.yml/badge.svg)](https://github.com/darrenjaworski/kanbeasy/actions/workflows/post-deploy-e2e.yml)

Kanbeasy is an ultra simple, local-first kanban-style task organizer built with React, TypeScript and Vite. It focuses on a minimal UI, keyboard and touch-friendly drag-and-drop, and a small but useful feature set (resizable columns, dark mode, configurable card density). The app stores data locally by default and aims to be a lightweight alternative for personal task management.

## VS Code extension

There is a companion VS Code extension available that integrates Kanbeasy into the editor: [vscode-kanbeasy](https://github.com/darrenjaworski/vscode-kanbeasy)

## Changelog

Included below are the notable changes from the project's [CHANGELOG.md](https://github.com/darrenjaworski/kanbeasy/blob/main/CHANGELOG.md).

## Roadmap

Planned and upcoming features are listed in the project's [ROADMAP.md](https://github.com/darrenjaworski/kanbeasy/blob/main/ROADMAP.md).

## React + TypeScript + Vite - local development

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Tests

This project uses Vitest.

- `npm test`
- `npm run test:watch`
  There is a trivial smoke test in `src/smoke.test.ts` to verify the setup.

## Expanding the ESLint configuration

## End-to-end tests (Playwright)

Playwright is configured to start Vite automatically and run Chromium, Firefox, and WebKit projects.

- Run all e2e tests: `npm run e2e`
- Open the UI Test Runner: `npm run e2e:ui`
- View the last HTML report: `npm run e2e:report`

To run against a deployed environment, set `E2E_BASE_URL` to the site URL. For GitHub Pages in this repo:

```sh
E2E_BASE_URL=https://darrenjaworski.github.io/kanbeasy npm run e2e
```

Artifacts (HTML reports and videos) are ignored via `.gitignore`.

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);

]);

```
