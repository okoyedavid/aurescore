"use client";

import Link from "next/link";
import { ArrowRight, Code2, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useOAuthClients } from "./hooks";

export default function OAuthClientsPage() {
  const clients = useOAuthClients();
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
            Developer
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">
            OAuth applications
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--app-muted)]">
            Build confidential server-side integrations that let people sign in
            with AureScore.
          </p>
        </div>
        <ButtonLink href="/api/new">
          <Plus size={16} />
          Create application
        </ButtonLink>
      </div>
      {clients.isPending ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : clients.isError ? (
        <div
          role="alert"
          className="app-panel mt-8 rounded-xl border border-[var(--app-border)] p-6"
        >
          <p className="font-semibold">Applications could not be loaded.</p>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            {getApiErrorMessage(clients.error)}
          </p>
          <button
            className="focus-ring mt-4 rounded font-semibold text-blue-600"
            onClick={() => void clients.refetch()}
          >
            Try again
          </button>
        </div>
      ) : clients.data?.length ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {clients.data.map((client) => (
            <Link
              key={client.clientId}
              href={`/api/applications/${encodeURIComponent(client.clientId)}`}
              className="app-panel focus-ring group rounded-xl border border-[var(--app-border)] p-6 transition hover:border-blue-400"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                  <Code2 size={20} />
                </span>
                <span className="rounded-full bg-[var(--app-hover)] px-3 py-1 text-xs font-semibold">
                  {client.state}
                </span>
              </div>
              <h2 className="mt-5 font-display text-xl font-semibold">
                {client.name}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--app-muted)]">
                {client.description || "No description"}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                View application{" "}
                <ArrowRight
                  size={15}
                  className="transition group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="app-panel mt-8 rounded-xl border border-dashed border-[var(--app-border)] px-6 py-14 text-center">
          <Code2 className="mx-auto text-[var(--app-muted)]" />
          <h2 className="mt-4 font-display text-2xl font-semibold">
            No OAuth applications yet
          </h2>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Register your first confidential web client to get started.
          </p>
        </div>
      )}
    </div>
  );
}
