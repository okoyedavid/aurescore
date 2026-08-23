"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import AppShell from "@/features/app-shell/components/AppShell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useWorkspaces } from "./hooks";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export default function WorkspacePage() {
  const query = useWorkspaces();
  return (
    <AppShell area="workspace">
      <div className="mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500">
              Private workspace
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              Your workspaces
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
              Keep each set of academic sessions, levels, and courses privately
              separated.
            </p>
          </div>
          <ButtonLink href="/workspace/new">
            <Plus size={17} />
            Create workspace
          </ButtonLink>
        </div>
        {query.isPending && (
          <div
            aria-label="Loading workspaces"
            className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-52 rounded-xl" />
            ))}
          </div>
        )}
        {query.isError && (
          <section
            role="alert"
            className="app-panel mt-8 rounded-xl border border-[var(--app-border)] p-7"
          >
            <h2 className="font-display text-xl font-semibold">
              Workspaces unavailable
            </h2>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              {getApiErrorMessage(query.error)}
            </p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="focus-ring mt-5 rounded font-semibold text-blue-600"
            >
              Try again
            </button>
          </section>
        )}
        {query.isSuccess && query.data.length === 0 && (
          <section className="app-panel mt-8 rounded-xl border border-dashed border-[var(--app-border)] px-6 py-16 text-center">
            <FolderKanban className="mx-auto text-blue-500" size={34} />
            <h2 className="mt-5 font-display text-2xl font-semibold">
              Create your first workspace
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--app-muted)]">
              Start with the workspace details, then optionally add academic
              sessions and levels.
            </p>
            <ButtonLink href="/workspace/new" className="mt-6">
              Create workspace
            </ButtonLink>
          </section>
        )}
        {query.isSuccess && query.data.length > 0 && (
          <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {query.data.map((workspace) => (
              <li key={workspace.id}>
                <Link
                  href={`/workspace/${encodeURIComponent(workspace.id)}`}
                  className="focus-ring app-panel group flex h-full min-h-52 flex-col rounded-xl border border-[var(--app-border)] p-6 transition-transform hover:-translate-y-0.5"
                >
                  <FolderKanban size={20} className="text-blue-500" />
                  <h2 className="mt-5 font-display text-xl font-semibold">
                    {workspace.name}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--app-muted)]">
                    {workspace.description || "No description provided."}
                  </p>
                  <span className="mt-auto flex items-end justify-between pt-6 text-xs text-[var(--app-muted)]">
                    <span>Updated {formatDate(workspace.updatedAt)}</span>
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
