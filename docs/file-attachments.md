# File & Image Attachments — Design Document

> Supersedes `image-attachments.md` with broader scope: general file attachments, an attachment browser, per-card attachment views, and deeper treatment of storage, lifecycle, and UX implications.

## Overview

Allow users to attach files to cards — images, PDFs, text files, and other small documents. Attachments are stored locally in IndexedDB, displayed in the card detail modal, and browsable via a global attachment browser. All data stays on-device.

## Motivation

Task context often lives in files: screenshots of bugs, mockups, PDFs of specs, config snippets, CSV exports. Without attachments, users paste external links (breaking the "all data local" promise) or describe files in text (losing fidelity). Attachments close this gap.

The IndexedDB migration (v1.36.0) removed the ~5 MB localStorage ceiling, making meaningful local file storage viable for the first time.

## Scope

### In scope (MVP)

- Attach files to cards via file picker or drag-and-drop onto card detail modal
- Image preview (thumbnails, lightbox)
- Non-image files shown as file cards (icon + name + size)
- Per-card attachment section in card detail modal
- Attachment indicator on board cards, list view, calendar view
- Global attachment browser modal (view all attachments across cards)
- Delete attachments from cards
- Export/import with embedded attachments
- Orphan cleanup and storage management

### Out of scope (future)

- Clipboard paste for images (stretch goal, documented below)
- Drag-and-drop reorder of attachments within a card
- Client-side image compression before storage
- Full-text search inside attached documents
- Attachment versioning / history
- Shared attachment library (one file referenced by multiple cards)

---

## Data Model

### AttachmentRef (stored in Card object)

Lightweight metadata that travels with the card through undo/redo, export/import, and archive. The actual file blob lives separately in IndexedDB.

```typescript
type AttachmentRef = Readonly<{
  id: string; // UUID, doubles as IndexedDB key
  filename: string; // Original filename with extension
  mimeType: string; // MIME type (e.g., "image/png", "application/pdf")
  size: number; // Original file size in bytes
  width: number | null; // Intrinsic pixel width (images only, null for non-images)
  height: number | null; // Intrinsic pixel height (images only, null for non-images)
  createdAt: number; // Timestamp (ms since epoch)
}>;
```

**Size budget**: Each ref is ~120–200 bytes JSON. A card with 10 attachments adds ~2 KB to board state — negligible for undo history (50 × 2 KB = 100 KB across all snapshots for a heavily-attached card).

### Card type change

```typescript
type Card = Readonly<{
  // ...existing fields
  attachments: AttachmentRef[]; // NEW — empty array for cards without attachments
}>;
```

### AttachmentBlob (stored in IndexedDB)

```typescript
type AttachmentBlob = {
  id: string; // Matches AttachmentRef.id
  blob: Blob; // Raw file data
};
```

### IndexedDB schema change

Add a third object store to the existing database:

```
Database: "kanbeasy" (version 2, bumped from 1)
  Object Store: "kv"          (existing)
  Object Store: "board"       (existing)
  Object Store: "attachments" (NEW, keyPath: "id")
```

The version bump triggers `onupgradeneeded`, which creates the new store. Existing data in `kv` and `board` is untouched.

---

## Accepted File Types & Limits

### File type categories

| Category     | MIME types                                                            | Preview behavior                                                         |
| ------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Image**    | `image/png`, `image/jpeg`, `image/gif`, `image/webp`, `image/svg+xml` | Thumbnail grid, lightbox on click                                        |
| **Document** | `application/pdf`                                                     | File card with PDF icon, browser opens in new tab on click               |
| **Text**     | `text/plain`, `text/csv`, `text/markdown`, `application/json`         | File card with text icon, inline preview on click (monospace, read-only) |
| **Other**    | Any remaining MIME type                                               | File card with generic icon, download on click                           |

### Size & count limits

| Limit             | Value          | Rationale                                                            |
| ----------------- | -------------- | -------------------------------------------------------------------- |
| Max file size     | 5 MB per file  | Covers screenshots, small PDFs, code files; keeps storage manageable |
| Max per card      | 10 attachments | Generous but prevents cards from becoming file dumps                 |
| Max total storage | 100 MB         | Warn at 80 MB; hard block at 100 MB; generous for a task board       |
| Accepted types    | All files      | No artificial MIME restrictions — let users attach what they need    |

Why 5 MB (vs 2 MB in the image-only doc): general files like PDFs routinely exceed 2 MB. 5 MB covers the vast majority of documents users would attach to task cards without allowing huge media files.

---

## Storage Layer

### Module: `src/utils/attachmentStorage.ts`

A thin async wrapper over the `attachments` object store. This module is separate from `db.ts` because attachment operations are inherently async (blobs are large) and don't benefit from the sync cache pattern used for board state.

```typescript
/** Store an attachment blob. */
export async function saveAttachment(id: string, blob: Blob): Promise<void>;

/** Retrieve an attachment blob by ID. Returns null if missing. */
export async function getAttachment(id: string): Promise<Blob | null>;

/** Delete a single attachment. No-op if missing. */
export async function deleteAttachment(id: string): Promise<void>;

/** Delete multiple attachments in a single transaction. */
export async function deleteAttachments(ids: string[]): Promise<void>;

/** List all attachment IDs in the store. Used by orphan sweep. */
export async function getAllAttachmentIds(): Promise<string[]>;

/** Calculate total bytes used by all attachments. */
export async function getAttachmentStorageUsage(): Promise<{
  totalBytes: number;
  count: number;
}>;
```

**Implementation notes**:

- Uses the same `IDBDatabase` connection opened by `db.ts` → export the `db` handle or share via module-level variable
- No caching — blobs are too large to hold in memory speculatively; create object URLs on demand
- All operations are fire-and-forget from the UI perspective (optimistic); errors logged but don't block the user
- ~80 lines of code, no dependencies

### Integration with `db.ts`

The `openDatabase()` function in `db.ts` needs to handle the version 2 upgrade:

```typescript
request.onupgradeneeded = (event) => {
  const db = request.result;
  const oldVersion = event.oldVersion;

  if (oldVersion < 1) {
    db.createObjectStore("kv", { keyPath: "key" });
    db.createObjectStore("board", { keyPath: "id" });
  }
  if (oldVersion < 2) {
    db.createObjectStore("attachments", { keyPath: "id" });
  }
};
```

---

## Upload Flow

### File picker

1. User clicks "+ Attach file" button in card detail modal (below description, above metadata)
2. Native file picker opens: `<input type="file" accept="*/*" multiple>`
3. For each selected file, validate:
   - Size ≤ 5 MB (reject with inline error: "File exceeds 5 MB limit")
   - Card attachment count < 10 (reject: "Maximum 10 attachments per card")
   - Total storage < 100 MB (reject: "Storage limit reached — delete unused attachments in Settings")
4. For images: extract dimensions via `createImageBitmap()` (fast, no DOM needed)
5. Generate UUID for each attachment
6. Store blob in IndexedDB via `saveAttachment()`
7. Add `AttachmentRef` to card via `updateCard({ attachments: [...card.attachments, ref] })`
8. UI updates immediately (optimistic — ref is in state, blob is being written)

### Drag-and-drop

1. Listen for `dragover`/`drop` on the card detail modal body (or a dedicated drop zone)
2. On drop, extract `DataTransfer.files`
3. Follow same validation and storage flow as file picker
4. Show a visual drop zone indicator ("Drop files to attach") on `dragenter`

### Clipboard paste (stretch goal)

1. Listen for `paste` event on the card detail modal
2. Check `clipboardData.items` for file types
3. If found, treat as upload with filename `pasted-image-{timestamp}.png`
4. Natural UX for attaching screenshots

---

## Display: Card Detail Modal

### Attachment section layout

Position: below description/checklist, above column/type/due date metadata.

```
┌─────────────────────────────────────┐
│ #42 Card Details              [X]   │
├─────────────────────────────────────┤
│ Title: [Fix login timeout bug     ] │
│                                     │
│ Description:                        │
│ ┌─────────────────────────────────┐ │
│ │ Steps to reproduce...           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Attachments (3)                     │
│ ┌───────┐ ┌───────┐ ┌───────────┐ │
│ │ thumb │ │ thumb │ │ 📄 spec   │ │
│ │  .png │ │  .jpg │ │    .pdf   │ │
│ │  245K │ │  1.2M │ │    3.1M   │ │
│ └───────┘ └───────┘ └───────────┘ │
│ [+ Attach file]                     │
│                                     │
│ Column: [In Progress ▼]            │
│ Type:   [feat ▼]                    │
│ Due:    [2026-03-15]                │
│                                     │
│ [Archive card]                      │
│ Created: Mar 1, 2026               │
│ Updated: Mar 8, 2026               │
└─────────────────────────────────────┘
```

### Thumbnail grid

- Images render as thumbnails in a responsive grid (2–3 per row)
- Non-image files render as styled file cards with:
  - File type icon (distinct icons for PDF, text, code, generic)
  - Filename (truncated with ellipsis if long)
  - File size
- Each attachment has a delete button (×) in the top-right corner, visible on hover
- Delete requires confirmation: "Remove [filename]? The file will be permanently deleted."

### Click behavior

| File type              | Click action                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Image                  | Open lightbox overlay (full-size, dark backdrop, close on click/Escape)            |
| PDF                    | Open blob URL in new browser tab (native PDF viewer)                               |
| Text/CSV/JSON/Markdown | Open inline preview modal (monospace, read-only, scrollable, with download button) |
| Other                  | Trigger download via blob URL                                                      |

### Image lightbox

- Full-viewport dark overlay with the image centered and scaled to fit
- Close via: click backdrop, press Escape, click × button
- Navigation arrows if card has multiple images (left/right, keyboard arrows)
- Filename and size displayed below image
- Download button in lightbox toolbar

### Loading states

- While blob is being read from IndexedDB: show a shimmer/skeleton placeholder at the known dimensions (from `width`/`height` in the ref)
- If blob is missing (orphaned ref after failed write or import without attachments): show a "missing file" placeholder with the filename

---

## Display: Board Cards

Attachment presence is indicated on board cards to surface that a card has files without opening the detail modal.

### By card density

| Density              | Indicator                                                               |
| -------------------- | ----------------------------------------------------------------------- |
| Compact (small)      | 📎 icon only, next to checklist progress / due date badge row           |
| Comfortable (medium) | 📎 icon + count (e.g., "📎 3") in the badge row                         |
| Spacious (large)     | First image as a small thumbnail strip (max 64px tall) + overflow count |

The indicator is a simple read of `card.attachments.length` — no IndexedDB access needed. The "large" density thumbnail requires loading blobs, so it should be lazy-loaded with an intersection observer to avoid loading images for off-screen cards.

### List view

Add an attachment count to the list view table. Options:

- **Option A**: Dedicated "Attachments" column with 📎 count (adds width)
- **Option B**: Paperclip icon + count appended to the title cell (compact)

**Recommendation**: Option B for MVP. A dedicated column adds clutter for a secondary data point. The icon + count next to the title is enough to indicate "this card has files."

### Calendar view

Same as list view: 📎 icon + count next to the card title on calendar day cells.

---

## Attachment Browser (Global View)

A new modal accessible from the header (alongside Analytics, Archive, Settings) that shows all attachments across all cards.

### Why a global browser?

- **Discovery**: Users can browse all images/files without remembering which card they're on
- **Storage management**: See what's using space, delete large or unused files
- **Quick navigation**: Click an attachment to jump to its card

### Layout

```
┌──────────────────────────────────────────────┐
│ 📎 Attachments (47 files, 34.2 MB)    [X]   │
├──────────────────────────────────────────────┤
│ [All ▼] [Search attachments...        ] [≡/⊞]│
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  thumb   │  │  thumb   │  │ 📄 file │     │
│  │ bug.png  │  │ mock.jpg │  │ spec.pdf│     │
│  │ 245 KB   │  │ 1.2 MB   │  │ 3.1 MB  │     │
│  │ Card #42 │  │ Card #18 │  │ Card #7 │     │
│  └─────────┘  └─────────┘  └─────────┘     │
│                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  thumb   │  │ 📄 file │  │  thumb   │     │
│  │ flow.png │  │ data.csv│  │ err.png  │     │
│  │ 890 KB   │  │ 12 KB   │  │ 456 KB   │     │
│  │ Card #31 │  │ Card #31 │  │ Card #55 │     │
│  └─────────┘  └─────────┘  └─────────┘     │
│                                              │
└──────────────────────────────────────────────┘
```

### Features

- **Header**: Total count and storage used
- **Filter dropdown**: All / Images / Documents / Other
- **Search**: Filter by filename (fuzzy match, same pattern as card search)
- **View toggle**: Grid view (thumbnails) / List view (table with columns: name, type, size, card, date)
- **Each attachment tile shows**:
  - Thumbnail (images) or file type icon (non-images)
  - Filename
  - File size
  - Parent card reference ("Card #42" or card title, truncated)
- **Click attachment**: Opens lightbox (images) or triggers preview/download (non-images)
- **Click card reference**: Closes browser, opens that card's detail modal
- **Delete**: Multi-select checkboxes + bulk delete (same pattern as archive modal)
- **Disabled state**: Button disabled in header when no attachments exist (same pattern as analytics/archive)

### Data flow

The attachment browser does NOT need to load all blobs upfront. It reads attachment metadata from the board state (iterating all cards + archive), which is synchronous from the cache. Blobs are loaded lazily per-tile as thumbnails come into view.

```typescript
function getAllAttachmentRefs(): Array<{
  ref: AttachmentRef;
  cardId: string;
  cardNumber: number;
  cardTitle: string;
  columnTitle: string;
  isArchived: boolean;
}> {
  // Iterate board.columns[].cards[].attachments
  // + board.archive[].attachments
  // Return flat list with card context
}
```

This is a pure function over the board state — no async, no IndexedDB reads for the listing. Only thumbnail rendering triggers blob reads.

---

## Export / Import

### Export format (version 11)

```typescript
{
  version: 11,
  exportedAt: string,
  board: BoardState,
  settings: { ... },
  attachments: {                              // NEW
    [id: string]: {
      filename: string,
      mimeType: string,
      base64: string                          // Raw base64 (no data: prefix)
    }
  }
}
```

### Export flow

1. Collect all `AttachmentRef.id` values from board + archive
2. For each, read blob from IndexedDB
3. Convert each blob to base64 via `FileReader.readAsDataURL()` (strip prefix) or `arrayBuffer()` + manual base64
4. Estimate total export size. If > 10 MB, show warning dialog:
   - "This export is approximately X MB due to file attachments."
   - [Export with attachments] [Export without attachments] [Cancel]
5. "Without attachments" omits the `attachments` key; card refs remain (shown as "missing" on import)
6. Show progress bar during export (file count / total)

### Import flow

1. Parse JSON, check version
2. v1–10 imports: backfill `attachments: []` on all cards (no blob data expected)
3. v11+ imports: if `attachments` key present, decode each base64 to Blob, store in IndexedDB
4. Show progress bar during import
5. If a ref in a card points to an ID not in the attachments map: leave as-is (will show "missing" placeholder)

### Size implications

- A board with 50 images averaging 500 KB each = ~25 MB raw, ~33 MB base64 in export JSON
- This is large but manageable. JSON.stringify of a 33 MB string is fine in modern browsers.
- For boards with many large files, the "export without attachments" escape hatch is essential

---

## Lifecycle & Cleanup

### When to delete blobs

| Event                                      | Action                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| User removes single attachment from card   | Delete blob immediately                                                  |
| User permanently deletes card from archive | Delete all card's blobs                                                  |
| User clears archive ("Clear all archived") | Delete all blobs for archived cards                                      |
| User clears board data                     | Delete all blobs                                                         |
| User clears all data                       | Delete all blobs (drop entire `attachments` store)                       |
| Undo "remove attachment"                   | Blob still exists (we deleted eagerly but undo restores ref — see below) |

### Undo/redo and blob lifecycle

**The problem**: If a user removes an attachment and we immediately delete the blob, then the user hits Undo, the ref is restored but the blob is gone.

**Solution**: Two-phase deletion.

1. When user removes an attachment from a card, **do not** delete the blob immediately. Instead, the blob becomes an orphan (ref removed from card state, blob still in IDB).
2. Orphaned blobs are cleaned up:
   - On app startup (orphan sweep)
   - When a card is permanently deleted from the archive
   - When the user explicitly clears data
3. This means: after removing an attachment, the user can Undo and get it back. Once the removal falls off the 50-entry undo history, the blob is cleaned up on next startup.

**Storage cost of deferred cleanup**: A user would need to remove many large attachments in a single session without any of the cleanup triggers firing. In the worst case, this temporarily orphans a few MB — well within IndexedDB quotas and cleaned on next app load.

### Orphan sweep

Run on every app startup (inside `openDatabase()` or as a separate `cleanupOrphanAttachments()` called from `AppLoader`):

```typescript
async function cleanupOrphanAttachments(board: BoardState): Promise<number> {
  // 1. Collect all AttachmentRef.id values from board.columns + board.archive
  const referencedIds = new Set<string>();
  for (const col of board.columns) {
    for (const card of col.cards) {
      for (const att of card.attachments) {
        referencedIds.add(att.id);
      }
    }
  }
  for (const archived of board.archive) {
    for (const att of archived.attachments) {
      referencedIds.add(att.id);
    }
  }

  // 2. Get all blob IDs from IndexedDB
  const storedIds = await getAllAttachmentIds();

  // 3. Delete blobs not referenced by any card
  const orphanIds = storedIds.filter((id) => !referencedIds.has(id));
  if (orphanIds.length > 0) {
    await deleteAttachments(orphanIds);
  }

  return orphanIds.length;
}
```

This runs once, is async, and doesn't block app rendering (fires after `AppLoader` completes).

---

## Storage Management UI

### Settings > Data updates

Expand the existing storage display:

```
Storage
  Total usage: 48.3 MB
  Board data:  1.2 MB
  Attachments: 47.1 MB (156 files)
  Persistent storage: Not granted

[Manage attachments...]   ← opens attachment browser
```

The attachment storage figure comes from `getAttachmentStorageUsage()`. Board data is `navigator.storage.estimate().usage` minus attachment storage (approximate, since IDB doesn't expose per-store sizes — alternatively, serialize the board state and measure its byte length).

### Storage warning

When total attachment storage exceeds 80 MB (80% of the 100 MB soft limit):

- Show a warning banner in the attachment section of the card detail modal: "Attachment storage is nearly full (X MB / 100 MB). Delete unused files in Settings."
- Block new uploads at 100 MB with a clear error message

These thresholds are constants, not hard browser limits. The actual IndexedDB quota is much larger, but self-imposed limits prevent the board from growing to unmanageable sizes (especially for export).

---

## Search Integration

### Filename search

When the user searches cards (header search bar), also match against attachment filenames:

```typescript
// In the existing search logic:
const matchesAttachment = card.attachments.some((att) =>
  fuzzyMatch(query, att.filename),
);
```

This is cheap — filenames are small strings in the card object. No IndexedDB access needed.

### Search in attachment browser

The attachment browser has its own search that filters the file listing by filename. This is a local filter over the in-memory attachment ref list.

---

## Migration

### Card migration (`migration.ts`)

```typescript
// In migrateCard():
if (!Array.isArray(raw.attachments)) {
  raw.attachments = [];
}
```

Backfill empty attachments array on all legacy cards. Same pattern as other field backfills.

### Import migration (`importBoard.ts`)

- v1–10: Default `attachments: []` on all cards, no blob processing
- v11+: Process `attachments` blob map if present

### DB version migration (`db.ts`)

- Bump DB_VERSION from 1 to 2
- In `onupgradeneeded`: create `attachments` object store if `oldVersion < 2`
- Existing data untouched

---

## Command Palette Integration

Add attachment-related actions to the command palette:

- "Attach file to card" — opens file picker (only when card detail modal is open)
- "Browse attachments" — opens attachment browser modal

---

## Performance Considerations

### Memory

- Blobs are NOT held in memory. Object URLs are created on demand for visible thumbnails and revoked when components unmount.
- The attachment browser uses virtualized scrolling if the list grows large (>50 items). For MVP, a simple grid with lazy loading via Intersection Observer is sufficient.

### IndexedDB reads

- Reading a blob from IDB is async and takes 1–10ms for typical file sizes. For a grid of thumbnails, this means a brief flash as images load.
- Mitigate with: skeleton placeholders at known dimensions (from `width`/`height` in the ref), batch reads where possible.

### Export

- Converting blobs to base64 is CPU-intensive for large files. Use `arrayBuffer()` + chunked base64 encoding to avoid blocking the main thread.
- For very large exports (>50 MB), consider using a Web Worker (stretch goal).

---

## Accessibility

- File picker triggered by a labeled button, not a hidden input hack
- Attachment thumbnails have `alt` text set to the filename
- Lightbox is focus-trapped and keyboard-navigable (Escape to close, arrows to navigate)
- Delete confirmations are accessible dialogs (reuse existing `ConfirmDialog` component)
- File type icons have `aria-label` describing the type (e.g., "PDF document")
- Attachment browser supports keyboard navigation (tab through tiles, Enter to open)

---

## Implementation Plan

### Phase 1: Storage layer & data model

1. Bump DB version to 2; add `attachments` object store in `db.ts`
2. Create `src/utils/attachmentStorage.ts`
3. Add `AttachmentRef` type and `attachments: AttachmentRef[]` field to `Card`
4. Add migration backfill in `migration.ts`
5. Add `addAttachment()` and `removeAttachment()` mutations to `useBoardMutations`
6. Unit tests for storage utility, mutations, and migration

### Phase 2: Card detail modal — attachment section

1. Add attachment section component to `CardDetailModal`
2. File picker with validation (size, count, storage limit)
3. Thumbnail grid for images, file cards for non-images
4. Delete button with confirmation
5. Drag-and-drop upload onto modal
6. Attachment count indicator on board cards (all densities)
7. Unit and e2e tests

### Phase 3: Image lightbox

1. Create `Lightbox` component (full-viewport overlay)
2. Multi-image navigation (arrows, keyboard)
3. Download button
4. Non-image preview: inline text viewer, PDF open-in-tab
5. Unit tests

### Phase 4: Attachment browser modal

1. Create `AttachmentBrowser` component
2. Add header button (disabled when no attachments exist)
3. Grid/list view toggle
4. File type filter dropdown
5. Filename search
6. Click-to-open (lightbox/preview/download)
7. Click card reference to navigate to card detail
8. Multi-select + bulk delete
9. Unit and e2e tests

### Phase 5: Export/import

1. Bump export version to 11
2. Embed attachment blobs as base64 in export
3. Import: decode base64, store in IndexedDB
4. Progress indicator for large exports/imports
5. "Export without attachments" option with size warning
6. Handle missing blobs gracefully (placeholder UI)
7. Migration tests for v10 → v11

### Phase 6: Lifecycle & cleanup

1. Orphan sweep on startup
2. Cleanup on permanent card delete, archive clear, board clear
3. Storage usage breakdown in Settings > Data
4. Storage warning at 80 MB threshold
5. Block uploads at 100 MB threshold

### Phase 7: Polish

1. Clipboard paste support for images
2. Attachment filename search integration in header search
3. Command palette actions
4. List view and calendar view attachment indicators
5. Client-side image compression (canvas resize + WebP/JPEG re-encode)
6. Drag-and-drop reorder of attachments within a card

---

## Risks & Mitigations

| Risk                                                       | Impact                             | Mitigation                                                                          |
| ---------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| IndexedDB unavailable (rare browsers, strict private mode) | Attachment feature silently broken | Feature-detect IDB; hide attachment UI if unavailable; show explanatory message     |
| Large exports slow or OOM                                  | Poor UX, data loss                 | Progress bar, chunked processing, "without attachments" escape hatch, size warnings |
| Orphaned blobs accumulate                                  | Wasted storage                     | Startup orphan sweep + cleanup on permanent deletion                                |
| Undo restores ref to deleted blob                          | Missing file placeholder           | Two-phase deletion: defer blob cleanup to orphan sweep                              |
| Browser storage eviction under pressure                    | Data loss for attachments          | Recommend persistent storage request; periodic export reminders                     |
| Very large boards (1000+ attachments)                      | Slow attachment browser, heavy IDB | Lazy loading, virtual scroll, pagination if needed                                  |
| Export file too large for email/sharing                    | User frustration                   | Size estimate before export, "without attachments" option, compression stretch goal |

---

## Decision Log

| Decision                | Chosen                                  | Alternatives considered                                          |
| ----------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| File types              | All files, not just images              | Image-only (too restrictive for real task boards)                |
| Max file size           | 5 MB                                    | 2 MB (too small for PDFs), 10 MB (export bloat risk)             |
| Max per card            | 10                                      | 5 (restrictive), unlimited (storage abuse)                       |
| Storage limit           | 100 MB soft cap                         | 50 MB (tight), unlimited (export impractical)                    |
| Blob storage            | Separate IDB object store               | Inline in card (undo bloat), filesystem API (limited support)    |
| Blob lifecycle          | Two-phase (defer to orphan sweep)       | Eager delete (breaks undo), ref-counting (overengineered)        |
| Attachment browser      | Dedicated modal                         | Tab in settings (too hidden), sidebar (layout complexity)        |
| Export with attachments | Base64 in JSON                          | ZIP file (adds dependency), separate files (complicates UX)      |
| Non-image preview       | Type-specific (PDF in tab, text inline) | Uniform download-only (misses easy wins for common types)        |
| DB version bump         | 2 (add attachments store)               | Reuse kv store for blobs (wrong abstraction, no key type safety) |
