"use client";

import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useOAuthClients } from "./hooks";

export default function OAuthClientsPage() {
  const clients = useOAuthClients();
  return (
    <div className="mx-auto w-full max-w-[1500px] px-[clamp(20px,4.5vw,72px)] pb-[72px] pt-[clamp(28px,4vw,58px)] max-[900px]:px-5 max-[900px]:pb-14 max-[900px]:pt-7">
      <header className="flex items-end justify-between gap-6 border-b border-[var(--app-border)] pb-6 max-[650px]:flex-col max-[650px]:items-stretch">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase leading-normal tracking-[0.13em] text-blue-600">
            Developer
          </p>
          <h1 className="m-0 font-display text-[clamp(38px,4vw,50px)] font-medium leading-none tracking-[-0.045em] max-[650px]:text-[39px]">
            OAuth applications
          </h1>
          <p className="mt-2.5 max-w-[660px] text-xs leading-normal text-[var(--app-muted)]">
            Build confidential server-side integrations that let people sign in
            with AureScore.
          </p>
        </div>
        <Link
          href="/api/new"
          className="focus-ring inline-flex min-h-10 items-center justify-center rounded-sm border border-[var(--app-border)] bg-[var(--app-panel)] px-4 text-xs font-semibold text-[var(--app-text)] transition-colors hover:bg-[var(--app-hover)]"
        >
          Create application
        </Link>
      </header>
      {clients.isPending ? (
        <div className="mt-8 grid grid-cols-2 border-l border-t border-[var(--app-border)] max-[650px]:grid-cols-1">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="border-b border-r border-[var(--app-border)] bg-[var(--app-panel)] p-5"
            >
              <Skeleton className="h-32 rounded-none" />
            </div>
          ))}
        </div>
      ) : clients.isError ? (
        <div
          role="alert"
          className="app-panel mt-8 border border-[var(--app-border)] p-5"
        >
          <p className="font-semibold">Applications could not be loaded.</p>
          <p className="mt-2 text-xs text-[var(--app-muted)]">
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
        <div className="mt-8 grid grid-cols-2 border-l border-t border-[var(--app-border)] max-[650px]:grid-cols-1">
          {clients.data.map((client) => (
            <Link
              key={client.clientId}
              href={`/api/applications/${encodeURIComponent(client.clientId)}`}
              className="app-panel focus-ring group border-b border-r border-[var(--app-border)] p-5 transition-[background-color,border-color,transform] duration-150 hover:-translate-y-px hover:border-blue-600 hover:bg-[var(--app-hover)]"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-[38px] w-[38px] items-center justify-center border border-[var(--app-border)] text-blue-600">
                  <Code2 size={18} />
                </span>
                <span className="rounded-full bg-[var(--app-hover)] px-3 py-1 text-xs font-semibold">
                  {client.state}
                </span>
              </div>
              <h2 className="mt-5 font-display text-xl font-semibold">
                {client.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[var(--app-muted)]">
                {client.description || "No description"}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-semibold text-blue-600">
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
        <div className="app-panel mt-8 border border-dashed border-[var(--app-border)] px-6 py-14 text-center">
          <Code2 className="mx-auto text-[var(--app-muted)]" />
          <h2 className="mt-4 font-display text-2xl font-semibold">
            No OAuth applications yet
          </h2>
          <p className="mt-2 text-xs text-[var(--app-muted)]">
            Register your first confidential web client to get started.
          </p>
        </div>
      )}
    </div>
  );
}
