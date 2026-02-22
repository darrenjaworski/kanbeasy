import { useCallback, useRef } from "react";

type Options = Readonly<{
  originalValue: string;
  onSave: (value: string) => void;
  onRevert: () => void;
  multiline?: boolean;
}>;

export function useInlineEdit({
  originalValue,
  onSave,
  onRevert,
  multiline = false,
}: Options) {
  const escaping = useRef(false);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (!multiline || !e.shiftKey)) {
        e.preventDefault();
        e.currentTarget.blur();
      }
      if (e.key === "Escape") {
        escaping.current = true;
        onRevert();
        e.currentTarget.blur();
      }
    },
    [multiline, onRevert],
  );

  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (escaping.current) {
        escaping.current = false;
        return;
      }
      const next = e.currentTarget.value.trim();
      if (!next) {
        onRevert();
        return;
      }
      if (next !== originalValue) {
        onSave(next);
      }
    },
    [originalValue, onSave, onRevert],
  );

  return { onKeyDown, onBlur };
}
