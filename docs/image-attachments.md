# Image Attachments — Design Document

## Overview

Allow users to attach images to cards. Attachments are displayed as thumbnails in the card detail modal, with optional inline rendering in the board card preview. All data stays local — no external services.

## Motivation

Images are a natural fit for task context: screenshots of bugs, mockups, reference photos, diagrams. Without attachments, users resort to pasting links to external services, which breaks the "all data saved locally" promise of the app.

## Constraints

### localStorage quota (~5 MB)

The entire board (columns, cards, archive, settings) lives in a single localStorage key. A single uncompressed photo can easily exceed 1 MB. Base64 encoding inflates binary size by ~33%, so a 1 MB image becomes ~1.33 MB of JSON text. With 50 states in the undo/redo history stack, every attachment stored in board state is duplicated up to 50 times in memory (though not on disk — only `present` is persisted).

**This is the central design tension**: localStorage is too small for meaningful image storage, but IndexedDB adds significant complexity.

### Export/import

The current export format is a single JSON file. Embedding base64 images inflates export size dramatically and makes the file unreadable for debugging. But splitting attachments out of the export complicates the "single file backup" simplicity.

### Bundle size

The app is ~134 KB gzipped. Any image processing library (compression, thumbnailing) must be evaluated against the dependency guidelines (gzipped size, transitive deps, maintenance).

### Undo/redo

The undo stack holds full board state snapshots. Storing image data directly in card objects would mean every undo state contains copies of every attachment. This is not viable for in-memory state.

## Design Options

### Option A: Base64 in localStorage (simplest, most limited)

Store images as base64 strings directly in the Card object.

```typescript
type Attachment = Readonly<{
  id: string;
  filename: string;
  mimeType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
  base64: string; // data URL (e.g., "data:image/png;base64,...")
  size: number; // original file size in bytes
  createdAt: number;
}>;

type Card = Readonly<{
  // ...existing fields
  attachments: Attachment[];
}>;
```

**Pros**:

- Zero new dependencies or APIs
- Attachments travel with undo/redo, export/import, and archive automatically
- Simplest migration (add empty `attachments: []` to existing cards)

**Cons**:

- localStorage quota hit almost immediately (2–3 images fills 5 MB)
- Undo history balloons in memory (50 copies of every image in RAM)
- Export files become enormous and non-human-readable
- No way to store moderate-resolution screenshots

**Verdict**: Not viable for real use. Could work only with extremely aggressive size limits (~50 KB per image, thumbnail-quality only), which would frustrate users.

### Option B: IndexedDB for blobs, references in localStorage (recommended)

Store image blobs in IndexedDB. Card objects hold lightweight references. Board state stays small.

```typescript
// Stored in the Card object (in localStorage, in undo stack, in export)
type AttachmentRef = Readonly<{
  id: string; // UUID, doubles as IndexedDB key
  filename: string;
  mimeType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
  size: number; // original file size in bytes
  width: number; // intrinsic pixel width (for layout before load)
  height: number; // intrinsic pixel height
  createdAt: number;
}>;

type Card = Readonly<{
  // ...existing fields
  attachments: AttachmentRef[];
}>;

// Stored in IndexedDB (not in undo stack, not in localStorage)
type AttachmentBlob = {
  id: string; // matches AttachmentRef.id
  blob: Blob; // raw image data
};
```

**Pros**:

- IndexedDB quota is generous (typically 50% of disk, hundreds of MB to GB)
- Board state stays small — references are ~100 bytes each
- Undo/redo history stays lightweight (only refs, not blobs)
- Clean separation of metadata (fast, small) from data (large, lazy-loaded)

**Cons**:

- IndexedDB API is async and awkward (mitigated by a thin wrapper)
- Export/import needs special handling (embed blobs or omit them)
- Blob lifecycle management (orphan cleanup when cards are permanently deleted)
- New storage layer to test and maintain

**Verdict**: Best balance of capability and complexity. This is the recommended approach.

### Option C: URL references only (no local storage)

Cards store external URLs. Users paste image links from other services.

**Pros**: Zero storage impact, trivial to implement.

**Cons**: Breaks the "all data local" principle, links rot, depends on external hosting, no offline support. Essentially a markdown image link with extra UI — users can already do `![](url)` in descriptions.

**Verdict**: Not worth building as a dedicated feature. Already achievable via markdown descriptions.

## Recommended Design: Option B (IndexedDB + references)

### IndexedDB Schema

Single object store, no indexes needed (all lookups by primary key):

```
Database: "kanbeasy"
  Object Store: "attachments"
    keyPath: "id"
    value: { id: string, blob: Blob }
```

### Storage Utility

A thin async wrapper over IndexedDB, co-located with the existing `utils/storage.ts`:

```typescript
// src/utils/attachmentStorage.ts

export async function saveAttachment(id: string, blob: Blob): Promise<void>;
export async function getAttachment(id: string): Promise<Blob | null>;
export async function deleteAttachment(id: string): Promise<void>;
export async function deleteAttachments(ids: string[]): Promise<void>;
export async function getAllAttachmentIds(): Promise<string[]>;
export async function getStorageUsage(): Promise<{
  used: number;
  count: number;
}>;
```

No third-party IndexedDB wrapper needed. The raw API is verbose but manageable for a single object store with key-only lookups. A ~60 line module.

### Upload Flow

1. User clicks "Add image" in card detail modal
2. Native file picker opens (`<input type="file" accept="image/*">`)
3. Client-side validation:
   - File type: `image/png`, `image/jpeg`, `image/gif`, `image/webp`
   - Max file size: **2 MB** per image (configurable constant)
   - Max attachments per card: **5** (configurable constant)
4. Read file as `Blob`, extract dimensions via `createImageBitmap()` or an `<img>` element
5. Generate UUID for attachment ID
6. Store blob in IndexedDB
7. Add `AttachmentRef` to card's `attachments[]` via `updateCard()`
8. Display thumbnail immediately (create object URL from blob)

### Display

**Card detail modal**:

- Attachment section below description, above metadata
- Grid of thumbnails (2–3 per row depending on modal width)
- Click thumbnail to view full-size in a lightbox overlay
- Hover reveals a delete button (with confirmation)
- Drag-and-drop reordering (stretch goal, not MVP)

**Board card preview** (density-dependent):

- Small density: no attachment indicator (too compact)
- Medium density: small paperclip icon with count badge (e.g., "2")
- Large density: first image as a small thumbnail strip

**List view**:

- Paperclip icon with count in a dedicated column or inline with title

### Deletion & Orphan Cleanup

Attachments must be cleaned up when:

- A single attachment is removed from a card
- A card is permanently deleted from the archive
- The archive is cleared
- Board data is cleared ("Clear board" or "Clear all" in settings)

**Strategy**: Eager deletion. When any of the above occurs, immediately call `deleteAttachment(id)` or `deleteAttachments(ids)` for the affected blobs.

**Orphan sweep** (defensive): On app startup, compare all `AttachmentRef.id` values across cards and archived cards against `getAllAttachmentIds()` from IndexedDB. Delete any blobs not referenced by any card. This handles edge cases where the browser closed mid-operation.

### Undo/Redo Considerations

Since blobs live in IndexedDB and only references are in the undo stack:

- **Add attachment**: Ref is added to card. Undo removes the ref. The blob stays in IndexedDB (orphan sweep will clean it up, or we can eagerly delete on undo).
- **Remove attachment**: Ref is removed from card. Undo restores the ref. The blob must still exist in IndexedDB — so **do not delete blobs on remove**. Instead, mark for deferred cleanup. Only permanently delete blobs when the undo history no longer contains the ref (i.e., when the history entry falls off the 50-state stack).
- **Simplification**: Given the complexity of tracking undo history for blob lifecycle, the pragmatic approach is to **never eagerly delete blobs based on undo actions**. Only delete blobs during permanent card deletion, archive clear, or the startup orphan sweep. The storage cost of a few orphaned blobs (a few MB) is negligible given IndexedDB's generous quota.

### Export/Import

Two strategies, both supported:

**Default: Include attachments in export**

- When exporting, read all referenced blobs from IndexedDB
- Convert each to base64 and embed in the JSON under a top-level `attachments` key
- Export format version bump: 9 → 10

```typescript
// Export format v10
{
  version: 10,
  exportedAt: string,
  board: { columns: Column[], archive: ArchivedCard[] },
  settings: { ... },
  attachments: {
    [id: string]: {
      filename: string,
      mimeType: string,
      base64: string, // raw base64 (no data URL prefix)
    }
  }
}
```

- On import: decode base64 back to blobs, store in IndexedDB, refs are already in card data
- Show a progress indicator during export/import (could take seconds for large boards)

**Fallback: Export without attachments**

- If export with attachments would exceed a reasonable size (e.g., >10 MB), warn the user
- Offer "Export without images" option that omits the `attachments` key
- On import of such a file: cards retain `AttachmentRef` metadata but blobs are missing — show a "missing image" placeholder

### Migration

**Card migration** (`migration.ts`):

```typescript
// In migrateCard():
if (!raw.attachments || !Array.isArray(raw.attachments)) {
  raw.attachments = [];
}
```

**Import migration** (`importBoard.ts`):

- v1–9 imports: default `attachments: []` on all cards
- v10+ imports: process `attachments` blob map if present

### Size Limits & Guardrails

| Limit             | Value                | Rationale                                                     |
| ----------------- | -------------------- | ------------------------------------------------------------- |
| Max file size     | 2 MB                 | Covers most screenshots and photos; large enough to be useful |
| Max per card      | 5                    | Prevents cards from becoming image dumps                      |
| Max total storage | 50 MB                | Warn user when approaching; generous for a task board         |
| Accepted types    | png, jpeg, gif, webp | Standard web image formats                                    |

Display a storage usage indicator in Settings > Data showing current attachment storage (e.g., "Images: 12.4 MB across 23 attachments").

### Image Compression (stretch goal)

To reduce storage, compress images client-side before storing:

1. Draw image to an offscreen canvas at reduced dimensions (e.g., max 1920px on longest side)
2. Export as WebP or JPEG at 80% quality
3. Store the compressed version

This could be done with zero dependencies using the Canvas API. However, it adds complexity (canvas creation, async processing, quality tuning) and should be deferred to a follow-up iteration. The 2 MB upload limit provides sufficient protection for MVP.

### Clipboard Paste Support (stretch goal)

Allow pasting images from clipboard directly into the card detail modal:

1. Listen for `paste` event on the description field or modal container
2. Check `clipboardData.items` for `image/*` types
3. Extract as blob and follow the same upload flow

Natural UX for pasting screenshots. Defer to follow-up.

## Implementation Plan

### Phase 1: Storage layer & data model

1. Create `src/utils/attachmentStorage.ts` (IndexedDB wrapper)
2. Add `AttachmentRef` type and `attachments` field to `Card` type
3. Add migration for existing cards (`attachments: []`)
4. Add `addAttachment` and `removeAttachment` mutations to board context
5. Unit tests for storage utility and mutations

### Phase 2: Card detail modal UI

1. Add attachment section to `CardDetailModal`
2. File picker with validation (type, size, count)
3. Thumbnail grid with object URL rendering
4. Delete button with confirmation
5. Attachment count indicator on board cards
6. Unit and e2e tests for upload, display, and deletion

### Phase 3: Export/import

1. Bump export version to 10
2. Embed attachment blobs as base64 in export
3. Import: decode and store in IndexedDB
4. Handle missing attachments gracefully
5. Progress indicator for large exports
6. Migration tests for v9 → v10

### Phase 4: Lifecycle & cleanup

1. Orphan sweep on startup
2. Cleanup on permanent card deletion, archive clear, board clear
3. Storage usage display in settings
4. Warning when approaching storage limit
5. "Export without images" option

### Phase 5: Polish (stretch goals)

1. Lightbox for full-size image viewing
2. Clipboard paste support
3. Client-side image compression
4. Drag-and-drop reordering of attachments
5. Drag-and-drop file upload onto card detail modal

## Risks & Mitigations

| Risk                                                | Impact                    | Mitigation                                                                                |
| --------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| IndexedDB unavailable (rare browsers, private mode) | Attachments silently fail | Feature-detect IndexedDB; disable attachment UI if unavailable; show explanatory message  |
| Large exports slow to generate                      | Poor UX                   | Async export with progress bar; offer "without images" option                             |
| Orphaned blobs accumulate                           | Wasted storage            | Startup sweep + cleanup on permanent deletion                                             |
| Undo adds attachment, redo removes it, blob leaked  | Minor storage waste       | Orphan sweep handles it; not worth complex ref-counting                                   |
| Browser storage eviction (low disk)                 | Data loss                 | Warn users that browser may clear data under storage pressure; recommend periodic exports |

## Dependencies

No new npm dependencies required for MVP. The implementation uses:

- Native `IndexedDB` API (all modern browsers)
- Native `URL.createObjectURL()` for thumbnail display
- Native `FileReader` for base64 conversion during export
- Native `<input type="file">` for file selection

This aligns with the project's dependency minimization guidelines.

## Decision Log

| Decision          | Chosen                  | Alternatives considered                                                     |
| ----------------- | ----------------------- | --------------------------------------------------------------------------- |
| Storage backend   | IndexedDB               | localStorage (too small), external URLs (breaks local-only)                 |
| Blob format       | Raw Blob in IDB         | Base64 string (33% larger, slower)                                          |
| Reference in card | Lightweight ref object  | Blob ID string only (loses metadata for offline/export)                     |
| Export strategy   | Embed base64 in JSON    | Separate zip file (adds dependency), omit (loses data)                      |
| Compression       | Deferred (stretch goal) | MVP with 2 MB limit is sufficient                                           |
| Max file size     | 2 MB                    | 5 MB (too generous for localStorage-adjacent app), 500 KB (too restrictive) |
