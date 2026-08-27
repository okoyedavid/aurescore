"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Select, Textarea } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import {
  FieldError,
  RequestError,
} from "@/features/workspace/components/FieldError";
import { useCalculatorCourseMutations, useCalculatorCourses } from "../hooks";
import type { CalculatorCourse, CalculatorTermOrLevel } from "../types";
import {
  normalizeCourse,
  parseMetadata,
  validateCourse,
  type CalculatorFieldErrors,
} from "../validation";

export default function CourseManager({
  calculatorId,
  terms,
  levels,
}: {
  calculatorId: string;
  terms: CalculatorTermOrLevel[];
  levels: CalculatorTermOrLevel[];
}) {
  const [levelId, setLevelId] = useState("");
  const [termId, setTermId] = useState("");
  const [search, setSearch] = useState("");
  const query = useCalculatorCourses(calculatorId, {
    ...(levelId ? { levelId } : {}),
    ...(termId ? { termId } : {}),
  });
  const mutations = useCalculatorCourseMutations(calculatorId);
  const [editing, setEditing] = useState<CalculatorCourse | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<CalculatorCourse | null>(null);
  const [errors, setErrors] = useState<CalculatorFieldErrors>({});
  const locked = useRef(false);
  const mutation = editing?.id ? mutations.update : mutations.create;
  const courses = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return (query.data ?? []).filter(
      (course) =>
        !needle ||
        course.name.toLocaleLowerCase().includes(needle) ||
        course.code?.toLocaleLowerCase().includes(needle),
    );
  }, [query.data, search]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || mutation.isPending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const metadataText = String(data.get("metadata") ?? "");
    const metadata = parseMetadata(metadataText);
    const input = normalizeCourse({
      name: String(data.get("name") ?? ""),
      code: String(data.get("code") ?? ""),
      levelId: String(data.get("levelId") ?? ""),
      termId: String(data.get("termId") ?? ""),
      creditUnits: String(data.get("creditUnits") ?? ""),
      order: String(data.get("order") ?? ""),
      metadata: metadataText,
    });
    const next = validateCourse(input, metadata.error);
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
        await mutations.update.mutateAsync({ courseId: editing.id, input });
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
    <section aria-labelledby="calculator-courses-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="calculator-courses-heading"
            className="font-display text-2xl font-semibold"
          >
            Courses and credit units
          </h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Course changes automatically unpublish the calculator until you
            review and publish it again.
          </p>
        </div>
        <Button
          onClick={() => {
            setErrors({});
            mutations.create.reset();
            setEditing(null);
          }}
        >
          <Plus size={15} /> Add Course
        </Button>
      </div>
      <div className="app-panel mt-5 grid gap-4 border border-[var(--app-border)] p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <label className="text-xs font-semibold">
          Level filter
          <Select
            value={levelId}
            onChange={(event) => setLevelId(event.target.value)}
            className="mt-1"
          >
            <option value="">All Levels</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs font-semibold">
          Term filter
          <Select
            value={termId}
            onChange={(event) => setTermId(event.target.value)}
            className="mt-1"
          >
            <option value="">All Terms</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs font-semibold">
          Search
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or code"
            className="mt-1"
          />
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={!levelId && !termId && !search}
          onClick={() => {
            setLevelId("");
            setTermId("");
            setSearch("");
          }}
        >
          Clear
        </Button>
      </div>
      {query.isPending && (
        <div>
          <p role="status" className="sr-only">
            Loading Courses…
          </p>
          <Skeleton className="mt-5 h-52 rounded-none" />
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
      {!query.isPending && !query.isError && courses.length === 0 && (
        <p className="app-panel mt-5 border border-dashed border-[var(--app-border)] p-10 text-center text-xs text-[var(--app-muted)]">
          {levelId || termId || search
            ? "No Courses match these filters."
            : "No Courses yet."}
        </p>
      )}
      {courses.length > 0 && (
        <ul className="mt-5 grid border-l border-t border-[var(--app-border)] md:grid-cols-2">
          {courses.map((course) => (
            <li
              key={course.id}
              className="app-panel flex items-start gap-3 border-b border-r border-[var(--app-border)] p-5"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{course.name}</h3>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {course.code || "No code"} · {course.creditUnits} credit units
                </p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {course.level?.name || "Any Level"} ·{" "}
                  {course.term?.name || "Any Term"}
                </p>
              </div>
              <button
                className="app-icon-button"
                aria-label={`Edit ${course.name}`}
                onClick={() => {
                  setErrors({});
                  mutations.update.reset();
                  setEditing(course);
                }}
              >
                <Pencil size={15} />
              </button>
              <button
                className="app-icon-button text-red-600"
                aria-label={`Delete ${course.name}`}
                onClick={() => {
                  mutations.remove.reset();
                  setDeleting(course);
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
        title={editing ? "Edit Course" : "Add Course"}
        description="Credit units are fixed for visitors and used by the backend calculation."
        className="max-w-2xl!"
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <label className="block text-sm font-semibold">
            Name
            <Input
              name="name"
              autoFocus
              defaultValue={editing?.name ?? ""}
              className="mt-1"
              aria-invalid={Boolean(errors["course.name"])}
            />
            <FieldError>{errors["course.name"]}</FieldError>
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
                aria-invalid={Boolean(errors["course.code"])}
              />
              <FieldError>{errors["course.code"]}</FieldError>
            </label>
            <label className="text-sm font-semibold">
              Credit units
              <Input
                name="creditUnits"
                type="number"
                min="0.001"
                step="0.001"
                defaultValue={editing?.creditUnits ?? ""}
                className="mt-1"
                aria-invalid={Boolean(errors["course.creditUnits"])}
              />
              <FieldError>{errors["course.creditUnits"]}</FieldError>
            </label>
            <label className="text-sm font-semibold">
              Level{" "}
              <span className="font-normal text-[var(--app-muted)]">
                (optional)
              </span>
              <Select
                name="levelId"
                defaultValue={editing?.levelId ?? ""}
                className="mt-1"
              >
                <option value="">Any Level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm font-semibold">
              Term{" "}
              <span className="font-normal text-[var(--app-muted)]">
                (optional)
              </span>
              <Select
                name="termId"
                defaultValue={editing?.termId ?? ""}
                className="mt-1"
              >
                <option value="">Any Term</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </Select>
            </label>
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
                aria-invalid={Boolean(errors["course.order"])}
              />
              <FieldError>{errors["course.order"]}</FieldError>
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
              aria-invalid={Boolean(errors["course.metadata"])}
            />
            <FieldError>{errors["course.metadata"]}</FieldError>
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
              {mutation.isPending ? "Saving…" : "Save Course"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !mutations.remove.isPending && setDeleting(null)}
        title="Delete Course?"
        description={`Delete “${deleting?.name ?? "this Course"}”? This configuration change may unpublish the calculator.`}
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
            {mutations.remove.isPending ? "Deleting…" : "Delete Course"}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
