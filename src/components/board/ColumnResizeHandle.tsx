/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- separator with tabIndex is an intentional interactive resize widget */
import { tc } from "../../theme/classNames";

type Props = Readonly<{
  onMouseDown: React.MouseEventHandler<HTMLDivElement>;
  stepWidth: (delta: number) => void;
  index?: number;
}>;

export function ColumnResizeHandle({ onMouseDown, stepWidth, index }: Props) {
  return (
    <div
      className="absolute top-0 pt-[8px] pb-[8px] right-0 h-full w-2 cursor-col-resize z-10 group/resizer"
      style={{ marginRight: -8, touchAction: "none" }}
      onMouseDown={onMouseDown}
      aria-label="Resize column"
      role="separator"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") stepWidth(10);
        if (e.key === "ArrowLeft") stepWidth(-10);
      }}
      data-testid={`resize-handle-${index}`}
    >
      <div
        className={`mx-auto h-full w-1 rounded-md ${tc.separator} opacity-60 hover:opacity-100 transition-opacity`}
      />
    </div>
  );
}
