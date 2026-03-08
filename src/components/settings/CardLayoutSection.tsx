import { useTheme } from "../../theme/useTheme";
import { tc } from "../../theme/classNames";
import { CARD_FIELD_LABELS } from "../../constants/cardLayout";
import { ROWS_FOR_DENSITY } from "../../theme/types";
import { CardBody } from "../board/CardBody";

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
  const rows = ROWS_FOR_DENSITY[cardDensity];

  return (
    <div className="space-y-4" data-testid="card-layout-editor">
      {/* Live preview using the same CardBody component as the board */}
      <div>
        <p className={`text-xs font-medium ${tc.textFaint} mb-2`}>Preview</p>
        <div
          className={`rounded-md border p-2 text-sm ${tc.border} ${tc.glass}`}
          data-testid="card-layout-preview"
        >
          <CardBody
            number={SAMPLE.number}
            cardTypeId={SAMPLE.cardTypeId}
            cardTypeColor={SAMPLE.cardTypeColor}
            title={SAMPLE.title}
            description={SAMPLE.description}
            dueDate={SAMPLE.dueDate}
            rows={rows}
            readOnly
          />
        </div>
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
