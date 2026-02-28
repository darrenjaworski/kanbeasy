# /release — Prepare and cut a new version

Follow these steps in order. If any step fails, stop and report the failure — do NOT skip ahead.

## 1. Determine version bump

Run:

```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

Read the commits and apply semver based on conventional commits:

- `fix:` → patch
- `feat:` → minor
- `BREAKING CHANGE` or `!` → major

Present the proposed version bump to the user and wait for confirmation before proceeding.

## 2. Run all checks

Run `npm run kitchen-sink`. This runs static-checks (format, lint, knip, typecheck, build, unit tests) followed by e2e tests. Everything must pass. If anything fails, diagnose and fix the issue, then re-run. If you cannot fix after 3 attempts, stop and report.

## 3. Update ROADMAP.md

- Compare commits since the last tag against items in `ROADMAP.md`
- Move any completed items from **upcoming** to **shipped** (mark with ✅)
- Ensure new features not already listed are added to the shipped section

## 4. Update CHANGELOG.md

- Move items from `[Unreleased]` into a new version heading
- Group changes under `### Features`, `### Fixed`, `### Changed`, `### Removed` as appropriate
- Derive entries from the conventional commit messages since the last tag
- Follow the existing [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format

## 5. Commit docs changes

Commit the ROADMAP.md and CHANGELOG.md updates:

```
docs: update changelog and roadmap for vX.Y.Z release
```

## 6. Bump version and tag

Run:

```bash
npm version <patch|minor|major>
```

This updates `package.json`, creates a commit, and creates a git tag.

## 7. Verify build

Run:

```bash
npm run build
```

Ensure it compiles cleanly at the new version.

## 8. STOP

Report the release summary (version, key changes, tag name). Do NOT push unless the user explicitly asks to push.
