# /snapshot — Update visual regression baselines

Follow these steps in order:

## 1. Regenerate snapshots

Run:

```bash
npm run e2e:snapshot
```

## 2. Check results

If any tests failed (not just snapshot mismatches), stop and report the failures.

## 3. Show changes

List which snapshot files were added or modified using `git status`.

## 4. Ask for review

Tell the user to review the updated snapshots in `tests-e2e/visual-regression.spec.ts-snapshots/`. Do NOT commit or proceed until the user confirms the snapshots look correct.

## 5. Commit

After the user confirms, stage the snapshot files and commit:

```
test(e2e): update visual regression snapshots
```

Include a brief note in the commit body listing which snapshots changed.
