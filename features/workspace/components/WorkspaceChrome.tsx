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
    { label: "Sessions", href: `${base}/sessions` },
    { label: "Levels", href: `${base}/levels` },
    { label: "Courses", href: `${base}/courses` },
  ];
  return (
    <AppShell area="workspace">
      <div className="mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {query.isPending && (
          <div className="space-y-5">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        )}
        {query.isError && (
          <section
            role="alert"
            className="app-panel rounded-xl border border-[var(--app-border)] p-7"
          >
            <h1 className="font-display text-2xl font-semibold">
              Workspace unavailable
            </h1>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              {normalizeApiError(query.error).status === 404
                ? "This workspace does not exist or is not accessible to your account."
                : getApiErrorMessage(query.error)}
            </p>
            <div className="mt-5 flex gap-5">
              <Link
                href="/workspace"
                className="focus-ring rounded font-semibold text-blue-600"
              >
                All workspaces
              </Link>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="focus-ring rounded font-semibold text-blue-600"
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
              className="focus-ring rounded text-sm font-semibold text-blue-600"
            >
              ← All workspaces
            </Link>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-display text-3xl font-semibold sm:text-4xl">
                  {query.data.name}
                </h1>
                <p className="mt-2 text-sm text-[var(--app-muted)]">
                  {query.data.description || "No description provided."}
                </p>
              </div>
              <Link
                href={`${base}/edit`}
                className="focus-ring rounded text-sm font-semibold text-blue-600"
              >
                Wide edit
              </Link>
            </div>
            <nav
              aria-label="Workspace sections"
              className="mt-7 overflow-x-auto border-b border-[var(--app-border)]"
            >
              <ul className="flex min-w-max gap-6">
                {tabs.map((tab) => {
                  const active = pathname === tab.href;
                  return (
                    <li key={tab.href}>
                      <Link
                        href={tab.href}
                        aria-current={active ? "page" : undefined}
                        className={`focus-ring block rounded-t pb-3 text-sm font-semibold ${active ? "border-b-2 border-blue-600 text-blue-600" : "text-[var(--app-muted)]"}`}
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
