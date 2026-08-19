import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { pendingTasks } from "../data";

export default function PendingTasks() {
  return <section className="app-panel rounded-lg border border-[var(--app-border)]"><div className="border-b border-[var(--app-border)] px-5 py-4"><h2 className="font-display text-lg font-semibold">Pending tasks</h2><p className="mt-1 text-xs text-[var(--app-muted)]">Work assigned across your institutions and workspaces.</p></div><div className="divide-y divide-[var(--app-border)]">{pendingTasks.map((task)=><Link key={task.title} href={task.href} className="group flex items-start gap-3 px-5 py-4 hover:bg-[var(--app-hover)]"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--app-muted)]"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{task.title}</p><p className="mt-1 text-xs text-[var(--app-muted)]">{task.source}</p></div><div className="text-right"><p className="text-[10px] font-medium text-[var(--app-muted)]">{task.due}</p><ArrowUpRight size={15} className="ml-auto mt-2 text-[var(--app-muted)] group-hover:text-[var(--app-text)]"/></div></Link>)}</div></section>;
}
