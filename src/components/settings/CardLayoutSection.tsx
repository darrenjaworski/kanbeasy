import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useTheme } from "../../theme/useTheme";
import { tc } from "../../theme/classNames";
import {
  CARD_FIELD_LABELS,
  DEFAULT_CARD_LAYOUT,
  FIELDS_WITH_LINE_OPTIONS,
  MAX_VISIBLE_FIELDS,
} from "../../constants/cardLayout";
import type { CardFieldConfig } from "../../constants/cardLayout";
import { ROWS_FOR_DENSITY } from "../../theme/types";
import { CardBody } from "../board/CardBody";
import { Tooltip } from "../shared/Tooltip";

/** Sample data that mirrors a real card for the preview. */
const SAMPLE = {
  number: 42,
  cardTypeId: "feat",
  cardTypeColor: "#22c55e",
  title: "My example task",
  description:
    "A description with some details\n- [ ] Todo item\n- [x] Done item\n- [ ] Another todo",
  dueDate: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  })(),
  createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1 week ago
  updatedAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
} as const;

function SortableFieldRow({
  field,
  visibleCount,
  onToggle,
  onLinesChange,
}: Readonly<{
  field: CardFieldConfig;
  visibleCount: number;
  onToggle: (id: string) => void;
  onLinesChange: (id: string, lines: number) => void;
}>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  const atLimit = visibleCount >= MAX_VISIBLE_FIELDS && !field.visible;
  const label = CARD_FIELD_LABELS[field.id] ?? field.id;
  const hasLines = FIELDS_WITH_LINE_OPTIONS.has(field.id);

  const checkbox = (
    <input
      type="checkbox"
      checked={field.visible}
      disabled={atLimit}
      onChange={() => onToggle(field.id)}
      aria-label={`Show ${label}`}
      className="accent-accent"
    />
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${tc.glass} ${tc.border} border`}
      data-testid={`layout-field-${field.id}`}
    >
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        className={`cursor-grab touch-none ${tc.textFaint} ${tc.focusRing} rounded`}
        aria-label={`Reorder ${label}`}
        {...attributes}
        {...listeners}
      >
        <svg
          className="size-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm6 0a2 2 0 10.001 4.001A2 2 0 0013 2zM7 8a2 2 0 10.001 4.001A2 2 0 007 8zm6 0a2 2 0 10.001 4.001A2 2 0 0013 8zM7 14a2 2 0 10.001 4.001A2 2 0 007 14zm6 0a2 2 0 10.001 4.001A2 2 0 0013 14z" />
        </svg>
      </button>

      {/* Checkbox with tooltip when disabled */}
      {atLimit ? (
        <Tooltip content={`Max ${MAX_VISIBLE_FIELDS} fields`}>
          <span>{checkbox}</span>
        </Tooltip>
      ) : (
        checkbox
      )}

      {/* Label */}
      <span className={`text-sm flex-1 ${tc.text}`}>{label}</span>

      {/* Lines dropdown */}
      {hasLines && (
        <select
          value={field.options?.lines ?? 1}
          onChange={(e) => onLinesChange(field.id, Number(e.target.value))}
          aria-label={`${label} line count`}
          className={`text-xs rounded px-1 py-0.5 ${tc.glass} ${tc.border} border ${tc.text} ${tc.focusRing}`}
        >
          <option value={1}>1 line</option>
          <option value={2}>2 lines</option>
          <option value={3}>3 lines</option>
        </select>
      )}
    </div>
  );
}

export function CardLayoutSection() {
  const { cardLayout, setCardLayout, cardDensity } = useTheme();
  const rows = ROWS_FOR_DENSITY[cardDensity];
  const visibleCount = cardLayout.filter((f) => f.visible).length;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const updateField = useCallback(
    (id: string, update: Partial<CardFieldConfig>) => {
      setCardLayout(
        cardLayout.map((f) => (f.id === id ? { ...f, ...update } : f)),
      );
    },
    [cardLayout, setCardLayout],
  );

  const handleToggle = useCallback(
    (id: string) => {
      const field = cardLayout.find((f) => f.id === id);
      if (!field) return;
      if (!field.visible && visibleCount >= MAX_VISIBLE_FIELDS) return;
      updateField(id, { visible: !field.visible });
    },
    [cardLayout, visibleCount, updateField],
  );

  const handleLinesChange = useCallback(
    (id: string, lines: number) => {
      const field = cardLayout.find((f) => f.id === id);
      if (!field) return;
      updateField(id, { options: { ...field.options, lines } });
    },
    [cardLayout, updateField],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = cardLayout.findIndex((f) => f.id === active.id);
      const newIndex = cardLayout.findIndex((f) => f.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const updated = [...cardLayout];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);
      setCardLayout(updated);
    },
    [cardLayout, setCardLayout],
  );

  const handleReset = useCallback(() => {
    setCardLayout(DEFAULT_CARD_LAYOUT);
  }, [setCardLayout]);

  return (
    <div className="space-y-4" data-testid="card-layout-editor">
      {/* Live preview using the same CardBody component as the board */}
      <div>
        <p className={`text-xs font-medium ${tc.textFaint} mb-2`}>Preview</p>
        <div className="flex justify-center">
          <div
            className={`w-80 rounded-md border p-2 text-sm ${tc.border} ${tc.glass}`}
            data-testid="card-layout-preview"
          >
            <CardBody
              number={SAMPLE.number}
              cardTypeId={SAMPLE.cardTypeId}
              cardTypeColor={SAMPLE.cardTypeColor}
              title={SAMPLE.title}
              description={SAMPLE.description}
              dueDate={SAMPLE.dueDate}
              createdAt={SAMPLE.createdAt}
              updatedAt={SAMPLE.updatedAt}
              rows={rows}
              cardLayout={cardLayout}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Field list with drag-to-reorder */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-medium ${tc.textFaint}`}>Fields</p>
          <span className={`text-xs ${tc.textFaint}`}>
            {visibleCount}/{MAX_VISIBLE_FIELDS} visible
          </span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={cardLayout.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {cardLayout.map((field) => (
                <SortableFieldRow
                  key={field.id}
                  field={field}
                  visibleCount={visibleCount}
                  onToggle={handleToggle}
                  onLinesChange={handleLinesChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Reset button */}
      <button
        type="button"
        onClick={handleReset}
        className={`w-full text-sm py-1.5 rounded-md border ${tc.border} ${tc.textFaint} ${tc.textHover} ${tc.borderHover} ${tc.focusRing} transition-colors`}
        data-testid="layout-reset"
      >
        Reset to default
      </button>
    </div>
  );
}
