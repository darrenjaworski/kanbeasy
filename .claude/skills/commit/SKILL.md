# /commit — Stage, changelog, and commit changes

Follow these steps in order:

## 1. Review changes

Run `git status` and `git diff` (staged and unstaged) to understand what changed.

## 2. Draft commit message

Write a commit message following [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code restructuring (no behavior change)
- `style:` formatting, whitespace (no code change)
- `test:` adding or updating tests
- `docs:` documentation only
- `chore:` tooling, dependencies, config
- `perf:` performance improvement

Use lowercase, imperative mood, no period. Include scope when helpful (e.g., `feat(theme): add forest dark theme`).

Present the proposed commit message to the user and wait for confirmation before proceeding. The user may edit or adjust it.

## 3. Update CHANGELOG.md

Add an entry under `## [Unreleased]` in CHANGELOG.md matching the commit. Use the appropriate heading (`### Features`, `### Fixed`, `### Changed`, `### Removed`, `### Tests`) following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## 4. Stage and commit

Stage the changed files (including CHANGELOG.md) and create the commit. Do NOT use `git add -A` or `git add .` — add specific files by name.

End the commit message with:

```
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## 5. Confirm

Run `git status` and report the commit was created. Do NOT push unless the user asks.
