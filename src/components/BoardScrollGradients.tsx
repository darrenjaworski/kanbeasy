interface BoardScrollGradientsProps {
  readonly canScrollLeft: boolean;
  readonly canScrollRight: boolean;
}

export function BoardScrollGradients({
  canScrollLeft,
  canScrollRight,
}: BoardScrollGradientsProps) {
  return (
    <>
      {canScrollLeft && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-bg-light/90 to-transparent dark:from-bg-dark/90"
        />
      )}
      {canScrollRight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bg-light/90 to-transparent dark:from-bg-dark/90"
        />
      )}
    </>
  );
}
