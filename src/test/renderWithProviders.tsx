import * as React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { BoardContext } from "../board/BoardContext";
import { BoardsContext } from "../boards/BoardsContext";
import { ClipboardContext } from "../board/ClipboardContext";
import { ThemeContext } from "../theme/ThemeContext";
import type { BoardContextValue } from "../board/types";
import type { BoardsContextValue } from "../boards/types";
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
    cardTypes: [],
    setCardTypes: noop,
    cardTypePresetId: "development",
    setCardTypePresetId: noop,
    defaultCardTypeId: null,
    setDefaultCardTypeId: noop,
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
    renameCardType: noop,
    clearCardType: noop,
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

function makeBoardsContext(
  overrides: Partial<BoardsContextValue> = {},
): BoardsContextValue {
  return {
    boards: [
      {
        id: "test-board",
        title: "Test Board",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    activeBoardId: "test-board",
    nextCardNumber: 1,
    createBoard: () => "new-board-id",
    deleteBoard: noop,
    renameBoard: noop,
    switchBoard: noop,
    duplicateBoard: () => "dup-board-id",
    setNextCardNumber: noop,
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
  boards?: Partial<BoardsContextValue>;
  theme?: Partial<ThemeContextValue>;
  clipboard?: Partial<ClipboardContextValue>;
};

export function renderWithProviders(
  ui: React.ReactElement,
  overrides: ProviderOverrides = {},
  renderOptions?: Omit<RenderOptions, "wrapper">,
) {
  const board = makeBoardContext(overrides.board);
  const boards = makeBoardsContext(overrides.boards);
  const theme = makeThemeContext(overrides.theme);
  const clipboard = makeClipboardContext(overrides.clipboard);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BoardsContext.Provider value={boards}>
      <BoardContext.Provider value={board}>
        <ThemeContext.Provider value={theme}>
          <ClipboardContext.Provider value={clipboard}>
            {children}
          </ClipboardContext.Provider>
        </ThemeContext.Provider>
      </BoardContext.Provider>
    </BoardsContext.Provider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
