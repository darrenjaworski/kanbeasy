export type ColumnHistoryEntry = Readonly<{
  columnId: string;
  enteredAt: number;
}>;

export type Card = Readonly<{
  id: string;
  number: number;
  title: string;
  description: string;
  cardTypeId: string | null;
  /** Snapshot of the card type label at assignment time (for rendering after type deletion) */
  cardTypeLabel?: string;
  /** Snapshot of the card type color at assignment time (for rendering after type deletion) */
  cardTypeColor?: string;
  dueDate: string | null;
  createdAt: number;
  updatedAt: number;
  columnHistory: ColumnHistoryEntry[];
}>;

export type ArchivedCard = Card &
  Readonly<{
    archivedAt: number;
    archivedFromColumnId: string;
  }>;

export type CardClipboard = Pick<
  Card,
  "title" | "description" | "cardTypeId" | "cardTypeLabel" | "cardTypeColor"
>;

export type CardUpdates = Partial<
  CardClipboard &
    Pick<Card, "cardTypeId" | "cardTypeLabel" | "cardTypeColor" | "dueDate">
>;

export type Column = Readonly<{
  id: string;
  title: string;
  cards: Card[];
  createdAt: number;
  updatedAt: number;
}>;

export type BoardState = Readonly<{
  columns: Column[];
  archive: ArchivedCard[];
}>;

export type BoardContextValue = Readonly<{
  columns: Column[];
  addColumn: (title?: string) => void;
  updateColumn: (id: string, title: string) => void;
  removeColumn: (id: string) => void;
  addCard: (
    columnId: string,
    title?: string,
    cardTypeId?: string | null,
    cardTypeLabel?: string,
    cardTypeColor?: string,
  ) => string;
  removeCard: (columnId: string, cardId: string) => void;
  updateCard: (columnId: string, cardId: string, updates: CardUpdates) => void;
  setColumns: (cols: Column[], archive?: ArchivedCard[]) => void;
  sortCards: (columnId: string) => void;
  reorderCard: (
    columnId: string,
    activeCardId: string,
    overCardId: string,
  ) => void;
  moveCard: (fromColumnId: string, toColumnId: string, cardId: string) => void;
  duplicateCard: (columnId: string, source: CardClipboard) => string;
  renameCardType: (oldId: string, newId: string) => void;
  clearCardType: (typeId: string) => void;
  archive: ArchivedCard[];
  archiveCard: (columnId: string, cardId: string) => void;
  restoreCard: (archivedCardId: string, targetColumnId: string) => void;
  restoreCards: (cardIds: string[]) => void;
  permanentlyDeleteCard: (archivedCardId: string) => void;
  permanentlyDeleteCards: (cardIds: string[]) => void;
  clearArchive: () => void;
  resetBoard: () => void;
  setNextCardNumber: (n: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  matchingCardIds: Set<string>;
  selectedTypeIds: Set<string>;
  setSelectedTypeIds: (ids: Set<string>) => void;
  clearTypeFilter: () => void;
  isFilterActive: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}>;
