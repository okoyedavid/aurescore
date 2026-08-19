"use client";

import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useAuditEvents } from "../hooks";
import {
  approximateLocation,
  auditEventLabel,
  formatLocalDate,
  readableDevice,
} from "../presentation";
import { AsyncMessage, SettingsHeading, SettingsPanel } from "./shared";

export default function AuditHistory() {
  const audit = useAuditEvents(30);
  const events = audit.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <SettingsPanel>
      <SettingsHeading
        title="Account activity"
        copy="Security and account events recorded by AureScore. Event values are always rendered as plain text."
      />
      {audit.isFetching && !audit.isPending && !audit.isFetchingNextPage && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 text-xs text-blue-500"
        >
          <RefreshCw size={13} className="animate-spin" />
          Refreshing activity…
        </p>
      )}
      {audit.isError && (
        <div className="mt-5">
          <AsyncMessage error={getApiErrorMessage(audit.error)} />
        </div>
      )}
      {audit.isPending ? (
        <div
          className="mt-6 space-y-3"
          role="status"
          aria-label="Loading account activity"
        >
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <ol className="mt-6 space-y-3">
          {events.map((event) => (
            <li
              key={event.eventId}
              className="rounded-lg border border-[var(--app-border)] p-4 sm:p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--app-hover)]">
                  <ShieldCheck size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">
                      {auditEventLabel(event)}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${event.outcome === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                    >
                      {event.outcome || "unknown"}
                    </span>
                    <span className="rounded-full bg-[var(--app-hover)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--app-muted)]">
                      {event.severity || "unknown"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--app-muted)]">
                    {formatLocalDate(event.createdAt)} ·{" "}
                    {approximateLocation(event)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                    {readableDevice(event)}
                    {event.ipAddress ? ` · ${event.ipAddress}` : ""}
                  </p>
                  {event.reason && (
                    <p className="mt-2 text-xs leading-relaxed text-[var(--app-muted)]">
                      Reason: {event.reason}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
          {events.length === 0 && (
            <li className="py-8 text-center text-sm text-[var(--app-muted)]">
              No account activity is available.
            </li>
          )}
        </ol>
      )}
      {audit.hasNextPage && (
        <div className="mt-6 text-center">
          <Button
            type="button"
            variant="outline"
            disabled={audit.isFetchingNextPage}
            onClick={() => void audit.loadNextPage()}
          >
            {audit.isFetchingNextPage ? "Loading more…" : "Load more activity"}
          </Button>
        </div>
      )}
    </SettingsPanel>
  );
}
