import type { Column } from "../board/types";
import type { CardDensity, ThemePreference } from "../theme/types";
import { isColumn } from "../board/validation";
import { themes } from "../theme/themes";

export interface ValidatedImport {
  columns: Column[];
  settings: {
    theme: string;
    themePreference: ThemePreference;
    cardDensity: CardDensity;
    columnResizingEnabled: boolean;
    deleteColumnWarning: boolean;
  };
}

export type ImportResult =
  | { ok: true; data: ValidatedImport }
  | { ok: false; error: string };

const VALID_DENSITIES: ReadonlySet<string> = new Set([
  "small",
  "medium",
  "large",
]);
const VALID_PREFERENCES: ReadonlySet<string> = new Set([
  "light",
  "dark",
  "system",
]);

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

export function validateExportData(parsed: unknown): ImportResult {
  if (!isObject(parsed)) {
    return { ok: false, error: "File is not valid JSON." };
  }

  if (parsed.version !== 1) {
    return {
      ok: false,
      error: parsed.version
        ? `Unsupported export version: ${String(parsed.version)}. Only version 1 is supported.`
        : "Missing export version.",
    };
  }

  // Validate board
  let columns: Column[] = [];
  if (parsed.board != null) {
    if (!isObject(parsed.board)) {
      return { ok: false, error: "Invalid board data." };
    }
    if (Array.isArray(parsed.board.columns)) {
      columns = (parsed.board.columns as unknown[]).filter(isColumn);
    }
  }

  // Validate settings
  if (!isObject(parsed.settings)) {
    return { ok: false, error: "Missing settings in export data." };
  }

  const s = parsed.settings;

  const theme =
    typeof s.theme === "string" && themes.some((t) => t.id === s.theme)
      ? (s.theme as string)
      : "";

  const themePreference: ThemePreference =
    typeof s.themePreference === "string" &&
    VALID_PREFERENCES.has(s.themePreference)
      ? (s.themePreference as ThemePreference)
      : "system";

  const cardDensity: CardDensity =
    typeof s.cardDensity === "string" && VALID_DENSITIES.has(s.cardDensity)
      ? (s.cardDensity as CardDensity)
      : "medium";

  const columnResizingEnabled =
    typeof s.columnResizingEnabled === "string"
      ? s.columnResizingEnabled === "true"
      : typeof s.columnResizingEnabled === "boolean"
        ? s.columnResizingEnabled
        : false;

  const deleteColumnWarning =
    typeof s.deleteColumnWarning === "string"
      ? s.deleteColumnWarning === "true"
      : typeof s.deleteColumnWarning === "boolean"
        ? s.deleteColumnWarning
        : true;

  return {
    ok: true,
    data: {
      columns,
      settings: {
        theme,
        themePreference,
        cardDensity,
        columnResizingEnabled,
        deleteColumnWarning,
      },
    },
  };
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export async function readImportFile(file: File): Promise<ImportResult> {
  let text: string;
  try {
    text = await readFileAsText(file);
  } catch {
    return { ok: false, error: "Could not read the file." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }

  return validateExportData(parsed);
}
