export const AddColumn = ({ handleOnClick }: { handleOnClick: () => void }) => {
  return (
    <button
      type="button"
      onClick={handleOnClick}
      aria-label="Add column"
      className="w-80 shrink-0 self-start rounded-lg border border-dashed border-black/15 dark:border-white/15 p-3 text-sm flex flex-col hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      data-testid="add-column-button"
    >
      <div className="min-h-28 flex items-center justify-center text-center">
        Add Column
      </div>
    </button>
  );
};
