type Props = Readonly<{
  title: string;
}>;

export function Column({ title }: Props) {
  return (
    <section className="rounded-lg border border-black/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark p-3">
      <h2 className="text-sm font-semibold tracking-tight mb-3 opacity-80">
        {title}
      </h2>
      <div className="flex flex-col gap-2 min-h-28">
        <p className="text-xs opacity-60">No cards yet</p>
      </div>
    </section>
  );
}
