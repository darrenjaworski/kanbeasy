import type { Column } from "../board/types";
import type { CardDensity, ThemePreference, ViewMode } from "../theme/types";
import type { TicketType } from "../constants/ticketTypes";
import { isColumn } from "../board/validation";
import { themes } from "../theme/themes";
import { migrateColumnsWithNumbering } from "../board/migration";
import {
  DEFAULT_PRESET_ID,
  TICKET_TYPE_PRESETS,
} from "../constants/ticketTypes";

interface ValidatedImport {
  columns: Column[];
  nextCardNumber: number;
  settings: {
    theme: string;
    themePreference: ThemePreference;
    cardDensity: CardDensity;
    columnResizingEnabled: boolean;
    deleteColumnWarning: boolean;
    owlModeEnabled: boolean;
    viewMode: ViewMode;
    ticketTypePresetId: string;
    ticketTypes: TicketType[];
  };
}

type ImportResult =
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
const VALID_VIEW_MODES: ReadonlySet<string> = new Set(["board", "list"]);

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

export function validateExportData(parsed: unknown): ImportResult {
  if (!isObject(parsed)) {
    return { ok: false, error: "File is not valid JSON." };
  }

  const version = parsed.version;
  if (
    version !== 1 &&
    version !== 2 &&
    version !== 3 &&
    version !== 4 &&
    version !== 5
  ) {
    return {
      ok: false,
      error: version
        ? `Unsupported export version: ${String(version)}. Only versions 1–5 are supported.`
        : "Missing export version.",
    };
  }

  // Validate board
  let columns: Column[] = [];
  let nextCardNumber = 1;
  if (parsed.board !== null && parsed.board !== undefined) {
    if (!isObject(parsed.board)) {
      return { ok: false, error: "Invalid board data." };
    }
    if (Array.isArray(parsed.board.columns)) {
      const validColumns = (parsed.board.columns as unknown[]).filter(isColumn);
      const result = migrateColumnsWithNumbering(
        validColumns as unknown as Record<string, unknown>[],
      );
      columns = result.columns;
      nextCardNumber = result.nextCardNumber;
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

  const owlModeEnabled =
    typeof s.owlModeEnabled === "string"
      ? s.owlModeEnabled === "true"
      : typeof s.owlModeEnabled === "boolean"
        ? s.owlModeEnabled
        : false;

  const viewMode: ViewMode =
    typeof s.viewMode === "string" && VALID_VIEW_MODES.has(s.viewMode)
      ? (s.viewMode as ViewMode)
      : "board";

  // Ticket type settings (v5+). Fall back to Development preset for older versions.
  const defaultPreset = TICKET_TYPE_PRESETS.find(
    (p) => p.id === DEFAULT_PRESET_ID,
  )!;

  let ticketTypePresetId = DEFAULT_PRESET_ID;
  let ticketTypes: TicketType[] = [...defaultPreset.types];

  if (version >= 5) {
    // Parse preset ID
    const rawPreset =
      typeof s.ticketTypePreset === "string" ? s.ticketTypePreset : "";
    if (
      TICKET_TYPE_PRESETS.some((p) => p.id === rawPreset) ||
      rawPreset === "custom"
    ) {
      ticketTypePresetId = rawPreset;
    }

    // Parse ticket types JSON
    let parsedTypes: unknown = null;
    if (typeof s.ticketTypes === "string" && s.ticketTypes) {
      try {
        parsedTypes = JSON.parse(s.ticketTypes);
      } catch {
        // invalid JSON, use default
      }
    }
    if (
      Array.isArray(parsedTypes) &&
      parsedTypes.every(
        (t) =>
          !!t &&
          typeof t === "object" &&
          typeof (t as { id?: unknown }).id === "string" &&
          typeof (t as { label?: unknown }).label === "string" &&
          typeof (t as { color?: unknown }).color === "string",
      )
    ) {
      ticketTypes = parsedTypes as TicketType[];
    }
  }

  return {
    ok: true,
    data: {
      columns,
      nextCardNumber,
      settings: {
        theme,
        themePreference,
        cardDensity,
        columnResizingEnabled,
        deleteColumnWarning,
        owlModeEnabled,
        viewMode,
        ticketTypePresetId,
        ticketTypes,
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
