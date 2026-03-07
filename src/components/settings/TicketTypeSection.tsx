import { useState } from "react";
import { useTheme } from "../../theme/useTheme";
import { useBoard } from "../../board/useBoard";
import { tc } from "../../theme/classNames";
import type { TicketType } from "../../constants/ticketTypes";
import {
  TICKET_TYPE_PRESETS,
  TICKET_TYPE_COLORS,
} from "../../constants/ticketTypes";

export function TicketTypeSection() {
  const {
    ticketTypes,
    setTicketTypes,
    ticketTypePresetId,
    setTicketTypePresetId,
    defaultTicketTypeId,
    setDefaultTicketTypeId,
  } = useTheme();
  const { columns, renameTicketType, clearTicketType } = useBoard();
  const [editingColorIdx, setEditingColorIdx] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const handlePresetChange = (presetId: string) => {
    setTicketTypePresetId(presetId);
    if (presetId === "custom") return;
    const preset = TICKET_TYPE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      // Collect ticket type IDs currently used by cards on the board
      const usedTypeIds = new Set<string>();
      for (const col of columns) {
        for (const card of col.cards) {
          if (card.ticketTypeId) usedTypeIds.add(card.ticketTypeId);
        }
      }

      // Keep any in-use type definitions that the new preset doesn't cover
      const newPresetIds = new Set(preset.types.map((t) => t.id));
      const retainedTypes = ticketTypes.filter(
        (t) => usedTypeIds.has(t.id) && !newPresetIds.has(t.id),
      );

      setTicketTypes([...preset.types, ...retainedTypes]);
    }
  };

  const handleUpdateType = (index: number, updates: Partial<TicketType>) => {
    const next = ticketTypes.map((t, i) =>
      i === index ? { ...t, ...updates } : t,
    );
    setTicketTypes(next);
    setTicketTypePresetId("custom");

    // If the id changed, bulk-rename cards
    if (updates.id && updates.id !== ticketTypes[index].id) {
      renameTicketType(ticketTypes[index].id, updates.id);
    }
  };

  const handleRemoveType = (index: number) => {
    const removed = ticketTypes[index];
    clearTicketType(removed.id);
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
    setTicketTypePresetId("custom");
  };

  const handleAddType = () => {
    // Pick the first unused color, or cycle
    const usedColors = new Set(ticketTypes.map((t) => t.color));
    const color =
      TICKET_TYPE_COLORS.find((c) => !usedColors.has(c)) ??
      TICKET_TYPE_COLORS[ticketTypes.length % TICKET_TYPE_COLORS.length];
    const newType: TicketType = { id: "new", label: "New Type", color };
    setTicketTypes([...ticketTypes, newType]);
    setTicketTypePresetId("custom");
  };

  return (
    <fieldset className="border-0 p-0 m-0 space-y-3 text-sm font-medium">
      <legend className="sr-only">Ticket Types</legend>

      {/* Preset selector */}
      <div className="relative">
        <label
          htmlFor="ticket-type-preset"
          className={`block text-xs ${tc.textMuted} mb-1`}
        >
          Preset
        </label>
        <select
          id="ticket-type-preset"
          value={ticketTypePresetId}
          onChange={(e) => handlePresetChange(e.target.value)}
          className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 text-sm ${tc.text} ${tc.focusRing} appearance-none pr-8 cursor-pointer`}
          data-testid="ticket-type-preset"
        >
          {TICKET_TYPE_PRESETS.map((p) => (
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
      {ticketTypes.length > 0 && (
        <div className="relative">
          <label
            htmlFor="default-ticket-type"
            className={`block text-xs ${tc.textMuted} mb-1`}
          >
            Default type for new cards
          </label>
          <select
            id="default-ticket-type"
            value={defaultTicketTypeId ?? ""}
            onChange={(e) => setDefaultTicketTypeId(e.target.value || null)}
            className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 text-sm ${tc.text} ${tc.focusRing} appearance-none pr-8 cursor-pointer`}
            data-testid="default-ticket-type"
          >
            <option value="">None</option>
            {ticketTypes.map((t) => (
              <option key={t.id} value={t.id}>
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
        data-testid="ticket-type-editor-toggle"
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
            {ticketTypes.map((type, index) => (
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

                  {/* ID input */}
                  <input
                    type="text"
                    value={type.id}
                    onChange={(e) =>
                      handleUpdateType(index, { id: e.target.value })
                    }
                    className={`${tc.glass} rounded-md border ${tc.border} px-2 py-1 text-xs font-mono ${tc.text} ${tc.focusRing} w-20`}
                    aria-label={`Type ID for ${type.label}`}
                    data-testid={`ticket-type-id-${index}`}
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
                    data-testid={`ticket-type-label-${index}`}
                  />

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveType(index)}
                    className={`${tc.iconButton} size-6 rounded-full text-xs shrink-0`}
                    aria-label={`Remove ${type.label} type`}
                    data-testid={`ticket-type-remove-${index}`}
                  >
                    &times;
                  </button>
                </div>

                {/* Inline color picker */}
                {editingColorIdx === index && (
                  <div
                    className={`flex gap-1 p-2 mt-1 rounded-md border ${tc.border} ${tc.glass}`}
                  >
                    {TICKET_TYPE_COLORS.map((c) => (
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
            data-testid="ticket-type-add"
          >
            + Add type
          </button>
        </>
      )}
    </fieldset>
  );
}
