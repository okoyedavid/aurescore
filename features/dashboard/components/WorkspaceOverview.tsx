import Link from "next/link";
import { ArrowRight, Building2, Code2, Plus, Settings } from "lucide-react";

const metrics = [
  {
    label: "Active workspaces",
    value: "2",
    note: "Across institution and private records",
  },
  {
    label: "Pending tasks",
    value: "3",
    note: "One item is due today",
    urgent: true,
  },
  {
    label: "Invitations",
    value: "2",
    note: "Awaiting your response",
    urgent: true,
  },
  { label: "Account status", value: "Active", note: "All services available" },
];

const actions = [
  {
    label: "New workspace",
    description: "Start a private result workspace",
    href: "/workspace/new",
    icon: Plus,
  },
  {
    label: "Institution",
    description: "Open department operations",
    href: "/institution",
    icon: Building2,
  },
  {
    label: "API application",
    description: "Register an OAuth client",
    href: "/api/new",
    icon: Code2,
  },
  {
    label: "Account settings",
    description: "Manage profile and security",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function WorkspaceOverview() {
  return (
    <>
      <section
        aria-label="Account metrics"
        className="mt-8 grid grid-cols-4 border-l border-t border-[var(--app-border)] max-[1150px]:grid-cols-3 max-[900px]:grid-cols-2"
      >
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`relative min-h-[148px] border-b border-r border-[var(--app-border)] bg-[var(--app-panel)] p-[21px] ${metric.urgent ? "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-orange before:content-['']" : ""}`}
          >
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.05em]">
              {metric.label}
            </p>
            <span className="my-[13px] block font-display text-[35px] font-medium leading-none tracking-[-0.04em] max-[650px]:text-[29px]">
              {metric.value}
            </span>
            <p className="m-0 text-[10px] text-[var(--app-muted)]">
              {metric.note}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-12">
        <p className="mb-2 text-[10px] font-bold uppercase leading-normal tracking-[0.13em] text-blue-600">
          Shortcuts
        </p>
        <h2 className="m-0 font-display text-2xl font-semibold tracking-[-0.03em]">
          Quick actions
        </h2>
        <div className="mt-4 grid grid-cols-4 border-l border-t border-[var(--app-border)] max-[1150px]:grid-cols-2 max-[650px]:grid-cols-1">
          {actions.map(({ label, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="focus-ring group flex min-h-[82px] items-center gap-3 border-b border-r border-[var(--app-border)] bg-[var(--app-panel)] p-4 transition-[background-color,border-color,transform] duration-150 hover:-translate-y-px hover:border-blue-600 hover:bg-[var(--app-hover)]"
            >
              <span className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center border border-[var(--app-border)] text-blue-600">
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold">{label}</span>
                <span className="mt-0.5 block text-[10px] text-[var(--app-muted)]">
                  {description}
                </span>
              </span>
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
