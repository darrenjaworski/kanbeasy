import { useCallback, useEffect, useRef, useState } from "react";
import { tc } from "../../theme/classNames";
import { toggleMarkdownCheckbox } from "../../utils/toggleMarkdownCheckbox";
import { MarkdownPreview } from "../shared/MarkdownPreview";

type Props = Readonly<{
  description: string;
  onSave: (value: string) => void;
}>;

function appendChecklistItem(markdown: string, text: string): string {
  const item = `- [ ] ${text}`;
  if (!markdown) return item;
  return markdown.endsWith("\n")
    ? `${markdown}${item}`
    : `${markdown}\n${item}`;
}

export function DescriptionField({ description, onSave }: Props) {
  const [tempDescription, setTempDescription] = useState(description);
  const [editingDescription, setEditingDescription] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const descEscaping = useRef(false);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const descHeight = useRef<number>(0);
  const addItemRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempDescription(description);
  }, [description]);

  useEffect(() => {
    if (editingDescription && descRef.current) {
      descRef.current.style.height = `${Math.max(descHeight.current, 72)}px`;
      descRef.current.focus();
    }
  }, [editingDescription]);

  useEffect(() => {
    if (addingItem && addItemRef.current) {
      addItemRef.current.focus();
    }
  }, [addingItem]);

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

  const handleCheckboxToggle = useCallback(
    (index: number) => {
      const updated = toggleMarkdownCheckbox(tempDescription, index);
      setTempDescription(updated);
      onSave(updated);
    },
    [tempDescription, onSave],
  );

  const handleAddItem = useCallback(() => {
    const text = newItemText.trim();
    if (!text) return;
    const updated = appendChecklistItem(tempDescription, text);
    setTempDescription(updated);
    onSave(updated);
    setNewItemText("");
  }, [newItemText, tempDescription, onSave]);

  const handleAddItemKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddItem();
      } else if (e.key === "Escape") {
        e.stopPropagation();
        setAddingItem(false);
        setNewItemText("");
      }
    },
    [handleAddItem],
  );

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

  const addItemInput = addingItem ? (
    <div className="flex items-center gap-2 mt-1.5">
      <input
        ref={addItemRef}
        type="text"
        className={`bg-transparent outline-hidden ${tc.focusRing} ${tc.glass} flex-1 rounded-md border ${tc.border} px-2 py-1 text-sm`}
        value={newItemText}
        onChange={(e) => setNewItemText(e.target.value)}
        onKeyDown={handleAddItemKeyDown}
        onBlur={() => {
          if (!newItemText.trim()) {
            setAddingItem(false);
            setNewItemText("");
          }
        }}
        placeholder="Add checklist item"
        data-testid="checklist-add-item-input"
      />
    </div>
  ) : (
    <button
      type="button"
      className={`mt-1.5 text-xs ${tc.textFaint} hover:text-accent transition-colors cursor-pointer self-start`}
      onClick={(e) => {
        e.stopPropagation();
        setAddingItem(true);
      }}
      data-testid="checklist-add-item-button"
    >
      + Add checklist item
    </button>
  );

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
      <div>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click-to-edit container; keyboard edit via tab + enter on the edit hint below */}
        <div
          ref={previewRef}
          className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 cursor-pointer min-h-[4.5rem]`}
          style={
            descHeight.current ? { minHeight: descHeight.current } : undefined
          }
          onClick={(e) => {
            if (
              e.target instanceof HTMLInputElement &&
              e.target.type === "checkbox"
            )
              return;
            enterDescEdit();
          }}
          data-testid="card-detail-description-preview"
        >
          <MarkdownPreview
            content={tempDescription}
            onCheckboxToggle={handleCheckboxToggle}
          />
        </div>
        {addItemInput}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
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
      {addItemInput}
    </div>
  );
}
