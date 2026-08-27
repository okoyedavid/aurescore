"use client";

import { FormEvent, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import WorkspaceChrome from "./components/WorkspaceChrome";
import { FieldError, RequestError } from "./components/FieldError";
import TermsManager from "./components/TermsManager";
import { useSessionMutations, useSessions } from "./hooks";
import type { WorkspaceSession } from "./types";
import {
  isoToDateInput,
  normalizeSession,
  validateSession,
  type FieldErrors,
} from "./validation";

function localDate(value: string | null) {
  if (!value) return "No date";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "No date"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(date);
}

function Sessions({ workspaceId }: { workspaceId: string }) {
  const query = useSessions(workspaceId);
  const mutations = useSessionMutations(workspaceId);
  const [editing, setEditing] = useState<WorkspaceSession | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<WorkspaceSession | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const locked = useRef(false);
  const mutation = editing?.id ? mutations.update : mutations.create;
  const removal = mutations.remove;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || mutation.isPending) return;
    const data = new FormData(event.currentTarget);
    const input = normalizeSession({
      name: String(data.get("name") ?? ""),
      startsAt: String(data.get("startsAt") ?? ""),
      endsAt: String(data.get("endsAt") ?? ""),
    });
    const next = validateSession(input);
    setErrors(next);
    mutation.reset();
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        event.currentTarget
          .querySelector<HTMLElement>("[aria-invalid='true']")
          ?.focus(),
      );
      return;
    }
    locked.current = true;
    try {
      if (editing?.id)
        await mutations.update.mutateAsync({ sessionId: editing.id, input });
      else await mutations.create.mutateAsync(input);
      setEditing(undefined);
    } catch {
    } finally {
      locked.current = false;
    }
  }
  async function remove() {
    if (!deleting || removal.isPending) return;
    try {
      await removal.mutateAsync(deleting.id);
      setDeleting(null);
    } catch {}
  }
  const error =
    (mutation.isError && normalizeApiError(mutation.error).message) ||
    (removal.isError && normalizeApiError(removal.error).message);
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            Academic sessions
          </h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Dates are shown in your locale without shifting the selected day.
          </p>
        </div>
        <Button
          onClick={() => {
            setErrors({});
            mutations.create.reset();
            setEditing(null);
          }}
        >
          <Plus size={16} />
          Add session
        </Button>
      </div>
      <RequestError>{error || undefined}</RequestError>
      {query.isPending && (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-24 rounded-none" />
          <Skeleton className="h-24 rounded-none" />
        </div>
      )}
      {query.isError && (
        <section
          role="alert"
          className="app-panel mt-5 border border-[var(--app-border)] p-5"
        >
          <p>{normalizeApiError(query.error).message}</p>
          <button
            onClick={() => void query.refetch()}
            className="focus-ring mt-3 rounded font-semibold text-blue-600"
          >
            Try again
          </button>
        </section>
      )}
      {query.data?.length === 0 && (
        <p className="app-panel mt-5 border border-dashed border-[var(--app-border)] p-10 text-center text-xs text-[var(--app-muted)]">
          No sessions yet.
        </p>
      )}
      <ul className="mt-5 border-l border-t border-[var(--app-border)]">
        {query.data?.map((item) => (
          <li
            key={item.id}
            className="app-panel flex flex-col gap-4 border-b border-r border-[var(--app-border)] p-5 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                {localDate(item.startsAt)} — {localDate(item.endsAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="app-icon-button"
                aria-label={`Edit ${item.name}`}
                onClick={() => {
                  setErrors({});
                  mutations.update.reset();
                  setEditing(item);
                }}
              >
                <Pencil size={16} />
              </button>
              <button
                className="app-icon-button text-red-600"
                aria-label={`Delete ${item.name}`}
                onClick={() => {
                  removal.reset();
                  setDeleting(item);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <TermsManager workspaceId={workspaceId} />
      <Dialog
        open={editing !== undefined}
        onClose={() => !mutation.isPending && setEditing(undefined)}
        title={editing ? "Edit session" : "Add session"}
        description="The end date cannot precede the start date."
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <label className="block text-sm font-semibold">
            Name
            <Input
              name="name"
              autoFocus
              defaultValue={editing?.name ?? ""}
              className="mt-1"
              aria-invalid={Boolean(errors["session.name"])}
            />
            <FieldError>{errors["session.name"]}</FieldError>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Start date
              <Input
                name="startsAt"
                type="date"
                defaultValue={isoToDateInput(editing?.startsAt ?? null)}
                className="mt-1"
              />
            </label>
            <label className="text-sm font-semibold">
              End date
              <Input
                name="endsAt"
                type="date"
                defaultValue={isoToDateInput(editing?.endsAt ?? null)}
                className="mt-1"
                aria-invalid={Boolean(errors["session.endsAt"])}
              />
              <FieldError>{errors["session.endsAt"]}</FieldError>
            </label>
          </div>
          <RequestError>
            {mutation.isError
              ? normalizeApiError(mutation.error).message
              : undefined}
          </RequestError>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => setEditing(undefined)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save session"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !removal.isPending && setDeleting(null)}
        title="Delete session?"
        description={`Delete “${deleting?.name ?? "this session"}”? This cannot be undone and may be blocked if it is referenced.`}
      >
        <RequestError>
          {removal.isError
            ? normalizeApiError(removal.error).message
            : undefined}
        </RequestError>
        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={removal.isPending}
            onClick={() => setDeleting(null)}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-600"
            disabled={removal.isPending}
            onClick={() => void remove()}
          >
            {removal.isPending ? "Deleting…" : "Delete session"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
export default function WorkspaceSessionsPage({
  workspaceId,
}: {
  workspaceId: string;
}) {
  return (
    <WorkspaceChrome workspaceId={workspaceId}>
      {() => <Sessions workspaceId={workspaceId} />}
    </WorkspaceChrome>
  );
}
