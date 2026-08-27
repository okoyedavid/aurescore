"use client";

import { FormEvent, useRef, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import WorkspaceChrome from "./components/WorkspaceChrome";
import { FieldError, RequestError } from "./components/FieldError";
import {
  useAssessmentSchemeMutations,
  useAssessmentSchemes,
} from "./records-hooks";
import { validateScheme, type RecordErrors } from "./records-validation";
import type { AssessmentComponent, AssessmentScheme } from "./types";

type EditorRow = AssessmentComponent & { rowId: number };
const finalOnly: AssessmentComponent[] = [
  { key: "total", label: "Final Score", maxScore: 100, weight: 100 },
];
const blank = (): AssessmentComponent => ({
  key: "",
  label: "",
  maxScore: 0,
  weight: 0,
});

function Schemes({ workspaceId }: { workspaceId: string }) {
  const query = useAssessmentSchemes(workspaceId);
  const mutations = useAssessmentSchemeMutations(workspaceId);
  const [editing, setEditing] = useState<AssessmentScheme | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<AssessmentScheme | null>(null);
  const [name, setName] = useState("");
  const [rows, setRows] = useState<EditorRow[]>([]);
  const [errors, setErrors] = useState<RecordErrors>({});
  const nextId = useRef(1);
  const locked = useRef(false);
  const mutation = editing?.id ? mutations.update : mutations.create;

  function open(
    source?: AssessmentScheme | null,
    forceName?: string,
    components?: AssessmentComponent[],
  ) {
    const values = components ?? source?.components ?? [blank()];
    setEditing(source ?? null);
    setName(forceName ?? source?.name ?? "");
    setRows(
      values.map((component) => ({ ...component, rowId: nextId.current++ })),
    );
    setErrors({});
    mutations.create.reset();
    mutations.update.reset();
  }

  function clone(source: AssessmentScheme) {
    open(null, `${source.name} copy`, source.components);
  }

  function cloneCurrent(source: AssessmentScheme) {
    open(
      null,
      `${source.name} copy`,
      rows.map((row) => ({
        key: row.key,
        label: row.label,
        maxScore: row.maxScore,
        weight: row.weight,
      })),
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || mutation.isPending) return;
    const input = {
      name: name.trim(),
      components: rows.map((row) => ({
        key: row.key.trim(),
        label: row.label.trim(),
        maxScore: row.maxScore,
        weight: row.weight,
      })),
    };
    const next = validateScheme(input);
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
      if (editing?.id) {
        const patch: Partial<typeof input> = {};
        if (input.name !== editing.name) patch.name = input.name;
        if (
          JSON.stringify(input.components) !==
          JSON.stringify(editing.components)
        ) {
          patch.components = input.components;
        }
        if (Object.keys(patch).length > 0) {
          await mutations.update.mutateAsync({ id: editing.id, input: patch });
        }
      } else {
        await mutations.create.mutateAsync(input);
      }
      setEditing(undefined);
    } catch {
    } finally {
      locked.current = false;
    }
  }

  const immutable =
    mutation.isError &&
    normalizeApiError(mutation.error).status === 409 &&
    Boolean(editing);
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            Assessment schemes
          </h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Reusable component definitions attached when result work begins.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => open(null, "Final Score Only", finalOnly)}
          >
            Final Score Only
          </Button>
          <Button onClick={() => open()}>
            <Plus size={16} />
            Create scheme
          </Button>
        </div>
      </div>
      {query.isPending && <Skeleton className="mt-5 h-52 rounded-none" />}
      {query.isError && (
        <RequestError>
          {normalizeApiError(query.error).status === 404
            ? "These assessment schemes do not exist or are not accessible."
            : normalizeApiError(query.error).message}
        </RequestError>
      )}
      {query.data?.length === 0 && (
        <div className="app-panel mt-5 border border-dashed border-[var(--app-border)] p-10 text-center">
          <p className="text-xs text-[var(--app-muted)]">
            No assessment schemes yet. Create one before entering results.
          </p>
        </div>
      )}
      <ul className="mt-5 grid border-l border-t border-[var(--app-border)] lg:grid-cols-2">
        {query.data?.map((scheme) => (
          <li
            key={scheme.id}
            className="app-panel border-b border-r border-[var(--app-border)] p-5"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{scheme.name}</h3>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {scheme.components.length} component
                  {scheme.components.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                className="app-icon-button"
                aria-label={`Clone ${scheme.name}`}
                onClick={() => clone(scheme)}
              >
                <Copy size={16} />
              </button>
              <button
                className="app-icon-button"
                aria-label={`Edit ${scheme.name}`}
                onClick={() => open(scheme)}
              >
                <Pencil size={16} />
              </button>
              <button
                className="app-icon-button text-red-600"
                aria-label={`Delete ${scheme.name}`}
                onClick={() => {
                  mutations.remove.reset();
                  setDeleting(scheme);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              {scheme.components.map((component) => (
                <div key={component.key} className="flex justify-between gap-4">
                  <dt>
                    {component.label}{" "}
                    <span className="text-[var(--app-muted)]">
                      ({component.key})
                    </span>
                  </dt>
                  <dd>
                    {component.maxScore} max · {component.weight}%
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <Dialog
        open={editing !== undefined}
        onClose={() => !mutation.isPending && setEditing(undefined)}
        title={editing ? "Edit assessment scheme" : "Create assessment scheme"}
        description="Weights across all components must total exactly 100%."
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <label className="block text-sm font-semibold">
            Scheme name
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              aria-invalid={Boolean(errors.name)}
            />
            <FieldError>{errors.name}</FieldError>
          </label>
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">Components</legend>
            {rows.map((row, index) => (
              <div
                key={row.rowId}
                className="rounded-sm border border-[var(--app-border)] p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Component {index + 1}
                  </span>
                  <button
                    type="button"
                    className="app-icon-button text-red-600"
                    aria-label={`Remove component ${index + 1}`}
                    disabled={rows.length === 1}
                    onClick={() =>
                      setRows((current) =>
                        current.filter((item) => item.rowId !== row.rowId),
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold">
                    Key
                    <Input
                      value={row.key}
                      onChange={(e) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.rowId === row.rowId
                              ? { ...item, key: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="mt-1"
                      aria-invalid={Boolean(errors[`components.${index}.key`])}
                    />
                    <FieldError>{errors[`components.${index}.key`]}</FieldError>
                  </label>
                  <label className="text-xs font-semibold">
                    Label
                    <Input
                      value={row.label}
                      onChange={(e) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.rowId === row.rowId
                              ? { ...item, label: e.target.value }
                              : item,
                          ),
                        )
                      }
                      className="mt-1"
                      aria-invalid={Boolean(
                        errors[`components.${index}.label`],
                      )}
                    />
                    <FieldError>
                      {errors[`components.${index}.label`]}
                    </FieldError>
                  </label>
                  <label className="text-xs font-semibold">
                    Maximum score
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={row.maxScore || ""}
                      onChange={(e) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.rowId === row.rowId
                              ? { ...item, maxScore: Number(e.target.value) }
                              : item,
                          ),
                        )
                      }
                      className="mt-1"
                      aria-invalid={Boolean(
                        errors[`components.${index}.maxScore`],
                      )}
                    />
                    <FieldError>
                      {errors[`components.${index}.maxScore`]}
                    </FieldError>
                  </label>
                  <label className="text-xs font-semibold">
                    Weight (%)
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.001"
                      value={row.weight || ""}
                      onChange={(e) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.rowId === row.rowId
                              ? { ...item, weight: Number(e.target.value) }
                              : item,
                          ),
                        )
                      }
                      className="mt-1"
                      aria-invalid={Boolean(
                        errors[`components.${index}.weight`],
                      )}
                    />
                    <FieldError>
                      {errors[`components.${index}.weight`]}
                    </FieldError>
                  </label>
                </div>
              </div>
            ))}
          </fieldset>
          <button
            type="button"
            className="focus-ring rounded text-sm font-semibold text-blue-600"
            disabled={rows.length >= 20}
            onClick={() =>
              setRows((current) => [
                ...current,
                { ...blank(), rowId: nextId.current++ },
              ])
            }
          >
            + Add component
          </button>
          <p
            aria-live="polite"
            className={`text-sm font-semibold ${errors.weightTotal ? "text-red-600" : "text-[var(--app-muted)]"}`}
          >
            Weight total:{" "}
            {rows
              .reduce((sum, row) => sum + (Number(row.weight) || 0), 0)
              .toFixed(3)
              .replace(/\.000$/, "")}
            %
          </p>
          <FieldError>{errors.weightTotal}</FieldError>
          <RequestError>
            {mutation.isError
              ? normalizeApiError(mutation.error).message
              : undefined}
          </RequestError>
          {immutable && editing && (
            <div className="rounded-sm border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <p>
                Results already use these components, so changing their
                historical meaning is protected. Renaming remains available.
              </p>
              <button
                type="button"
                className="focus-ring mt-2 rounded font-semibold underline"
                onClick={() => cloneCurrent(editing)}
              >
                Create a new scheme from these values
              </button>
            </div>
          )}
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
              {mutation.isPending ? "Saving…" : "Save scheme"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !mutations.remove.isPending && setDeleting(null)}
        title="Delete assessment scheme?"
        description={`Delete “${deleting?.name ?? "this scheme"}”? Schemes attached to offerings cannot be deleted.`}
      >
        <RequestError>
          {mutations.remove.isError
            ? normalizeApiError(mutations.remove.error).message
            : undefined}
        </RequestError>
        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setDeleting(null)}
            disabled={mutations.remove.isPending}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-600"
            disabled={mutations.remove.isPending}
            onClick={async () => {
              if (!deleting) return;
              try {
                await mutations.remove.mutateAsync(deleting.id);
                setDeleting(null);
              } catch {}
            }}
          >
            {mutations.remove.isPending ? "Deleting…" : "Delete scheme"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export default function WorkspaceAssessmentSchemesPage({
  workspaceId,
}: {
  workspaceId: string;
}) {
  return (
    <WorkspaceChrome workspaceId={workspaceId}>
      {() => <Schemes workspaceId={workspaceId} />}
    </WorkspaceChrome>
  );
}
