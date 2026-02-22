import { describe, it, expect } from "vitest";
import { validateExportData, readImportFile } from "../importBoard";

function makeExportData(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    exportedAt: "2024-01-01T00:00:00.000Z",
    board: {
      columns: [
        {
          id: "col-1",
          title: "To Do",
          cards: [{ id: "card-1", title: "Task 1" }],
        },
      ],
    },
    settings: {
      theme: "light-slate",
      themePreference: "light",
      cardDensity: "medium",
      columnResizingEnabled: "false",
      deleteColumnWarning: "true",
    },
    ...overrides,
  };
}

describe("validateExportData", () => {
  it("accepts valid v1 export with board data", () => {
    const result = validateExportData(makeExportData());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.columns).toHaveLength(1);
    expect(result.data.columns[0].title).toBe("To Do");
    expect(result.data.columns[0].cards).toHaveLength(1);
    expect(result.data.settings.theme).toBe("light-slate");
    expect(result.data.settings.themePreference).toBe("light");
    expect(result.data.settings.cardDensity).toBe("medium");
    expect(result.data.settings.columnResizingEnabled).toBe(false);
    expect(result.data.settings.deleteColumnWarning).toBe(true);
  });

  it("accepts valid v1 with null board — returns empty columns", () => {
    const result = validateExportData(makeExportData({ board: null }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.columns).toEqual([]);
  });

  it("rejects non-object input", () => {
    const result = validateExportData("not an object");
    expect(result).toEqual({ ok: false, error: "File is not valid JSON." });
  });

  it("rejects missing version", () => {
    const data = makeExportData();
    delete (data as Record<string, unknown>).version;
    const result = validateExportData(data);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Missing export version");
  });

  it("rejects wrong version number", () => {
    const result = validateExportData(makeExportData({ version: 2 }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Unsupported export version: 2");
  });

  it("filters out invalid columns from board", () => {
    const result = validateExportData(
      makeExportData({
        board: {
          columns: [
            { id: "col-1", title: "Valid", cards: [] },
            { id: 123, title: "Bad id type", cards: [] },
            { title: "Missing id", cards: [] },
            "not an object",
          ],
        },
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.columns).toHaveLength(1);
    expect(result.data.columns[0].title).toBe("Valid");
  });

  it("rejects missing settings", () => {
    const data = makeExportData();
    delete (data as Record<string, unknown>).settings;
    const result = validateExportData(data);
    expect(result).toEqual({
      ok: false,
      error: "Missing settings in export data.",
    });
  });

  it("defaults invalid cardDensity to medium", () => {
    const result = validateExportData(
      makeExportData({
        settings: {
          theme: "light-slate",
          themePreference: "light",
          cardDensity: "invalid",
          columnResizingEnabled: "false",
          deleteColumnWarning: "true",
        },
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.settings.cardDensity).toBe("medium");
  });

  it("defaults invalid themePreference to system", () => {
    const result = validateExportData(
      makeExportData({
        settings: {
          theme: "light-slate",
          themePreference: "invalid",
          cardDensity: "medium",
          columnResizingEnabled: "false",
          deleteColumnWarning: "true",
        },
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.settings.themePreference).toBe("system");
  });

  it("defaults unknown theme to empty string", () => {
    const result = validateExportData(
      makeExportData({
        settings: {
          theme: "nonexistent-theme",
          themePreference: "dark",
          cardDensity: "small",
          columnResizingEnabled: "true",
          deleteColumnWarning: "false",
        },
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.settings.theme).toBe("");
  });

  it("handles boolean columnResizingEnabled and deleteColumnWarning", () => {
    const result = validateExportData(
      makeExportData({
        settings: {
          theme: "dark-slate",
          themePreference: "dark",
          cardDensity: "large",
          columnResizingEnabled: true,
          deleteColumnWarning: false,
        },
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.settings.columnResizingEnabled).toBe(true);
    expect(result.data.settings.deleteColumnWarning).toBe(false);
  });
});

describe("readImportFile", () => {
  it("rejects non-JSON file content", async () => {
    const file = new File(["not json at all"], "bad.json", {
      type: "application/json",
    });
    const result = await readImportFile(file);
    expect(result).toEqual({ ok: false, error: "File is not valid JSON." });
  });

  it("parses valid export file", async () => {
    const data = makeExportData();
    const file = new File([JSON.stringify(data)], "export.json", {
      type: "application/json",
    });
    const result = await readImportFile(file);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.columns).toHaveLength(1);
  });
});
