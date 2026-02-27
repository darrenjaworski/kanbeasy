import { useCallback, useEffect, useRef, useState } from "react";
import { tc } from "../../theme/classNames";
import { MarkdownPreview } from "../shared/MarkdownPreview";

type Props = Readonly<{
  description: string;
  onSave: (value: string) => void;
}>;

export function DescriptionField({ description, onSave }: Props) {
  const [tempDescription, setTempDescription] = useState(description);
  const [editingDescription, setEditingDescription] = useState(false);
  const descEscaping = useRef(false);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const descHeight = useRef<number>(0);

  useEffect(() => {
    setTempDescription(description);
  }, [description]);

  useEffect(() => {
    if (editingDescription && descRef.current) {
      descRef.current.style.height = `${Math.max(descHeight.current, 72)}px`;
      descRef.current.focus();
    }
  }, [editingDescription]);

  const captureDescHeight = useCallback(() => {
    if (descRef.current) {
      descHeight.current = descRef.current.offsetHeight;
    }
  }, []);

  const enterDescEdit = useCallback(() => {
    if (previewRef.current) {
      descHeight.current = previewRef.current.offsetHeight;
    }
    setEditingDescription(true);
  }, []);

  const handleDescriptionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        descEscaping.current = true;
        captureDescHeight();
        setTempDescription(description);
        setEditingDescription(false);
        e.currentTarget.blur();
      }
    },
    [description, captureDescHeight],
  );

  const handleDescriptionBlur = useCallback(() => {
    if (descEscaping.current) {
      descEscaping.current = false;
      return;
    }
    captureDescHeight();
    const next = tempDescription.trim();
    if (next !== description) {
      onSave(next);
    }
    setEditingDescription(false);
  }, [tempDescription, description, onSave, captureDescHeight]);

  if (editingDescription) {
    return (
      <>
        <textarea
          ref={descRef}
          id="card-detail-description"
          className={`bg-transparent outline-hidden ${tc.focusRing} ${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 text-sm resize-y min-h-[4.5rem]`}
          value={tempDescription}
          onChange={(e) => setTempDescription(e.target.value)}
          onKeyDown={handleDescriptionKeyDown}
          onBlur={handleDescriptionBlur}
          placeholder="Add a description..."
          data-testid="card-detail-description"
        />
        <p className={`text-xs ${tc.textFaint} mt-1`}>
          Supports Markdown: **bold**, *italic*, - lists, [links](url), and more
        </p>
      </>
    );
  }

  if (tempDescription) {
    return (
      <div
        ref={previewRef}
        role="button"
        tabIndex={0}
        className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 cursor-pointer min-h-[4.5rem]`}
        style={
          descHeight.current ? { minHeight: descHeight.current } : undefined
        }
        onClick={enterDescEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            enterDescEdit();
          }
        }}
        data-testid="card-detail-description-preview"
      >
        <MarkdownPreview content={tempDescription} />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 cursor-pointer min-h-[4.5rem] ${tc.textFaint} text-sm`}
      onClick={enterDescEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          enterDescEdit();
        }
      }}
      data-testid="card-detail-description-placeholder"
    >
      Add a description...
    </div>
  );
}
