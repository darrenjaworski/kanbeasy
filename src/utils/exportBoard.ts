import { STORAGE_KEYS } from "../constants/storage";

interface ExportData {
  version: 1 | 2 | 3 | 4 | 5;
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
    ticketTypePreset: string;
    ticketTypes: string;
  };
}

function readRaw(key: string): string {
  return window.localStorage.getItem(key) ?? "";
}

function buildExportData(): ExportData {
  const boardRaw = window.localStorage.getItem(STORAGE_KEYS.BOARD);
  let board: unknown = null;
  if (boardRaw) {
    try {
      board = JSON.parse(boardRaw);
    } catch {
      board = boardRaw;
    }
  }

  return {
    version: 5,
    exportedAt: new Date().toISOString(),
    board,
    settings: {
      theme: readRaw(STORAGE_KEYS.THEME),
      themePreference: readRaw(STORAGE_KEYS.THEME_PREFERENCE),
      cardDensity: readRaw(STORAGE_KEYS.CARD_DENSITY),
      columnResizingEnabled: readRaw(STORAGE_KEYS.COLUMN_RESIZING_ENABLED),
      deleteColumnWarning: readRaw(STORAGE_KEYS.DELETE_COLUMN_WARNING),
      owlModeEnabled: readRaw(STORAGE_KEYS.OWL_MODE_ENABLED),
      viewMode: readRaw(STORAGE_KEYS.VIEW_MODE),
      ticketTypePreset: readRaw(STORAGE_KEYS.TICKET_TYPE_PRESET),
      ticketTypes: readRaw(STORAGE_KEYS.TICKET_TYPES),
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
