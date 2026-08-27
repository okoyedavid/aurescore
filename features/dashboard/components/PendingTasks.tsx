import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { pendingTasks } from "../data";

export default function PendingTasks() {
  return (
    <section className="self-start border border-[var(--app-border)] bg-[var(--app-panel)]">
      <header className="flex min-h-[103px] items-end justify-between gap-5 border-b border-[var(--app-border)] px-5 py-[18px]">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase leading-normal tracking-[0.13em] text-blue-600">
            Operational queue
          </p>
          <h2 className="m-0 font-display text-2xl font-semibold tracking-[-0.03em]">
            Pending tasks
          </h2>
          <p className="mt-1 text-[10px] text-[var(--app-muted)]">
            Work assigned across your institutions and workspaces.
          </p>
        </div>
        <Link
          href="/dashboard/notifications"
          className="focus-ring text-[10px] font-semibold text-blue-600"
        >
          View all
        </Link>
      </header>
      <div>
        {pendingTasks.map((task, index) => (
          <Link
            key={task.title}
            href={task.href}
            className="group flex min-h-[73px] items-center gap-[13px] border-b border-[var(--app-border)] px-5 py-[15px] last:border-b-0 hover:bg-[var(--app-hover)]"
          >
            <span
              className={`h-[7px] w-[7px] shrink-0 rounded-full ${index === 0 ? "bg-orange" : "bg-blue-600"}`}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold">
                {task.title}
              </span>
              <span className="mt-0.5 block text-[10px] text-[var(--app-muted)]">
                {task.source}
              </span>
            </span>
            <span className="flex items-center gap-2 text-[10px] text-[var(--app-muted)] max-[650px]:flex-col max-[650px]:items-end">
              {task.due}
              <ArrowUpRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
