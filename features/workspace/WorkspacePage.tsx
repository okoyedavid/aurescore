"use client";

import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";
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
      <div className="mx-auto w-full max-w-[1500px] px-[clamp(20px,4.5vw,72px)] pb-[72px] pt-[clamp(28px,4vw,58px)] max-[900px]:px-5 max-[900px]:pb-14 max-[900px]:pt-7">
        <header className="flex items-end justify-between gap-6 border-b border-[var(--app-border)] pb-6 max-[650px]:flex-col max-[650px]:items-stretch">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase leading-normal tracking-[0.13em] text-blue-600">
              Private workspace
            </p>
            <h1 className="m-0 font-display text-[clamp(38px,4vw,50px)] font-medium leading-none tracking-[-0.045em] max-[650px]:text-[39px]">
              Your workspaces
            </h1>
            <p className="mt-2.5 max-w-[660px] text-xs leading-normal text-[var(--app-muted)]">
              Keep each set of academic sessions, reusable terms, levels, and
              courses privately separated.
            </p>
          </div>
          <Link
            href="/workspace/new"
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-sm border border-[var(--app-border)] bg-[var(--app-panel)] px-4 text-xs font-semibold text-[var(--app-text)] transition-colors duration-150 hover:bg-[var(--app-hover)]"
          >
            Create workspace
          </Link>
        </header>
        {query.isPending && (
          <div
            aria-label="Loading workspaces"
            className="mt-8 grid grid-cols-3 border-l border-t border-[var(--app-border)] max-[1150px]:grid-cols-2 max-[650px]:grid-cols-1"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="border-b border-r border-[var(--app-border)] bg-[var(--app-panel)] p-5"
              >
                <Skeleton className="h-40 rounded-none" />
              </div>
            ))}
          </div>
        )}
        {query.isError && (
          <section
            role="alert"
            className="mt-8 border border-[var(--app-border)] bg-[var(--app-panel)] p-5"
          >
            <p className="mb-2 text-[10px] font-bold uppercase leading-normal tracking-[0.13em] text-blue-600">
              Unable to load
            </p>
            <h2 className="m-0 font-display text-2xl font-semibold tracking-[-0.03em]">
              Workspaces unavailable
            </h2>
            <p className="mt-2 text-xs text-[var(--app-muted)]">
              {getApiErrorMessage(query.error)}
            </p>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="focus-ring mt-5 text-xs font-semibold text-blue-600"
            >
              Try again
            </button>
          </section>
        )}
        {query.isSuccess && query.data.length === 0 && (
          <section className="mt-8 border border-dashed border-[var(--app-border)] bg-[var(--app-panel)] px-6 py-16 text-center">
            <FolderKanban className="mx-auto text-blue-600" size={30} />
            <h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.03em]">
              Create your first workspace
            </h2>
            <p className="mx-auto mt-2 max-w-md text-xs text-[var(--app-muted)]">
              Start with the workspace details, then optionally add academic
              sessions, terms, and levels.
            </p>
            <Link
              href="/workspace/new"
              className="focus-ring mt-6 inline-flex min-h-10 items-center justify-center rounded-sm bg-blue-600 px-4 text-xs font-semibold text-white transition-colors duration-150 hover:bg-blue-500"
            >
              Create workspace
            </Link>
          </section>
        )}
        {query.isSuccess && query.data.length > 0 && (
          <ul className="mt-8 grid grid-cols-3 border-l border-t border-[var(--app-border)] max-[1150px]:grid-cols-2 max-[650px]:grid-cols-1">
            {query.data.map((workspace) => (
              <li key={workspace.id} className="flex">
                <Link
                  href={`/workspace/${encodeURIComponent(workspace.id)}`}
                  className="focus-ring group flex min-h-[184px] w-full flex-col border-b border-r border-[var(--app-border)] bg-[var(--app-panel)] p-5 transition-[background-color,border-color,transform] duration-150 hover:-translate-y-px hover:border-blue-600 hover:bg-[var(--app-hover)]"
                >
                  <span className="inline-flex h-[38px] w-[38px] items-center justify-center border border-[var(--app-border)] text-blue-600">
                    <FolderKanban size={18} />
                  </span>
                  <h2 className="mt-4 font-display text-xl font-semibold tracking-[-0.03em]">
                    {workspace.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[var(--app-muted)]">
                    {workspace.description || "No description provided."}
                  </p>
                  <span className="mt-auto flex items-end justify-between pt-5 text-[10px] text-[var(--app-muted)]">
                    <span>Updated {formatDate(workspace.updatedAt)}</span>
                    <ArrowRight
                      size={15}
                      className="text-[var(--app-text)] transition-transform group-hover:translate-x-0.5"
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
