import { useCallback, useEffect, useRef, useState } from "react";
import { useBoard } from "../../board/useBoard";
import { useInlineEdit } from "../../hooks";
import { tc } from "../../theme/classNames";

type Props = Readonly<{
  id: string;
  title: string;
  index?: number;
}>;

export function ColumnTitleEdit({ id, title, index }: Props) {
  const { updateColumn } = useBoard();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tempTitle, setTempTitle] = useState(title);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  const revertTitle = useCallback(() => setTempTitle(title), [title]);
  const saveTitle = useCallback(
    (value: string) => updateColumn(id, value),
    [id, updateColumn],
  );

  const { onKeyDown, onBlur } = useInlineEdit({
    originalValue: title,
    onSave: saveTitle,
    onRevert: revertTitle,
  });

  return (
    <div className="mb-3 mr-8">
      <input
        ref={inputRef}
        type="text"
        aria-label="Column title"
        className={`${tc.input} w-full px-0 py-0 text-base font-semibold tracking-tight opacity-80 rounded-xs`}
        value={tempTitle}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setTempTitle(e.target.value)}
        id={`${id}-title`}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        data-testid={`column-title-input-${index}`}
      />
    </div>
  );
}
