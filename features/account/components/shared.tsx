import { Skeleton } from "@/components/ui/Skeleton";

export function SettingsPanel({ children }: { children: React.ReactNode }) {
  return (
    <section className="app-panel border border-[var(--app-border)] p-5 sm:p-7">
      {children}
    </section>
  );
}

export function SettingsHeading({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--app-muted)]">
        {copy}
      </p>
    </div>
  );
}

export function AsyncMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  return (
    <div aria-live="polite">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-500"
        >
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          {success}
        </p>
      )}
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-label="Loading account settings"
    >
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="mt-8 h-72 w-full" />
    </div>
  );
}

export function Toggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`focus-ring relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-blue-600" : "bg-[var(--app-hover)]"}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
