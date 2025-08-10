export type Card = Readonly<{
  id: string;
  title: string;
}>;

export type Column = Readonly<{
  id: string;
  title: string;
  cards: Card[];
}>;

export type BoardState = Readonly<{
  columns: Column[];
}>;

export type BoardContextValue = Readonly<{
  columns: Column[];
  addColumn: (title?: string) => void;
  updateColumn: (id: string, title: string) => void;
  removeColumn: (id: string) => void;
  addCard: (columnId: string, title?: string) => void;
  removeCard: (columnId: string, cardId: string) => void;
  setColumns: (cols: Column[]) => void;
}>;
