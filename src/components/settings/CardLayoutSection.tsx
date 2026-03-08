import { useTheme } from "../../theme/useTheme";
import { tc } from "../../theme/classNames";
import { CARD_FIELD_LABELS } from "../../constants/cardLayout";
import type { CardLayout } from "../../constants/cardLayout";
import { ROWS_FOR_DENSITY } from "../../theme/types";
import { CardTypeBadge } from "../shared/CardTypeBadge";
import { ChecklistProgress } from "../shared/ChecklistProgress";
import { DueDateBadge } from "../shared/DueDateBadge";

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
  createdAt: (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.getTime();
  })(),
  updatedAt: Date.now(),
} as const;

function FieldRow({ id, visible }: Readonly<{ id: string; visible: boolean }>) {
  return (
    <div
      className={`flex items-center gap-3 rounded-md px-3 py-2 ${tc.glass} ${tc.border} border`}
      data-testid={`layout-field-${id}`}
    >
      <input
        type="checkbox"
        checked={visible}
        readOnly
        aria-label={`Show ${CARD_FIELD_LABELS[id as keyof typeof CARD_FIELD_LABELS] ?? id}`}
        className="accent-accent"
      />
      <span className={`text-sm ${tc.text}`}>
        {CARD_FIELD_LABELS[id as keyof typeof CARD_FIELD_LABELS] ?? id}
      </span>
    </div>
  );
}

export function CardLayoutSection() {
  const { cardLayout, cardDensity } = useTheme();

  return (
    <div className="space-y-4" data-testid="card-layout-editor">
      {/* Live preview using same components as the real board card */}
      <div>
        <p className={`text-xs font-medium ${tc.textFaint} mb-2`}>Preview</p>
        <CardPreview layout={cardLayout} density={cardDensity} />
      </div>

      {/* Field list */}
      <div>
        <p className={`text-xs font-medium ${tc.textFaint} mb-2`}>Fields</p>
        <div className="space-y-1.5">
          {cardLayout.map((field) => (
            <FieldRow key={field.id} id={field.id} visible={field.visible} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Preview card that uses the same shared components and CSS as
 * SortableCardItem to ensure visual fidelity with the real board.
 */
function CardPreview({
  layout,
  density,
}: Readonly<{ layout: CardLayout; density: string }>) {
  const rowsForDensity =
    ROWS_FOR_DENSITY[density as keyof typeof ROWS_FOR_DENSITY] ?? 1;
  const visibleFields = layout.filter((f) => f.visible);

  return (
    <div
      className={`rounded-md border p-2 text-sm ${tc.border} ${tc.glass}`}
      data-testid="card-layout-preview"
    >
      {visibleFields.length === 0 ? (
        <p className={`text-xs ${tc.textFaint} italic`}>No fields visible</p>
      ) : (
        visibleFields.map((field) => {
          const lines = field.options?.lines;
          switch (field.id) {
            case "badge":
              return (
                <CardTypeBadge
                  key="badge"
                  number={SAMPLE.number}
                  cardTypeId={SAMPLE.cardTypeId}
                  cardTypeColor={SAMPLE.cardTypeColor}
                />
              );
            case "title":
              return (
                <textarea
                  key="title"
                  aria-label="Card content"
                  defaultValue={SAMPLE.title}
                  readOnly
                  className={`${tc.input} mt-1 w-full resize-none rounded-xs`}
                  rows={lines ?? rowsForDensity}
                />
              );
            case "description":
              return (
                <p
                  key="description"
                  className={`text-xs ${tc.textMuted} mt-1`}
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: lines ?? 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {SAMPLE.description.replace(/- \[[ x]\] /g, "")}
                </p>
              );
            case "checklist":
              return (
                <div
                  key="checklist"
                  className="flex items-center gap-2 empty:hidden"
                >
                  <ChecklistProgress
                    description={SAMPLE.description}
                    className="flex-1"
                    showCount={false}
                  />
                </div>
              );
            case "dueDate":
              return (
                <div
                  key="dueDate"
                  className="flex items-center gap-2 empty:hidden"
                >
                  <DueDateBadge dueDate={SAMPLE.dueDate} />
                </div>
              );
            case "createdAt":
              return (
                <span
                  key="createdAt"
                  className={`block text-xs ${tc.textFaint} mt-1`}
                >
                  Created {new Date(SAMPLE.createdAt).toLocaleDateString()}
                </span>
              );
            case "updatedAt":
              return (
                <span
                  key="updatedAt"
                  className={`block text-xs ${tc.textFaint} mt-1`}
                >
                  Updated {new Date(SAMPLE.updatedAt).toLocaleDateString()}
                </span>
              );
            default:
              return null;
          }
        })
      )}
    </div>
  );
}
