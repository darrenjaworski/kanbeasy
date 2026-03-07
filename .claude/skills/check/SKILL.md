# /check — Run all static checks and report results

Run `npm run static-checks` which executes: format:check, lint, knip, type:check, build, and test:run.

Report a clear summary:

- Which checks passed
- Which checks failed, with the relevant error output
- If everything passes, confirm with a one-line summary

If a check fails, do NOT attempt to fix it automatically. Just report the failure so the user can decide what to do.
