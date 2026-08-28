"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import {
  FieldError,
  RequestError,
} from "@/features/workspace/components/FieldError";
import {
  useCalculatorResource,
  useCalculatorResourceMutations,
} from "../hooks";
import type { CalculatorSession, CalculatorTermOrLevel } from "../types";
import {
  normalizeDimension,
  parseMetadata,
  validateDimension,
  type CalculatorFieldErrors,
} from "../validation";

type Resource = "sessions" | "terms" | "levels";
type Item = CalculatorSession | CalculatorTermOrLevel;

const labels = {
  sessions: { singular: "session", plural: "Sessions" },
  terms: { singular: "term", plural: "Terms" },
  levels: { singular: "level", plural: "Levels" },
} as const;

export default function DimensionManager({
  calculatorId,
  resource,
}: {
  calculatorId: string;
  resource: Resource;
}) {
  const query = useCalculatorResource(calculatorId, resource);
  const mutations = useCalculatorResourceMutations(calculatorId, resource);
  const [editing, setEditing] = useState<Item | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [errors, setErrors] = useState<CalculatorFieldErrors>({});
  const locked = useRef(false);
  const mutation = editing?.id ? mutations.update : mutations.create;
  const copy = labels[resource];
  const withCode = resource !== "sessions";
  const items = useMemo(
    () =>
      [...(query.data ?? [])].sort(
        (left, right) =>
          (left.order ?? Number.MAX_SAFE_INTEGER) -
            (right.order ?? Number.MAX_SAFE_INTEGER) ||
          left.name.localeCompare(right.name),
      ),
    [query.data],
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || mutation.isPending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const metadata = parseMetadata(String(data.get("metadata") ?? ""));
    const input = normalizeDimension(
      {
        name: String(data.get("name") ?? ""),
        code: String(data.get("code") ?? ""),
        order: String(data.get("order") ?? ""),
        metadata: String(data.get("metadata") ?? ""),
      },
      withCode,
    );
    const next = validateDimension(input, copy.singular, metadata.error);
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
      if (editing?.id)
        await mutations.update.mutateAsync({
          resourceId: editing.id,
          input,
        });
      else await mutations.create.mutateAsync(input);
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
    <section aria-labelledby={`${resource}-heading`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id={`${resource}-heading`}
            className="font-display text-2xl font-semibold"
          >
            {copy.plural}
          </h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {resource === "terms"
              ? "Reusable Terms can be selected with any Session."
              : `Manage the calculator's ${copy.plural.toLocaleLowerCase()}.`}
          </p>
        </div>
        <Button
          onClick={() => {
            setErrors({});
            mutations.create.reset();
            setEditing(null);
          }}
        >
          <Plus size={15} /> Add {copy.singular}
        </Button>
      </div>
      {query.isPending && (
        <div className="mt-5 space-y-2">
          <p role="status" className="sr-only">
            Loading {copy.plural.toLocaleLowerCase()}…
          </p>
          <Skeleton className="h-16 rounded-none" />
          <Skeleton className="h-16 rounded-none" />
        </div>
      )}
      {query.isError && (
        <div
          role="alert"
          className="app-panel mt-5 border border-[var(--app-border)] p-5"
        >
          <p>{normalizeApiError(query.error).message}</p>
          <button
            className="focus-ring mt-3 text-xs font-semibold text-blue-600"
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
        </div>
      )}
      {!query.isPending && !query.isError && items.length === 0 && (
        <p className="app-panel mt-5 border border-dashed border-[var(--app-border)] p-10 text-center text-xs text-[var(--app-muted)]">
          No {copy.plural.toLocaleLowerCase()} yet.
        </p>
      )}
      {items.length > 0 && (
        <ul className="mt-5 grid border-l border-t border-[var(--app-border)] md:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="app-panel flex items-start gap-3 border-b border-r border-[var(--app-border)] p-5"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {withCode
                    ? "code" in item &&
                      typeof item.code === "string" &&
                      item.code
                      ? item.code
                      : "No code"
                    : "Academic session"}{" "}
                  · {item.order === null ? "Unordered" : `Order ${item.order}`}
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
                <Pencil size={15} />
              </button>
              <button
                className="app-icon-button text-red-600"
                aria-label={`Delete ${item.name}`}
                onClick={() => {
                  mutations.remove.reset();
                  setDeleting(item);
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
        title={editing ? `Edit ${copy.singular}` : `Add ${copy.singular}`}
        description={
          resource === "terms"
            ? "This Term is reusable across Sessions."
            : undefined
        }
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <label className="block text-sm font-semibold">
            Name
            <Input
              name="name"
              autoFocus
              defaultValue={editing?.name ?? ""}
              className="mt-1"
              aria-invalid={Boolean(errors[`${copy.singular}.name`])}
            />
            <FieldError>{errors[`${copy.singular}.name`]}</FieldError>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            {withCode && (
              <label className="text-sm font-semibold">
                Code{" "}
                <span className="font-normal text-[var(--app-muted)]">
                  (optional)
                </span>
                <Input
                  name="code"
                  defaultValue={
                    editing && "code" in editing ? (editing.code ?? "") : ""
                  }
                  className="mt-1"
                  aria-invalid={Boolean(errors[`${copy.singular}.code`])}
                />
                <FieldError>{errors[`${copy.singular}.code`]}</FieldError>
              </label>
            )}
            <label className="text-sm font-semibold">
              Order{" "}
              <span className="font-normal text-[var(--app-muted)]">
                (optional)
              </span>
              <Input
                name="order"
                type="number"
                min="0"
                step="1"
                defaultValue={editing?.order ?? ""}
                className="mt-1"
                aria-invalid={Boolean(errors[`${copy.singular}.order`])}
              />
              <FieldError>{errors[`${copy.singular}.order`]}</FieldError>
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
              aria-invalid={Boolean(errors[`${copy.singular}.metadata`])}
            />
            <FieldError>{errors[`${copy.singular}.metadata`]}</FieldError>
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
              {mutation.isPending ? "Saving…" : `Save ${copy.singular}`}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !mutations.remove.isPending && setDeleting(null)}
        title={`Delete ${copy.singular}?`}
        description={`Delete “${deleting?.name ?? `this ${copy.singular}`}”? Referenced Terms and Levels cannot be deleted.`}
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
            {mutations.remove.isPending
              ? "Deleting…"
              : `Delete ${copy.singular}`}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
