export type BoardMeta = Readonly<{
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}>;

export type BoardIndex = Readonly<{
  boards: BoardMeta[];
  activeBoardId: string;
  nextCardNumber: number;
}>;

export type BoardsContextValue = Readonly<{
  boards: BoardMeta[];
  activeBoardId: string;
  nextCardNumber: number;
  createBoard: (title: string) => string;
  deleteBoard: (id: string) => void;
  renameBoard: (id: string, title: string) => void;
  switchBoard: (id: string) => void;
  duplicateBoard: (id: string, title: string) => string;
  setNextCardNumber: (n: number) => void;
}>;
