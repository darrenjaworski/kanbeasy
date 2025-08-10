# Copilot Contribution Instructions

These instructions apply to any automated or AI-assisted changes in this repository. The goal is to keep the project healthy, predictable, and safe to change. Please think deeply about the changes you propose and their impact on the overall system.

## Non‑negotiable quality bars

- Green static checks are mandatory before proposing changes:
  - TypeScript typecheck must pass (`npm run -s build` or equivalent).
  - ESLint must pass (`npm run lint`).
  - Unit tests must pass locally (`npm test`) and include meaningful coverage for new code.
- No `any` or implicit `any` unless justified with an inline comment and a `TODO` to remove. Prefer precise, exported types.
- Public APIs and components must be fully typed (props, return values, event handlers, context, etc.).
- Keep the build free of console errors and warnings.

## Tests are required for every feature

- Add or update tests for:
  - New components, hooks, and utilities (happy path + at least one edge case).
  - Bug fixes (regression test that fails before, passes after).
  - Behavior changes (update or add tests to reflect the new contract).
- Use Vitest with the jsdom environment and Testing Library for React components.
- Prefer black‑box tests that assert observable behavior over implementation details.

## Linting and formatting

- Run `npm run lint` and fix all reported issues.
- Follow the repository ESLint configuration and React hooks rules.
- Keep imports sorted logically and avoid unused code.

## Performance and accessibility

- Avoid unnecessary re-renders (memoize where needed) and keep component trees lean.
- Ensure interactive elements are accessible and labeled; prefer semantic HTML.

## Documentation and DX

- Update README or inline docs for any new capabilities, environment variables, or scripts.
- Provide small usage examples in JSDoc/TSdoc for new exported functions or components.

## Contracts and types

- Define and export types/interfaces for shared data models.
- Keep function/component signatures minimal and explicit.
- Narrow types aggressively; avoid unions of unrelated shapes.
- Handle error states explicitly and test them.

## Pull request checklist (must be true)

- [ ] The change is fully typed with no `any` introduced (or justified with a TODO).
- [ ] All tests pass locally and new tests cover the added behavior.
- [ ] ESLint passes with zero errors and warnings.
- [ ] TypeScript build/typecheck passes.
- [ ] Public API/usage is documented and examples updated as needed.
- [ ] No dead code, unused exports, or console noise.
- [ ] Minimal diff: unrelated refactors are split into separate PRs.

## Project specifics

- Runtime: React + TypeScript + Vite, tests via Vitest (jsdom).
- Place tests next to source: `*.test.ts(x)` in `src/`.
- Use `@testing-library/react` and `@testing-library/user-event` for UI tests.
- Extend `expect` via `@testing-library/jest-dom` (already configured in `src/test/setup.ts`).

Following these guidelines is required. PRs that don’t meet them will be rejected or asked to be revised.
