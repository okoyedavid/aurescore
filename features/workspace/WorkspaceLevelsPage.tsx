"use client";

import { FormEvent, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import WorkspaceChrome from "./components/WorkspaceChrome";
import { FieldError, RequestError } from "./components/FieldError";
import { useLevelMutations, useLevels } from "./hooks";
import type { LevelInput, WorkspaceLevel } from "./types";
import { normalizeLevel, validateLevel, type FieldErrors } from "./validation";

function parseMetadata(value: string): {
  value?: Record<string, unknown> | null;
  error?: string;
} {
  if (!value.trim()) return { value: null };
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? { value: parsed as Record<string, unknown> }
      : { error: "Metadata must be a JSON object." };
  } catch {
    return { error: "Metadata must be valid JSON." };
  }
}
function Levels({ workspaceId }: { workspaceId: string }) {
  const query = useLevels(workspaceId);
  const mutations = useLevelMutations(workspaceId);
  const [editing, setEditing] = useState<WorkspaceLevel | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<WorkspaceLevel | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const locked = useRef(false);
  const mutation = editing?.id ? mutations.update : mutations.create;
  const removal = mutations.remove;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || mutation.isPending) return;
    const data = new FormData(event.currentTarget);
    const input: LevelInput = normalizeLevel({
      name: String(data.get("name") ?? ""),
      code: String(data.get("code") ?? ""),
      order: String(data.get("order") ?? ""),
    });
    const metadata = parseMetadata(String(data.get("metadata") ?? ""));
    if (!metadata.error) input.metadata = metadata.value;
    const next = {
      ...validateLevel(input),
      ...(metadata.error ? { "level.metadata": metadata.error } : {}),
    };
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
        await mutations.update.mutateAsync({ levelId: editing.id, input });
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
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Levels</h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Ordered levels appear first.
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
          Add level
        </Button>
      </div>
      {query.isPending && <Skeleton className="mt-5 h-52 rounded-none" />}
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
          No levels yet.
        </p>
      )}
      <ul className="mt-5 grid border-l border-t border-[var(--app-border)] md:grid-cols-2">
        {query.data?.map((item) => (
          <li
            key={item.id}
            className="app-panel flex items-start gap-4 border-b border-r border-[var(--app-border)] p-5"
          >
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                {item.code || "No code"} ·{" "}
                {item.order === null ? "Unordered" : `Order ${item.order}`}
              </p>
            </div>
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
          </li>
        ))}
      </ul>
      <Dialog
        open={editing !== undefined}
        onClose={() => !mutation.isPending && setEditing(undefined)}
        title={editing ? "Edit level" : "Add level"}
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <label className="block text-sm font-semibold">
            Name
            <Input
              name="name"
              autoFocus
              defaultValue={editing?.name ?? ""}
              className="mt-1"
              aria-invalid={Boolean(errors["level.name"])}
            />
            <FieldError>{errors["level.name"]}</FieldError>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Code
              <Input
                name="code"
                defaultValue={editing?.code ?? ""}
                className="mt-1"
                aria-invalid={Boolean(errors["level.code"])}
              />
              <FieldError>{errors["level.code"]}</FieldError>
            </label>
            <label className="text-sm font-semibold">
              Order
              <Input
                name="order"
                type="number"
                min={0}
                step={1}
                defaultValue={editing?.order ?? ""}
                className="mt-1"
                aria-invalid={Boolean(errors["level.order"])}
              />
              <FieldError>{errors["level.order"]}</FieldError>
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Metadata{" "}
            <span className="font-normal text-[var(--app-muted)]">
              (JSON object, optional)
            </span>
            <Textarea
              name="metadata"
              rows={3}
              defaultValue={
                editing?.metadata
                  ? JSON.stringify(editing.metadata, null, 2)
                  : ""
              }
              className="mt-1 font-mono"
              aria-invalid={Boolean(errors["level.metadata"])}
            />
            <FieldError>{errors["level.metadata"]}</FieldError>
          </label>
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
              {mutation.isPending ? "Saving…" : "Save level"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !removal.isPending && setDeleting(null)}
        title="Delete level?"
        description={`Delete “${deleting?.name ?? "this level"}”? This may be blocked if it is referenced.`}
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
            {removal.isPending ? "Deleting…" : "Delete level"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
export default function WorkspaceLevelsPage({
  workspaceId,
}: {
  workspaceId: string;
}) {
  return (
    <WorkspaceChrome workspaceId={workspaceId}>
      {() => <Levels workspaceId={workspaceId} />}
    </WorkspaceChrome>
  );
}
