import { CloseIcon } from "./icons";
import { tc } from "../theme/classNames";

type Props = Readonly<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  titleId: string;
  onClose: () => void;
  closeLabel?: string;
}>;

export function ModalHeader({
  icon: Icon,
  title,
  titleId,
  onClose,
  closeLabel = `Close ${title.toLowerCase()}`,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={`size-5 ${tc.textMuted}`} />
      <h2 id={titleId} className="text-base font-semibold tracking-tight">
        {title}
      </h2>
      <button
        type="button"
        className={`ml-auto ${tc.iconButton} h-6 w-6 rounded-full`}
        onClick={onClose}
        aria-label={closeLabel}
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}
