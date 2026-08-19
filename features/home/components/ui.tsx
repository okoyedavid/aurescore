import { ReactNode } from "react";

export function Eyebrow({
  children,
  dotColor = "bg-orange",
  invert = false,
}: {
  children: ReactNode;
  dotColor?: string;
  invert?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase ${
        invert ? "text-muted-inv" : "text-muted"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {children}
    </span>
  );
}

export function Pill({
  children,
  invert = false,
}: {
  children: ReactNode;
  invert?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
        invert ? "border-lineDark text-muted-inv" : "border-line text-ink/70"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * Placeholder for real photography / product imagery.
 * Swap the `src` prop in each section for a real <Image> once assets exist.
 * Kept as a labeled gradient block so layout + aspect ratio are copy-paste ready.
 */
export function ImageSlot({
  label,
  className = "",
  from = "from-navy",
  to = "to-navy-deep",
}: {
  label: string;
  className?: string;
  from?: string;
  to?: string;
}) {
  return (
    <div
      className={`relative flex items-end overflow-hidden bg-gradient-to-br ${from} ${to} ${className}`}
    >
      <span className="absolute left-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white/70">
        {label}
      </span>
    </div>
  );
}

export function CircleArrow({ invert = false }: { invert?: boolean }) {
  return (
    <span
      className={`circle-arrow inline-flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 ${
        invert ? "bg-white text-ink" : "bg-navy-deep text-white"
      }`}
    >
      <svg width="19" height="19" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 13L13 3M13 3H5M13 3V11"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
