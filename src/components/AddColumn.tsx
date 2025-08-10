export const AddColumn = ({ handleOnClick }: { handleOnClick: () => void }) => {
  return (
    <button
      type="button"
      onClick={handleOnClick}
      aria-label="Add column"
      className="w-80 shrink-0 self-start rounded-lg border border-dashed border-black/15 dark:border-white/15 p-3 text-sm flex flex-col text-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
    >
      <div className="min-h-28 flex items-center justify-center">
        Add Column
      </div>
    </button>
  );
};
