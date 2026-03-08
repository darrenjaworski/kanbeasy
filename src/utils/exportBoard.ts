import { STORAGE_KEYS } from "../constants/storage";
import { kvGet, getBoard } from "./db";

interface ExportData {
  version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  exportedAt: string;
  board: unknown;
  settings: {
    theme: string;
    themePreference: string;
    cardDensity: string;
    columnResizingEnabled: string;
    deleteColumnWarning: string;
    owlModeEnabled: string;
    viewMode: string;
    cardTypePreset: string;
    cardTypes: string;
    defaultCardType: string;
    compactHeader: string;
  };
}

function readKv(key: string): string {
  const val = kvGet<unknown>(key, "");
  if (typeof val === "string") return val;
  // For values stored as JSON objects (e.g. cardTypes), re-stringify
  try {
    return JSON.stringify(val);
  } catch {
    return "";
  }
}

function buildExportData(): ExportData {
  const board = getBoard();

  return {
    version: 10,
    exportedAt: new Date().toISOString(),
    board,
    settings: {
      theme: readKv(STORAGE_KEYS.THEME),
      themePreference: readKv(STORAGE_KEYS.THEME_PREFERENCE),
      cardDensity: readKv(STORAGE_KEYS.CARD_DENSITY),
      columnResizingEnabled: readKv(STORAGE_KEYS.COLUMN_RESIZING_ENABLED),
      deleteColumnWarning: readKv(STORAGE_KEYS.DELETE_COLUMN_WARNING),
      owlModeEnabled: readKv(STORAGE_KEYS.OWL_MODE_ENABLED),
      viewMode: readKv(STORAGE_KEYS.VIEW_MODE),
      cardTypePreset: readKv(STORAGE_KEYS.CARD_TYPE_PRESET),
      cardTypes: readKv(STORAGE_KEYS.CARD_TYPES),
      defaultCardType: readKv(STORAGE_KEYS.DEFAULT_CARD_TYPE),
      compactHeader: readKv(STORAGE_KEYS.COMPACT_HEADER),
    },
  };
}

function formatDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function exportBoard(): void {
  const data = buildExportData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `kanbeasy-export-${formatDate()}.json`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 100);
}
