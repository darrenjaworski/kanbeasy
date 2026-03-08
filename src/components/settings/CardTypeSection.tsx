import { useRef, useState } from "react";
import { useTheme } from "../../theme/useTheme";
import { useBoard } from "../../board/useBoard";
import { tc } from "../../theme/classNames";
import type { CardType } from "../../constants/cardTypes";
import { CARD_TYPE_PRESETS, CARD_TYPE_COLORS } from "../../constants/cardTypes";
import { CloseIcon } from "../icons";

export function CardTypeSection() {
  const {
    cardTypes,
    setCardTypes,
    cardTypePresetId,
    setCardTypePresetId,
    defaultCardTypeId,
    setDefaultCardTypeId,
  } = useTheme();
  const { renameCardType } = useBoard();
  const [editingColorIdx, setEditingColorIdx] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // Track the original ID when the user starts editing, so we can
  // do a single bulk rename on blur instead of on every keystroke.
  const pendingIdRename = useRef<{ index: number; originalId: string } | null>(
    null,
  );

  const handlePresetChange = (presetId: string) => {
    setCardTypePresetId(presetId);
    if (presetId === "custom") {
      setCardTypes([]);
      return;
    }
    const preset = CARD_TYPE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCardTypes([...preset.types]);
    }
  };

  const handleUpdateType = (index: number, updates: Partial<CardType>) => {
    const next = cardTypes.map((t, i) =>
      i === index ? { ...t, ...updates } : t,
    );
    setCardTypes(next);
    setCardTypePresetId("custom");
    // Note: ID renames are deferred to blur — see handleIdBlur
  };

  const handleIdFocus = (index: number) => {
    pendingIdRename.current = { index, originalId: cardTypes[index].id };
  };

  const handleIdBlur = (index: number) => {
    const pending = pendingIdRename.current;
    if (!pending || pending.index !== index) return;
    pendingIdRename.current = null;

    const newId = cardTypes[index].id;
    if (!newId || newId === pending.originalId) return;

    // Check for duplicate IDs — revert if the new ID conflicts
    const isDuplicate = cardTypes.some((t, i) => i !== index && t.id === newId);
    if (isDuplicate) {
      // Revert to the original ID
      const reverted = cardTypes.map((t, i) =>
        i === index ? { ...t, id: pending.originalId } : t,
      );
      setCardTypes(reverted);
      return;
    }

    renameCardType(pending.originalId, newId);
  };

  const handleRemoveType = (index: number) => {
    // Only remove the type definition — card cardTypeId values are preserved
    // so they can be restored by re-adding the type or switching presets
    setCardTypes(cardTypes.filter((_, i) => i !== index));
    setCardTypePresetId("custom");
  };

  const handleAddType = () => {
    // Pick the first unused color, or cycle
    const usedColors = new Set(cardTypes.map((t) => t.color));
    const color =
      CARD_TYPE_COLORS.find((c) => !usedColors.has(c)) ??
      CARD_TYPE_COLORS[cardTypes.length % CARD_TYPE_COLORS.length];
    const newType: CardType = { id: "new", label: "New Type", color };
    setCardTypes([...cardTypes, newType]);
    setCardTypePresetId("custom");
  };

  const isDuplicateId = (id: string, index: number) =>
    cardTypes.some((t, i) => i !== index && t.id === id);

  return (
    <fieldset className="border-0 p-0 m-0 space-y-3 text-sm font-medium">
      <legend className="sr-only">Card Types</legend>

      {/* Preset selector */}
      <div className="relative">
        <label
          htmlFor="card-type-preset"
          className={`block text-xs ${tc.textMuted} mb-1`}
        >
          Preset
        </label>
        <select
          id="card-type-preset"
          value={cardTypePresetId}
          onChange={(e) => handlePresetChange(e.target.value)}
          className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 text-sm ${tc.text} ${tc.focusRing} appearance-none pr-8 cursor-pointer`}
          data-testid="card-type-preset"
        >
          {CARD_TYPE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        <svg
          className={`pointer-events-none absolute right-2.5 bottom-2.5 size-4 ${tc.textFaint}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Default type for new cards */}
      {cardTypes.length > 0 && (
        <div className="relative">
          <label
            htmlFor="default-card-type"
            className={`block text-xs ${tc.textMuted} mb-1`}
          >
            Default type for new cards
          </label>
          <select
            id="default-card-type"
            value={defaultCardTypeId ?? ""}
            onChange={(e) => setDefaultCardTypeId(e.target.value || null)}
            className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 text-sm ${tc.text} ${tc.focusRing} appearance-none pr-8 cursor-pointer`}
            data-testid="default-card-type"
          >
            <option value="">None</option>
            {cardTypes.map((t, i) => (
              <option key={i} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <svg
            className={`pointer-events-none absolute right-2.5 bottom-2.5 size-4 ${tc.textFaint}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* Disclosure toggle for type editor */}
      <button
        type="button"
        onClick={() => setEditorOpen((prev) => !prev)}
        className={`flex items-center gap-1 text-xs ${tc.textMuted} ${tc.focusRing} transition-colors`}
        aria-expanded={editorOpen}
        data-testid="card-type-editor-toggle"
      >
        <svg
          className={`size-3 transition-transform ${editorOpen ? "rotate-90" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
        Edit types
      </button>

      {editorOpen && (
        <>
          {/* Editable type list */}
          <div className="space-y-2">
            {cardTypes.map((type, index) => (
              <div key={index}>
                <div className="flex items-center gap-2">
                  {/* Color swatch / picker toggle */}
                  <button
                    type="button"
                    className={`size-6 rounded-full border ${tc.border} ${tc.focusRing} shrink-0`}
                    style={{ backgroundColor: type.color }}
                    onClick={() =>
                      setEditingColorIdx(
                        editingColorIdx === index ? null : index,
                      )
                    }
                    aria-label={`Change color for ${type.label}`}
                  />

                  {/* ID input — rename only fires on blur, not on every keystroke */}
                  <input
                    type="text"
                    value={type.id}
                    onChange={(e) =>
                      handleUpdateType(index, { id: e.target.value })
                    }
                    onFocus={() => handleIdFocus(index)}
                    onBlur={() => handleIdBlur(index)}
                    className={`${tc.glass} rounded-md border ${isDuplicateId(type.id, index) ? "border-red-500" : tc.border} px-2 py-1 text-xs font-mono ${tc.text} ${tc.focusRing} w-20`}
                    aria-label={`Type ID for ${type.label}`}
                    data-testid={`card-type-id-${index}`}
                  />

                  {/* Label input */}
                  <input
                    type="text"
                    value={type.label}
                    onChange={(e) =>
                      handleUpdateType(index, { label: e.target.value })
                    }
                    className={`${tc.glass} rounded-md border ${tc.border} px-2 py-1 text-xs ${tc.text} ${tc.focusRing} flex-1`}
                    aria-label={`Label for ${type.id}`}
                    data-testid={`card-type-label-${index}`}
                  />

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveType(index)}
                    className={`${tc.iconButton} h-6 w-6 rounded-full`}
                    aria-label={`Remove ${type.label} type`}
                    data-testid={`card-type-remove-${index}`}
                  >
                    <CloseIcon className="size-4" />
                  </button>
                </div>

                {/* Inline color picker */}
                {editingColorIdx === index && (
                  <div
                    className={`flex gap-1 p-2 mt-1 rounded-md border ${tc.border} ${tc.glass}`}
                  >
                    {CARD_TYPE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`size-5 rounded-full border ${
                          type.color === c
                            ? "border-accent ring-2 ring-accent/50"
                            : tc.border
                        } ${tc.focusRing}`}
                        style={{ backgroundColor: c }}
                        onClick={() => {
                          handleUpdateType(index, { color: c });
                          setEditingColorIdx(null);
                        }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add type button */}
          <button
            type="button"
            onClick={handleAddType}
            className={`${tc.button} w-full rounded-md px-3 py-1.5`}
            data-testid="card-type-add"
          >
            + Add type
          </button>
        </>
      )}
    </fieldset>
  );
}
