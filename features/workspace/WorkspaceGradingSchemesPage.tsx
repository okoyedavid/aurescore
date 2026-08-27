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
import { useGradingSchemeMutations, useGradingSchemes } from "./records-hooks";
import {
  buildGradingSchemeInput,
  type GradingBandDraft,
  type RecordErrors,
  validateGradingSchemeDraft,
} from "./records-validation";
import type { GradingScheme } from "./types";

type EditorBand = GradingBandDraft & { rowId: number };
const blankBand = (): GradingBandDraft => ({
  label: "",
  minScore: "",
  gradePoint: "",
});
const commonFivePoint: GradingBandDraft[] = [
  { label: "A", minScore: "70", gradePoint: "5" },
  { label: "B", minScore: "60", gradePoint: "4" },
  { label: "C", minScore: "50", gradePoint: "3" },
  { label: "D", minScore: "45", gradePoint: "2" },
  { label: "E", minScore: "40", gradePoint: "1" },
  { label: "F", minScore: "0", gradePoint: "0" },
];

function Schemes({ workspaceId }: { workspaceId: string }) {
  const query = useGradingSchemes(workspaceId);
  const mutations = useGradingSchemeMutations(workspaceId);
  const [editing, setEditing] = useState<GradingScheme | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<GradingScheme | null>(null);
  const [name, setName] = useState("");
  const [maxGradePoint, setMaxGradePoint] = useState("");
  const [bands, setBands] = useState<EditorBand[]>([]);
  const [errors, setErrors] = useState<RecordErrors>({});
  const nextId = useRef(1);
  const locked = useRef(false);
  const mutation = editing?.id ? mutations.update : mutations.create;
  const liveErrors = validateGradingSchemeDraft({
    name,
    maxGradePoint,
    bands,
  });

  function rows(values: GradingBandDraft[]) {
    return values.map((band) => ({ ...band, rowId: nextId.current++ }));
  }

  function open(source?: GradingScheme | null, preset = false) {
    setEditing(source ?? null);
    setName(preset ? "Common 5-point scale" : (source?.name ?? ""));
    setMaxGradePoint(preset ? "5" : (source?.maxGradePoint ?? ""));
    setBands(
      rows(
        preset
          ? commonFivePoint
          : source
            ? source.bands.map((band) => ({
                label: band.label,
                minScore: String(band.minScore),
                gradePoint: String(band.gradePoint),
              }))
            : [blankBand()],
      ),
    );
    setErrors({});
    mutations.create.reset();
    mutations.update.reset();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || mutation.isPending) return;
    const form = event.currentTarget;
    const built = buildGradingSchemeInput({ name, maxGradePoint, bands });
    setErrors(built.errors);
    mutation.reset();
    if (Object.keys(built.errors).length) {
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      );
      return;
    }
    locked.current = true;
    try {
      if (editing?.id)
        await mutations.update.mutateAsync({
          id: editing.id,
          input: built.input,
        });
      else await mutations.create.mutateAsync(built.input);
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
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            Grading schemes
          </h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Map total-score boundaries to labels and grade points.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => open(null, true)}>
            Common 5-point scale
          </Button>
          <Button onClick={() => open()}>
            <Plus size={16} />
            Create scheme
          </Button>
        </div>
      </div>
      {query.isPending && <Skeleton className="mt-5 h-52 rounded-none" />}
      {query.isError && (
        <section
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
        </section>
      )}
      {query.data?.length === 0 && (
        <div className="app-panel mt-5 border border-dashed border-[var(--app-border)] p-10 text-center">
          <p className="text-xs text-[var(--app-muted)]">
            No grading schemes yet. Create one or start with the common scale.
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
                  {scheme.bands.length} band
                  {scheme.bands.length === 1 ? "" : "s"} · Maximum{" "}
                  {scheme.maxGradePoint ?? "not set"}
                </p>
              </div>
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
            <dl className="mt-4 divide-y divide-[var(--app-border)] border-t border-[var(--app-border)] text-xs">
              {scheme.bands.map((band) => (
                <div
                  key={`${band.label}-${band.minScore}`}
                  className="grid grid-cols-[1fr_auto_auto] gap-4 py-2"
                >
                  <dt className="font-semibold">{band.label}</dt>
                  <dd>From {band.minScore}</dd>
                  <dd>{band.gradePoint} pts</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <Dialog
        open={editing !== undefined}
        onClose={() => !mutation.isPending && setEditing(undefined)}
        title={editing ? "Edit grading scheme" : "Create grading scheme"}
        description="Bands are saved from the highest score boundary to the lowest."
        className="max-w-3xl!"
      >
        <form onSubmit={save} noValidate className="space-y-4">
          {Object.keys(errors).length > 0 && (
            <p
              role="alert"
              tabIndex={-1}
              className="border border-red-300 bg-red-50 p-3 text-xs text-red-700"
            >
              Please correct the highlighted grading scheme fields.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Scheme name
              <Input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1"
                aria-invalid={Boolean(errors.name)}
              />
              <FieldError>{errors.name}</FieldError>
            </label>
            <label className="block text-sm font-semibold">
              Maximum grade point{" "}
              <span className="font-normal text-[var(--app-muted)]">
                (optional)
              </span>
              <Input
                type="number"
                min="0"
                max="100000"
                step="0.01"
                value={maxGradePoint}
                onChange={(event) => setMaxGradePoint(event.target.value)}
                className="mt-1"
                aria-invalid={Boolean(errors.maxGradePoint)}
              />
              <FieldError>{errors.maxGradePoint}</FieldError>
            </label>
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Grade bands</legend>
            {bands.map((band, index) => (
              <div
                key={band.rowId}
                className="grid gap-3 border border-[var(--app-border)] p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-start"
              >
                {(
                  [
                    ["label", "Label", "text", undefined, undefined, undefined],
                    [
                      "minScore",
                      "Minimum score",
                      "number",
                      "0",
                      "100",
                      "0.001",
                    ],
                    [
                      "gradePoint",
                      "Grade point",
                      "number",
                      "0",
                      "100000",
                      "0.001",
                    ],
                  ] as const
                ).map(([field, label, type, min, max, step]) => (
                  <label key={field} className="text-xs font-semibold">
                    {label}
                    <Input
                      aria-label={`${label} ${index + 1}`}
                      type={type}
                      min={min}
                      max={max}
                      step={step}
                      value={band[field]}
                      onChange={(event) =>
                        setBands((current) =>
                          current.map((item) =>
                            item.rowId === band.rowId
                              ? { ...item, [field]: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="mt-1"
                      aria-invalid={Boolean(
                        errors[`bands.${index}.${field}`] ||
                          (field === "gradePoint" &&
                            liveErrors[`bands.${index}.${field}`]?.includes(
                              "exceed",
                            )),
                      )}
                    />
                    <FieldError>
                      {errors[`bands.${index}.${field}`] ??
                        (field === "gradePoint" &&
                        liveErrors[`bands.${index}.${field}`]?.includes(
                          "exceed",
                        )
                          ? liveErrors[`bands.${index}.${field}`]
                          : undefined)}
                    </FieldError>
                  </label>
                ))}
                <button
                  type="button"
                  className="app-icon-button mt-5 text-red-600"
                  aria-label={`Remove grade band ${index + 1}`}
                  disabled={bands.length === 1}
                  onClick={() =>
                    setBands((current) =>
                      current.filter((item) => item.rowId !== band.rowId),
                    )
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </fieldset>
          <button
            type="button"
            className="focus-ring text-xs font-semibold text-blue-600"
            disabled={bands.length >= 100}
            onClick={() =>
              setBands((current) => [
                ...current,
                { ...blankBand(), rowId: nextId.current++ },
              ])
            }
          >
            + Add grade band
          </button>
          <FieldError>{errors.bands ?? errors.zeroBoundary}</FieldError>
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
              {mutation.isPending ? "Saving…" : "Save grading scheme"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !mutations.remove.isPending && setDeleting(null)}
        title="Delete grading scheme?"
        description={`Delete “${deleting?.name ?? "this grading scheme"}”? Schemes used by course offerings cannot be deleted.`}
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
            {mutations.remove.isPending ? "Deleting…" : "Delete grading scheme"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export default function WorkspaceGradingSchemesPage({
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
