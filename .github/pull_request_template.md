## Summary

Briefly describe the change and the problem it solves.

- Linked issue(s): Fixes #
- Type of change: Feature | Bug fix | Chore | Docs | Refactor | Test

## Changes

- What’s changed at a high level?
- Any breaking changes? If yes, explain migration steps.

## Test plan

- How did you verify this change? Include steps, scenarios, and edge cases.
- For UI changes, include screenshots/video.

## Checklist (must be true)

- [ ] TypeScript typecheck passes locally (npm run -s build)
- [ ] ESLint passes with zero errors/warnings (npm run lint)
- [ ] Unit tests pass locally (npm test)
- [ ] New/changed behavior is covered by tests (happy path + at least one edge case)
- [ ] New code is fully typed; no `any` or implicit `any` introduced
- [ ] Public APIs/components are fully typed and documented (props, return values, events)
- [ ] No dead code, unused exports, or console noise
- [ ] Minimal diff; unrelated refactors split into separate PRs
- [ ] Accessibility considered (labels, roles, keyboard nav, color contrast)
- [ ] Performance considered (avoid unnecessary re-renders; memoize where appropriate)
- [ ] README or inline docs updated if behavior or scripts changed

## Notes

- See the repo guidelines: [.github/copilot-instructions.md](./copilot-instructions.md)
- Tests live next to source in `src/` as `*.test.ts(x)` and use Vitest + Testing Library.
- Please ensure static checks are passing
- [please follow conventional commits for the PR title.](https://www.conventionalcommits.org/en/v1.0.0/)
