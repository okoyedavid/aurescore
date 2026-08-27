"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import { FieldError, RequestError } from "./FieldError";
import { useTermMutations, useTerms } from "../hooks";
import type { Term, TermInput } from "../types";
import { normalizeTerm, validateTerm, type FieldErrors } from "../validation";

function parseMetadata(value: string) {
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

function patchFor(term: Term, input: TermInput): Partial<TermInput> {
  const patch: Partial<TermInput> = {};
  if (input.name !== term.name) patch.name = input.name;
  if ((input.code ?? null) !== term.code) patch.code = input.code ?? null;
  if ((input.order ?? null) !== term.order) patch.order = input.order ?? null;
  if (JSON.stringify(input.metadata ?? null) !== JSON.stringify(term.metadata))
    patch.metadata = input.metadata ?? null;
  return patch;
}

export default function TermsManager({ workspaceId }: { workspaceId: string }) {
  const query = useTerms(workspaceId);
  const mutations = useTermMutations(workspaceId);
  const [editing, setEditing] = useState<Term | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Term | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const locked = useRef(false);
  const mutation = editing?.id ? mutations.update : mutations.create;
  const terms = useMemo(
    () =>
      [...(query.data ?? [])].sort(
        (a, b) =>
          (a.order === null ? Number.MAX_SAFE_INTEGER : a.order) -
            (b.order === null ? Number.MAX_SAFE_INTEGER : b.order) ||
          a.name.localeCompare(b.name),
      ),
    [query.data],
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || mutation.isPending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = normalizeTerm({
      name: String(data.get("name") ?? ""),
      code: String(data.get("code") ?? ""),
      order: String(data.get("order") ?? ""),
    });
    const metadata = parseMetadata(String(data.get("metadata") ?? ""));
    if (!metadata.error) input.metadata = metadata.value;
    const next = {
      ...validateTerm(input),
      ...(metadata.error ? { "term.metadata": metadata.error } : {}),
    };
    setErrors(next);
    mutation.reset();
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      );
      return;
    }
    locked.current = true;
    try {
      if (editing?.id) {
        const patch = patchFor(editing, input);
        if (Object.keys(patch).length)
          await mutations.update.mutateAsync({
            termId: editing.id,
            input: patch,
          });
      } else await mutations.create.mutateAsync(input);
      setEditing(undefined);
    } catch {
    } finally {
      locked.current = false;
    }
  }

  async function remove() {
    if (!deleting || mutations.remove.isPending) return;
    try {
      await mutations.remove.mutateAsync(deleting.id);
      setDeleting(null);
    } catch {}
  }

  return (
    <section
      aria-labelledby="workspace-terms-heading"
      className="app-panel mt-8 border border-[var(--app-border)]"
    >
      <header className="flex items-start justify-between gap-4 border-b border-[var(--app-border)] p-5">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-blue-600">
            Reusable workspace resource
          </p>
          <h2
            id="workspace-terms-heading"
            className="font-display text-2xl font-semibold"
          >
            Terms
          </h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Use these terms with any academic session.
          </p>
        </div>
        <Button
          onClick={() => {
            setErrors({});
            mutations.create.reset();
            setEditing(null);
          }}
        >
          <Plus size={15} /> Add term
        </Button>
      </header>
      {query.isPending && (
        <div className="space-y-2 p-5" aria-label="Loading terms">
          <Skeleton className="h-16 rounded-none" />
          <Skeleton className="h-16 rounded-none" />
        </div>
      )}
      {query.isError && (
        <div className="p-5" role="alert">
          <p>{normalizeApiError(query.error).message}</p>
          <button
            className="focus-ring mt-3 text-xs font-semibold text-blue-600"
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
        </div>
      )}
      {!query.isPending && !query.isError && terms.length === 0 && (
        <p className="p-10 text-center text-xs text-[var(--app-muted)]">
          No workspace terms yet.
        </p>
      )}
      {terms.length > 0 && (
        <ul className="divide-y divide-[var(--app-border)]">
          {terms.map((term) => (
            <li key={term.id} className="flex items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{term.name}</h3>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {term.code || "No code"} ·{" "}
                  {term.order === null ? "Unordered" : `Order ${term.order}`}
                </p>
              </div>
              <button
                className="app-icon-button"
                aria-label={`Edit ${term.name}`}
                onClick={() => {
                  setErrors({});
                  mutations.update.reset();
                  setEditing(term);
                }}
              >
                <Pencil size={15} />
              </button>
              <button
                className="app-icon-button text-red-600"
                aria-label={`Delete ${term.name}`}
                onClick={() => {
                  mutations.remove.reset();
                  setDeleting(term);
                }}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Dialog
        open={editing !== undefined}
        onClose={() => !mutation.isPending && setEditing(undefined)}
        title={editing ? "Edit term" : "Add term"}
        description="Terms are reusable across every workspace session."
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <label className="block text-sm font-semibold">
            Name
            <Input
              name="name"
              autoFocus
              defaultValue={editing?.name ?? ""}
              className="mt-1"
              aria-invalid={Boolean(errors["term.name"])}
            />
            <FieldError>{errors["term.name"]}</FieldError>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Code{" "}
              <span className="font-normal text-[var(--app-muted)]">
                (optional)
              </span>
              <Input
                name="code"
                defaultValue={editing?.code ?? ""}
                className="mt-1"
                aria-invalid={Boolean(errors["term.code"])}
              />
              <FieldError>{errors["term.code"]}</FieldError>
            </label>
            <label className="text-sm font-semibold">
              Order{" "}
              <span className="font-normal text-[var(--app-muted)]">
                (optional)
              </span>
              <Input
                name="order"
                type="number"
                step="1"
                defaultValue={editing?.order ?? ""}
                className="mt-1"
                aria-invalid={Boolean(errors["term.order"])}
              />
              <FieldError>{errors["term.order"]}</FieldError>
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
              aria-invalid={Boolean(errors["term.metadata"])}
            />
            <FieldError>{errors["term.metadata"]}</FieldError>
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
              {mutation.isPending ? "Saving…" : "Save term"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !mutations.remove.isPending && setDeleting(null)}
        title="Delete term?"
        description={`Delete “${deleting?.name ?? "this term"}”? Deletion is blocked while offerings, course defaults, or academic summaries use it.`}
      >
        <RequestError>
          {mutations.remove.isError
            ? normalizeApiError(mutations.remove.error).message
            : undefined}
        </RequestError>
        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={mutations.remove.isPending}
            onClick={() => setDeleting(null)}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-600"
            disabled={mutations.remove.isPending}
            onClick={() => void remove()}
          >
            {mutations.remove.isPending ? "Deleting…" : "Delete term"}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
