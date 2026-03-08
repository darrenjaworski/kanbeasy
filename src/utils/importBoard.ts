import type { ArchivedCard, Column } from "../board/types";
import type { CardDensity, ThemePreference, ViewMode } from "../theme/types";
import type { CardType } from "../constants/cardTypes";
import type { CardLayout } from "../constants/cardLayout";
import { isArchivedCard, isColumn } from "../board/validation";
import { themes } from "../theme/themes";
import { migrateColumnsWithNumbering } from "../board/migration";
import { DEFAULT_PRESET_ID, CARD_TYPE_PRESETS } from "../constants/cardTypes";
import {
  DEFAULT_CARD_LAYOUT,
  isValidCardLayout,
} from "../constants/cardLayout";

interface ValidatedImport {
  columns: Column[];
  archive: ArchivedCard[];
  nextCardNumber: number;
  settings: {
    theme: string;
    themePreference: ThemePreference;
    cardDensity: CardDensity;
    columnResizingEnabled: boolean;
    deleteColumnWarning: boolean;
    owlModeEnabled: boolean;
    viewMode: ViewMode;
    cardTypePresetId: string;
    cardTypes: CardType[];
    defaultCardTypeId: string | null;
    compactHeader: boolean;
    cardLayout: CardLayout;
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
const VALID_VIEW_MODES: ReadonlySet<string> = new Set([
  "board",
  "list",
  "calendar",
]);

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
    version !== 5 &&
    version !== 6 &&
    version !== 7 &&
    version !== 8 &&
    version !== 9 &&
    version !== 10 &&
    version !== 11
  ) {
    return {
      ok: false,
      error: version
        ? `Unsupported export version: ${typeof version === "number" || typeof version === "string" ? String(version) : "unknown"}. Only versions 1–11 are supported.`
        : "Missing export version.",
    };
  }

  // Validate board
  let columns: Column[] = [];
  let archive: ArchivedCard[] = [];
  let nextCardNumber = 1;
  if (parsed.board !== null && parsed.board !== undefined) {
    if (!isObject(parsed.board)) {
      return { ok: false, error: "Invalid board data." };
    }
    const rawArchive =
      version >= 6 && Array.isArray(parsed.board.archive)
        ? (parsed.board.archive as unknown[]).filter(isArchivedCard)
        : [];
    if (Array.isArray(parsed.board.columns)) {
      const validColumns = (parsed.board.columns as unknown[]).filter(isColumn);
      const result = migrateColumnsWithNumbering(
        validColumns as unknown as Record<string, unknown>[],
        rawArchive as unknown as Record<string, unknown>[],
      );
      columns = result.columns;
      archive = result.archive;
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
      ? s.theme
      : "";

  const themePreference: ThemePreference =
    typeof s.themePreference === "string" &&
    VALID_PREFERENCES.has(s.themePreference)
      ? (s.themePreference as ThemePreference)
      : "system";

  const cardDensity: CardDensity =
    typeof s.cardDensity === "string" && VALID_DENSITIES.has(s.cardDensity)
      ? (s.cardDensity as CardDensity)
      : "small";

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

  // Card type settings (v5+). Fall back to Development preset for older versions.
  // Support both new (cardType*) and legacy (ticketType*) export field names.
  const defaultPreset = CARD_TYPE_PRESETS.find(
    (p) => p.id === DEFAULT_PRESET_ID,
  )!;

  let cardTypePresetId = DEFAULT_PRESET_ID;
  let cardTypes: CardType[] = [...defaultPreset.types];

  if (version >= 5) {
    // Parse preset ID (accept both old and new field names)
    const rawPresetField = s.cardTypePreset ?? s.ticketTypePreset;
    const rawPreset = typeof rawPresetField === "string" ? rawPresetField : "";
    if (
      CARD_TYPE_PRESETS.some((p) => p.id === rawPreset) ||
      rawPreset === "custom"
    ) {
      cardTypePresetId = rawPreset;
    }

    // Parse card types JSON (accept both old and new field names)
    const rawTypesField = s.cardTypes ?? s.ticketTypes;
    let parsedTypes: unknown = null;
    if (typeof rawTypesField === "string" && rawTypesField) {
      try {
        parsedTypes = JSON.parse(rawTypesField);
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
      cardTypes = parsedTypes as CardType[];
    }
  }

  // Default card type (v7+). Fall back to null for older versions.
  // Accept both old (defaultTicketType) and new (defaultCardType) field names.
  let defaultCardTypeId: string | null = null;
  if (version >= 7) {
    const rawDefaultField = s.defaultCardType ?? s.defaultTicketType;
    const rawDefault =
      typeof rawDefaultField === "string" ? rawDefaultField : "";
    if (rawDefault && cardTypes.some((t) => t.id === rawDefault)) {
      defaultCardTypeId = rawDefault;
    }
  }

  // Compact header (v8+). Fall back to false for older versions.
  const compactHeader =
    version >= 8
      ? typeof s.compactHeader === "string"
        ? s.compactHeader === "true"
        : typeof s.compactHeader === "boolean"
          ? s.compactHeader
          : false
      : false;

  // Card layout (v11+). Fall back to default layout for older versions.
  // For older exports, map cardDensity to title lines for continuity.
  let cardLayout: CardLayout = DEFAULT_CARD_LAYOUT;
  if (version >= 11) {
    const rawLayout = s.cardLayout;
    let parsed: unknown = null;
    if (typeof rawLayout === "string" && rawLayout) {
      try {
        parsed = JSON.parse(rawLayout);
      } catch {
        // invalid JSON, use default
      }
    } else if (Array.isArray(rawLayout)) {
      parsed = rawLayout;
    }
    if (isValidCardLayout(parsed)) {
      cardLayout = parsed;
    }
  } else {
    // Map density to title lines for older exports
    const densityLines: Record<string, number> = {
      small: 1,
      medium: 2,
      large: 3,
    };
    const titleLines = densityLines[cardDensity] ?? 1;
    if (titleLines !== 1) {
      cardLayout = DEFAULT_CARD_LAYOUT.map((f) =>
        f.id === "title"
          ? { ...f, options: { ...f.options, lines: titleLines } }
          : f,
      );
    }
  }

  return {
    ok: true,
    data: {
      columns,
      archive,
      nextCardNumber,
      settings: {
        theme,
        themePreference,
        cardDensity,
        columnResizingEnabled,
        deleteColumnWarning,
        owlModeEnabled,
        viewMode,
        cardTypePresetId,
        cardTypes,
        defaultCardTypeId,
        compactHeader,
        cardLayout,
      },
    },
  };
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read file"));
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
