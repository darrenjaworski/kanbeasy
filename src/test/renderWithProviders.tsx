import * as React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { BoardContext } from "../board/BoardContext";
import { ClipboardContext } from "../board/ClipboardContext";
import { ThemeContext } from "../theme/ThemeContext";
import type { BoardContextValue } from "../board/types";
import type { ClipboardContextValue } from "../board/ClipboardContext";
import type { ThemeContextValue } from "../theme/types";

const noop = () => {};

export function makeThemeContext(
  overrides: Partial<ThemeContextValue> = {},
): ThemeContextValue {
  return {
    themeId: "clean-light" as const,
    setThemeId: noop,
    isDark: false,
    themeMode: "light" as const,
    themePreference: "light" as const,
    setThemePreference: noop,
    cardDensity: "medium" as const,
    setCardDensity: noop,
    columnResizingEnabled: false,
    setColumnResizingEnabled: noop,
    deleteColumnWarningEnabled: true,
    setDeleteColumnWarningEnabled: noop,
    owlModeEnabled: false,
    setOwlModeEnabled: noop,
    viewMode: "board" as const,
    setViewMode: noop,
    ticketTypes: [],
    setTicketTypes: noop,
    ticketTypePresetId: "development",
    setTicketTypePresetId: noop,
    defaultTicketTypeId: null,
    setDefaultTicketTypeId: noop,
    compactHeader: false,
    setCompactHeader: noop,
    resetSettings: noop,
    ...overrides,
  };
}

export function makeBoardContext(
  overrides: Partial<BoardContextValue> = {},
): BoardContextValue {
  return {
    columns: [],
    archive: [],
    addColumn: noop,
    updateColumn: noop,
    removeColumn: noop,
    addCard: () => "new-card-id",
    removeCard: noop,
    updateCard: noop,
    setColumns: noop,
    sortCards: noop,
    reorderCard: noop,
    moveCard: noop,
    duplicateCard: () => "dup-id",
    renameTicketType: noop,
    clearTicketType: noop,
    archiveCard: noop,
    restoreCard: noop,
    restoreCards: noop,
    permanentlyDeleteCard: noop,
    permanentlyDeleteCards: noop,
    clearArchive: noop,
    resetBoard: noop,
    setNextCardNumber: noop,
    searchQuery: "",
    setSearchQuery: noop,
    matchingCardIds: new Set<string>(),
    canUndo: false,
    canRedo: false,
    undo: noop,
    redo: noop,
    ...overrides,
  };
}

export function makeClipboardContext(
  overrides: Partial<ClipboardContextValue> = {},
): ClipboardContextValue {
  return {
    copiedCard: null,
    copyCard: noop,
    pasteCard: () => null,
    ...overrides,
  };
}

type ProviderOverrides = {
  board?: Partial<BoardContextValue>;
  theme?: Partial<ThemeContextValue>;
  clipboard?: Partial<ClipboardContextValue>;
};

export function renderWithProviders(
  ui: React.ReactElement,
  overrides: ProviderOverrides = {},
  renderOptions?: Omit<RenderOptions, "wrapper">,
) {
  const board = makeBoardContext(overrides.board);
  const theme = makeThemeContext(overrides.theme);
  const clipboard = makeClipboardContext(overrides.clipboard);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BoardContext.Provider value={board}>
      <ThemeContext.Provider value={theme}>
        <ClipboardContext.Provider value={clipboard}>
          {children}
        </ClipboardContext.Provider>
      </ThemeContext.Provider>
    </BoardContext.Provider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
