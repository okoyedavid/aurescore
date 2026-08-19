import { activities } from "../data";

export default function ApprovalActivity() {
  return <section className="app-panel rounded-lg border border-[var(--app-border)]"><div className="border-b border-[var(--app-border)] px-5 py-4"><h2 className="font-display text-lg font-semibold">Approval activity</h2><p className="mt-1 text-xs text-[var(--app-muted)]">Latest decisions and submissions</p></div><ol className="px-5">{activities.map(([title,detail,time],index)=><li key={title} className="relative border-b border-[var(--app-border)] py-4 pl-6 last:border-0"><span className={`absolute left-0 top-5 h-2 w-2 rounded-full ${index===0?"bg-emerald-500":index===2?"bg-orange":"bg-blue-600"}`}/><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-[var(--app-muted)]">{detail}</p><p className="mt-2 text-[10px] text-[var(--app-muted)]">{time} ago</p></li>)}</ol></section>;
}
