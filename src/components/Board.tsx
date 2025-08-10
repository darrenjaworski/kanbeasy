import { Column } from "./Column";

export function Board() {
  // Temporary starter columns; will be customizable later
  const columns = [
    { id: "todo", title: "To Do" },
    { id: "doing", title: "Doing" },
    { id: "done", title: "Done" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {columns.map((c) => (
        <Column key={c.id} title={c.title} />
      ))}
    </div>
  );
}
