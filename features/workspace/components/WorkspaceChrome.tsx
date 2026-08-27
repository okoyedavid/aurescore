"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import AppShell from "@/features/app-shell/components/AppShell";
import { getApiErrorMessage, normalizeApiError } from "@/lib/api/errors";
import { useWorkspace } from "../hooks";
import type { WorkspaceDetails } from "../types";

export default function WorkspaceChrome({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: (workspace: WorkspaceDetails) => React.ReactNode;
}) {
  const pathname = usePathname();
  const query = useWorkspace(workspaceId);
  const base = `/workspace/${encodeURIComponent(workspaceId)}`;
  const tabs = [
    { label: "Overview", href: base },
    { label: "Sessions & terms", href: `${base}/sessions` },
    { label: "Levels", href: `${base}/levels` },
    { label: "Courses", href: `${base}/courses` },
    { label: "Schemes", href: `${base}/assessment-schemes` },
    { label: "Grading", href: `${base}/grading-schemes` },
    { label: "Students", href: `${base}/students` },
    { label: "Results", href: `${base}/results` },
    { label: "GPA", href: `${base}/gpa` },
  ];
  return (
    <AppShell area="workspace">
      <div className="mx-auto w-full max-w-[1500px] px-[clamp(20px,4.5vw,72px)] pb-[72px] pt-[clamp(28px,4vw,58px)] max-[900px]:px-5 max-[900px]:pb-14 max-[900px]:pt-7">
        {query.isPending && (
          <div className="space-y-5">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-16 w-full rounded-none" />
            <Skeleton className="h-72 w-full rounded-none" />
          </div>
        )}
        {query.isError && (
          <section
            role="alert"
            className="app-panel border border-[var(--app-border)] p-5"
          >
            <h1 className="font-display text-2xl font-semibold">
              Workspace unavailable
            </h1>
            <p className="mt-2 text-xs text-[var(--app-muted)]">
              {normalizeApiError(query.error).status === 404
                ? "This workspace does not exist or is not accessible to your account."
                : getApiErrorMessage(query.error)}
            </p>
            <div className="mt-5 flex gap-5">
              <Link
                href="/workspace"
                className="focus-ring text-xs font-semibold text-blue-600"
              >
                All workspaces
              </Link>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="focus-ring text-xs font-semibold text-blue-600"
              >
                Try again
              </button>
            </div>
          </section>
        )}
        {query.data && (
          <>
            <Link
              href="/workspace"
              className="focus-ring text-[10px] font-bold uppercase tracking-[0.13em] text-blue-600"
            >
              ← All workspaces
            </Link>
            <header className="mt-5 flex flex-col gap-4 border-b border-[var(--app-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-display text-[clamp(38px,4vw,50px)] font-medium leading-none tracking-[-0.045em] max-[650px]:text-[39px]">
                  {query.data.name}
                </h1>
                <p className="mt-2.5 max-w-[660px] text-xs leading-normal text-[var(--app-muted)]">
                  {query.data.description || "No description provided."}
                </p>
              </div>
              <Link
                href={`${base}/edit`}
                className="focus-ring inline-flex min-h-10 items-center justify-center rounded-sm border border-[var(--app-border)] bg-[var(--app-panel)] px-4 text-xs font-semibold text-[var(--app-text)] transition-colors hover:bg-[var(--app-hover)]"
              >
                Wide edit
              </Link>
            </header>
            <nav
              aria-label="Workspace sections"
              className="overflow-x-auto border-b border-[var(--app-border)]"
            >
              <ul className="flex min-w-max gap-6 pt-5">
                {tabs.map((tab) => {
                  const active = pathname === tab.href;
                  return (
                    <li key={tab.href}>
                      <Link
                        href={tab.href}
                        aria-current={active ? "page" : undefined}
                        className={`focus-ring block pb-3 text-[11px] font-semibold ${active ? "border-b-2 border-blue-600 text-blue-600" : "text-[var(--app-muted)] hover:text-[var(--app-text)]"}`}
                      >
                        {tab.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="mt-7">{children(query.data)}</div>
          </>
        )}
      </div>
    </AppShell>
  );
}
