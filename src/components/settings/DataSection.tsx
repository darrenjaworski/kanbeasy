import { useEffect, useRef, useState } from "react";
import { useTheme } from "../../theme/useTheme";
import { useBoard } from "../../board/useBoard";
import { tc } from "../../theme/classNames";
import { exportBoard } from "../../utils/exportBoard";
import { readImportFile } from "../../utils/importBoard";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useStorageInfo() {
  const [usage, setUsage] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    if (navigator.storage?.estimate) {
      void navigator.storage.estimate().then((est) => {
        if (est.usage !== undefined) {
          setUsage(formatBytes(est.usage));
        }
      });
    }
    if (navigator.storage?.persisted) {
      void navigator.storage.persisted().then(setPersisted);
    }
  }, []);

  return { usage, persisted };
}

export function DataSection() {
  const {
    setThemeId,
    setThemePreference,
    setCardDensity,
    setColumnResizingEnabled,
    setDeleteColumnWarningEnabled,
    setOwlModeEnabled,
    setViewMode,
    setCardTypePresetId,
    setCardTypes,
    setDefaultCardTypeId,
    setCompactHeader,
    resetSettings,
  } = useTheme();
  const { setColumns, resetBoard, setNextCardNumber } = useBoard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");
  const [importStatus, setImportStatus] = useState<
    "idle" | "importing" | "complete"
  >("idle");

  const handleClearBoard = () => {
    resetBoard();
    setNextCardNumber(1);
  };

  const handleClearSettings = () => {
    resetSettings();
  };

  const handleClearAll = () => {
    resetBoard();
    setNextCardNumber(1);
    resetSettings();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError("");
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus("importing");

    const minDelay = new Promise<void>((r) => setTimeout(r, 300));
    const result = await Promise.all([readImportFile(file), minDelay]).then(
      ([r]) => r,
    );

    // Reset so re-selecting the same file triggers onChange again
    e.target.value = "";

    if (!result.ok) {
      setImportError(result.error);
      setImportStatus("idle");
      return;
    }

    const { columns, archive, nextCardNumber, settings } = result.data;

    setColumns(columns, archive);
    setNextCardNumber(nextCardNumber);
    setThemePreference(settings.themePreference);
    if (settings.theme) {
      setThemeId(settings.theme);
    }
    setCardDensity(settings.cardDensity);
    setColumnResizingEnabled(settings.columnResizingEnabled);
    setDeleteColumnWarningEnabled(settings.deleteColumnWarning);
    setOwlModeEnabled(settings.owlModeEnabled);
    setViewMode(settings.viewMode);
    setCardTypePresetId(settings.cardTypePresetId);
    setCardTypes(settings.cardTypes);
    setDefaultCardTypeId(settings.defaultCardTypeId);
    setCompactHeader(settings.compactHeader);

    setImportStatus("complete");
    setTimeout(() => setImportStatus("idle"), 600);
  };

  const { usage, persisted } = useStorageInfo();

  return (
    <div className="space-y-2">
      {(usage !== null || persisted !== null) && (
        <div className={`rounded-md px-3 py-2 text-xs ${tc.glass}`}>
          {usage !== null && (
            <p>
              <span className={tc.textFaint}>Storage used:</span> {usage}
            </p>
          )}
          {persisted !== null && (
            <p>
              <span className={tc.textFaint}>Persistent storage:</span>{" "}
              {persisted ? "Granted" : "Not granted"}
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={exportBoard}
        className={`${tc.button} w-full rounded-md px-3 py-1.5`}
      >
        Export board data
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => void handleImport(e)}
        data-testid="import-file-input"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={importStatus !== "idle"}
        className={`${tc.button} w-full rounded-md px-3 py-1.5 disabled:opacity-60`}
      >
        {importStatus === "importing" && (
          <span className="inline-flex items-center gap-2">
            <svg
              className="size-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Importing…
          </span>
        )}
        {importStatus === "complete" && "Import complete"}
        {importStatus === "idle" && "Import board data"}
      </button>
      {importError && (
        <p role="alert" className={`text-xs ${tc.error}`}>
          {importError}
        </p>
      )}
      <button
        type="button"
        onClick={handleClearBoard}
        className={`${tc.dangerButton} w-full rounded-md px-3 py-1.5`}
      >
        Clear board data
      </button>
      <button
        type="button"
        onClick={handleClearSettings}
        className={`${tc.dangerButton} w-full rounded-md px-3 py-1.5`}
      >
        Clear settings
      </button>
      <button
        type="button"
        onClick={handleClearAll}
        className={`${tc.dangerButton} w-full rounded-md px-3 py-1.5`}
      >
        Clear all data
      </button>
    </div>
  );
}
