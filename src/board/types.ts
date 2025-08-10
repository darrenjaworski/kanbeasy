export type Column = Readonly<{
  id: string;
  title: string;
}>;

export type BoardState = Readonly<{
  columns: Column[];
}>;

export type BoardContextValue = Readonly<{
  columns: Column[];
  addColumn: (title?: string) => void;
  updateColumn: (id: string, title: string) => void;
  removeColumn: (id: string) => void;
  setColumns: (cols: Column[]) => void;
}>;
