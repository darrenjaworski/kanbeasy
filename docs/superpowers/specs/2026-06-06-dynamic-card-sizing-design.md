# Dynamic Card Sizing — Design Spec

**Date:** 2026-06-06
**Issue:** #19 — dynamic card sizing

## Summary

Add a `"dynamic"` option to the card density setting. When selected, cards auto-size to fit their content using the CSS `field-sizing: content` property, rather than rendering with a fixed row count.

## Data Model

**`src/theme/types.ts`**

- Extend `CardDensity` from `"small" | "medium" | "large"` to include `"dynamic"`.
- Update `ROWS_FOR_DENSITY` to type `Record<CardDensity, number | undefined>`, with `dynamic: undefined`.

## Card Rendering

**`src/components/board/SortableCardItem.tsx`**

- When `density === "dynamic"`, omit the `rows` prop from the `<textarea>` and add `fieldSizing: 'content'` as an inline style property.
- When density is any other value, behaviour is unchanged (fixed `rows` from `ROWS_FOR_DENSITY`).
- The existing `hover:resize-y focus:resize-y` classes remain — they still allow manual resize override.
- The mobile `<button>` path is unaffected (already grows with content).

## Settings UI

**`src/components/settings/SettingsModal.tsx`** (or whichever component renders the density picker)

- Add a fourth option `"Dynamic"` (value `"dynamic"`) to the card density selector, after `"Large"`.
- No other settings changes required.

## Backwards Compatibility

**`getInitialDensity()` allowlist (`src/theme/ThemeProvider.tsx`):** This function validates the stored string against an explicit allowlist before accepting it. `"dynamic"` must be added to this guard — without it, selecting "Dynamic" would persist to localStorage but be silently reset to `"small"` on the next page load.

**`ROWS_FOR_DENSITY` type:** The map type changes from `Record<CardDensity, number>` to `Record<CardDensity, number | undefined>`. All call sites that read this map and pass the result to `rows={...}` must guard against `undefined` (only pass `rows` when the value is defined). TypeScript will surface any missed call sites at compile time.

**Existing users:** No stored density value changes. Users already on `"small"`, `"medium"`, or `"large"` are unaffected — those paths are identical after this change. The default density remains `"small"`.

**Downgrade safety:** If a user selects `"dynamic"`, then downgrades to an older build, `getInitialDensity()` on the old build will not recognise `"dynamic"` and will fall back to `"small"` — the same fallback it uses for any unknown value today. No data loss occurs.

## Storage & Migration

- `CardDensity` is persisted to localStorage as a string. `"dynamic"` is a new valid string; existing values continue to work without a migration.
- No export version bump required — density is a display preference, not board data.

## Browser Compatibility

- `field-sizing: content` is supported in Chrome 123+, Firefox 128+, and Safari 18+.
- Users on older browsers will see a textarea with no fixed `rows` — it will default to the browser's default textarea height (typically ~2 rows). This is an acceptable degradation.

## Tests

- Update unit tests that enumerate `CardDensity` values to include `"dynamic"`.
- Regenerate E2E visual regression snapshots after the change (`npm run e2e:snapshot`).
