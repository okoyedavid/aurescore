import { summaryCards } from "../data";

export default function SummaryCards() {
  return <section aria-label="Summary" className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{summaryCards.map(({label,value,detail,icon:Icon,color})=><article key={label} className="app-panel rounded-lg border border-[var(--app-border)] p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-[var(--app-muted)]">{label}</p><p className="mt-3 font-display text-3xl font-semibold">{value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-md bg-[var(--app-hover)] ${color}`}><Icon size={19} aria-hidden="true"/></div></div><p className="mt-4 border-t border-[var(--app-border)] pt-3 text-xs text-[var(--app-muted)]">{detail}</p></article>)}</section>;
}
