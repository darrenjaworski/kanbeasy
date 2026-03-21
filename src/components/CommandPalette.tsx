import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useBoard } from "../board/useBoard";
import { useTheme } from "../theme/useTheme";
import { tc } from "../theme/classNames";

type Action = Readonly<{
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
}>;

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function CommandPalette({ open, onClose }: Props) {
  const { columns, addCard, addColumn } = useBoard();
  const { viewMode, setViewMode, defaultCardTypeId, cardTypes } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const hasCards = columns.some((c) => c.cards.length > 0);
  const hasDueDates = columns.some((c) => c.cards.some((card) => card.dueDate));

  const actions = useMemo<Action[]>(
    () => [
      {
        id: "add-card",
        label: "Add card",
        disabled: columns.length === 0,
      },
      { id: "add-column", label: "Add column" },
      { id: "focus-search", label: "Focus search", disabled: !hasCards },
      {
        id: "view-board",
        label: "Switch to board view",
        disabled: viewMode === "board",
      },
      {
        id: "view-list",
        label: "Switch to list view",
        disabled: viewMode === "list" || !hasCards,
      },
      {
        id: "view-calendar",
        label: "Switch to calendar view",
        disabled: viewMode === "calendar" || !hasDueDates,
      },
      { id: "open-analytics", label: "Open analytics", disabled: !hasCards },
      { id: "open-archive", label: "Open archive" },
      { id: "open-settings", label: "Open settings" },
    ],
    [columns.length, hasCards, hasDueDates, viewMode],
  );

  const filtered = useMemo(() => {
    const enabled = actions.filter((a) => !a.disabled);
    if (!query) return enabled;
    const lower = query.toLowerCase();
    return enabled.filter((a) => a.label.toLowerCase().includes(lower));
  }, [actions, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement | undefined;
    selected?.scrollIntoView?.({ block: "nearest" });
  }, [selectedIndex]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSelect = useCallback(
    (actionId: string) => {
      switch (actionId) {
        case "add-card": {
          if (columns.length === 0) return;
          const firstColumn = columns[0];
          const defaultType = defaultCardTypeId
            ? cardTypes.find((t) => t.id === defaultCardTypeId)
            : undefined;
          addCard(
            firstColumn.id,
            "New card",
            defaultCardTypeId,
            defaultType?.label,
            defaultType?.color,
          );
          break;
        }
        case "add-column":
          addColumn("New Column");
          break;
        case "focus-search":
          document.getElementById("search-cards")?.focus();
          break;
        case "view-board":
          setViewMode("board");
          break;
        case "view-list":
          setViewMode("list");
          break;
        case "view-calendar":
          setViewMode("calendar");
          break;
        case "open-analytics":
          document
            .querySelector<HTMLButtonElement>('[aria-label="Open analytics"]')
            ?.click();
          break;
        case "open-archive":
          document
            .querySelector<HTMLButtonElement>('[aria-label="Open archive"]')
            ?.click();
          break;
        case "open-settings":
          document
            .querySelector<HTMLButtonElement>('[aria-label="Open settings"]')
            ?.click();
          break;
      }
      onClose();
    },
    [
      columns,
      addCard,
      addColumn,
      defaultCardTypeId,
      cardTypes,
      setViewMode,
      onClose,
    ],
  );

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (i) =>
          (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1),
      );
    } else if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex].id);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        aria-label="Close command palette"
        onClick={onClose}
        tabIndex={-1}
        data-testid="command-palette-backdrop"
      />
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- composite widget with internal keyboard handling */}
      <div
        className={`relative z-10 w-full max-w-[calc(100%-2rem)] sm:max-w-lg rounded-lg border ${tc.border} bg-surface shadow-2xl overflow-hidden`}
        onKeyDown={handleKeyDown}
        data-testid="command-palette"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a command..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full border-b ${tc.border} bg-transparent px-4 py-3 text-sm outline-hidden ${tc.placeholder}`}
          aria-label="Command search"
          data-testid="command-palette-input"
        />
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Commands"
          className="max-h-64 overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <li className={`px-4 py-3 text-sm ${tc.textFaint}`}>
              No matching commands
            </li>
          ) : (
            filtered.map((action, i) => (
              <li
                key={action.id}
                role="option"
                aria-selected={i === selectedIndex}
                className={`flex items-center justify-between px-4 py-3 sm:py-2 text-sm cursor-pointer transition-colors ${
                  i === selectedIndex
                    ? "bg-accent/10 text-accent"
                    : `${tc.text} ${tc.bgHover}`
                }`}
                onClick={() => handleSelect(action.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSelect(action.id);
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                data-testid={`command-${action.id}`}
              >
                <span>{action.label}</span>
                {action.shortcut && (
                  <kbd className={`text-xs ${tc.textFaint} font-mono`}>
                    {action.shortcut}
                  </kbd>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
