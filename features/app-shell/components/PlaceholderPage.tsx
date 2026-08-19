import AppShell from "./AppShell";
import type { AppArea } from "../navigation";

export default function PlaceholderPage({ area, eyebrow, title, copy }: { area: AppArea; eyebrow: string; title: string; copy: string }) {
  return <AppShell area={area}><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500">{eyebrow}</p><h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">{copy}</p><section className="app-panel mt-8 rounded-lg border border-[var(--app-border)] p-8"><p className="text-sm text-[var(--app-muted)]">This view establishes the product area and navigation boundary. Its data operations will connect to the application backend.</p></section></div></AppShell>;
}
