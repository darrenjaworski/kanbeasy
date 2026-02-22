type Props = Readonly<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}>;

export function ToggleSwitch({ id, label, checked, onChange }: Props) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
      <span>{label}</span>
      <span className="relative inline-flex items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <span className="block h-6 w-10 rounded-full bg-black/10 dark:bg-white/15 peer-checked:bg-accent transition-colors relative" />
        <span
          aria-hidden
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform peer-checked:translate-x-4"
        />
      </span>
    </label>
  );
}
