import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { STORAGE_KEYS } from "../../constants/storage";
import { exportBoard } from "../exportBoard";

describe("exportBoard", () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let createdAnchor: HTMLAnchorElement;
  let capturedJson: string;

  const OriginalBlob = globalThis.Blob;

  beforeEach(() => {
    localStorage.clear();
    capturedJson = "";

    clickSpy = vi.fn();
    createdAnchor = document.createElement("a");
    createdAnchor.click = clickSpy;

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return createdAnchor;
      return document.createElement(tag);
    });

    globalThis.Blob = class MockBlob extends OriginalBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        if (parts && parts[0] && typeof parts[0] === "string") {
          capturedJson = parts[0];
        }
      }
    } as typeof Blob;

    createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = vi.fn();
    URL.createObjectURL = createObjectURLSpy;
    URL.revokeObjectURL = revokeObjectURLSpy;
  });

  afterEach(() => {
    globalThis.Blob = OriginalBlob;
    vi.restoreAllMocks();
  });

  it("exports JSON with correct top-level structure", () => {
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns: [{ id: "1", title: "Todo", cards: [] }] }),
    );
    localStorage.setItem(STORAGE_KEYS.THEME, "midnight");
    localStorage.setItem(STORAGE_KEYS.CARD_DENSITY, "medium");

    exportBoard();

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(createObjectURLSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURLSpy).toHaveBeenCalledOnce();

    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
  });

  it("includes version, exportedAt, board, and settings in export data", () => {
    const boardData = { columns: [{ id: "1", title: "Todo", cards: [] }] };
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify(boardData));
    localStorage.setItem(STORAGE_KEYS.THEME, "midnight");
    localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, "dark");
    localStorage.setItem(STORAGE_KEYS.CARD_DENSITY, "medium");
    localStorage.setItem(STORAGE_KEYS.COLUMN_RESIZING_ENABLED, "true");
    localStorage.setItem(STORAGE_KEYS.DELETE_COLUMN_WARNING, "true");

    exportBoard();

    const data = JSON.parse(capturedJson);

    expect(data.version).toBe(2);
    expect(data.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(data.board).toEqual(boardData);
    expect(data.settings).toEqual({
      theme: "midnight",
      themePreference: "dark",
      cardDensity: "medium",
      columnResizingEnabled: "true",
      deleteColumnWarning: "true",
    });
  });

  it("generates filename with YYYY-MM-DD pattern", () => {
    exportBoard();

    expect(createdAnchor.download).toMatch(
      /^kanbeasy-export-\d{4}-\d{2}-\d{2}\.json$/,
    );
  });

  it("handles empty board state gracefully", () => {
    exportBoard();

    const data = JSON.parse(capturedJson);

    expect(data.version).toBe(2);
    expect(data.board).toBeNull();
    expect(data.settings.theme).toBe("");
    expect(data.settings.cardDensity).toBe("");
  });

  it("cleans up object URL after download", () => {
    exportBoard();

    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });
});
