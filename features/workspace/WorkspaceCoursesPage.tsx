"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Select, Textarea } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import WorkspaceChrome from "./components/WorkspaceChrome";
import { FieldError, RequestError } from "./components/FieldError";
import { useCourseMutations, useCourses, useLevels, useTerms } from "./hooks";
import type { CourseInput, CourseType, WorkspaceCourse } from "./types";
import {
  normalizeCourse,
  validateCourse,
  type FieldErrors,
} from "./validation";

const types: CourseType[] = [
  "COURSE",
  "SUBJECT",
  "PROGRAM",
  "MODULE",
  "CUSTOM",
];
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
function Courses({ workspaceId }: { workspaceId: string }) {
  const [levelId, setLevelId] = useState("");
  const [termId, setTermId] = useState("");
  const [search, setSearch] = useState("");
  const query = useCourses(workspaceId, {
    ...(levelId ? { levelId } : {}),
    ...(termId ? { termId } : {}),
  });
  const levels = useLevels(workspaceId);
  const terms = useTerms(workspaceId);
  const mutations = useCourseMutations(workspaceId);
  const [editing, setEditing] = useState<WorkspaceCourse | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<WorkspaceCourse | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const locked = useRef(false);
  const mutation = editing?.id ? mutations.update : mutations.create;
  const removal = mutations.remove;
  const visibleCourses = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return query.data ?? [];
    return (query.data ?? []).filter(
      (course) =>
        course.name.toLocaleLowerCase().includes(needle) ||
        course.code?.toLocaleLowerCase().includes(needle),
    );
  }, [query.data, search]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || mutation.isPending) return;
    const data = new FormData(event.currentTarget);
    const input: CourseInput = normalizeCourse({
      name: String(data.get("name") ?? ""),
      code: String(data.get("code") ?? ""),
      type: String(data.get("type") ?? "COURSE") as CourseType,
    });
    input.defaultLevelId = String(data.get("defaultLevelId") ?? "") || null;
    input.defaultTermId = String(data.get("defaultTermId") ?? "") || null;
    const metadata = parseMetadata(String(data.get("metadata") ?? ""));
    if (!metadata.error) input.metadata = metadata.value;
    const next = {
      ...validateCourse(input),
      ...(metadata.error ? { "course.metadata": metadata.error } : {}),
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
        await mutations.update.mutateAsync({ courseId: editing.id, input });
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
          <h2 className="font-display text-2xl font-semibold">Courses</h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Course offerings and results are outside this workspace setup.
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
          Add course
        </Button>
      </div>
      <section
        className="app-panel mt-5 grid gap-4 border border-[var(--app-border)] p-5 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
        aria-label="Course default filters"
      >
        <label className="text-sm font-semibold">
          Default level
          <Select
            value={levelId}
            onChange={(event) => setLevelId(event.target.value)}
            className="mt-1"
          >
            <option value="">All levels</option>
            {levels.data?.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-sm font-semibold">
          Default term
          <Select
            value={termId}
            onChange={(event) => setTermId(event.target.value)}
            className="mt-1"
          >
            <option value="">All terms</option>
            {terms.data?.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-sm font-semibold">
          Search courses
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
          Clear filters
        </Button>
      </section>
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
      {!query.isPending && !query.isError && visibleCourses.length === 0 && (
        <p className="app-panel mt-5 border border-dashed border-[var(--app-border)] p-10 text-center text-xs text-[var(--app-muted)]">
          {levelId || termId || search
            ? "No courses match these filters."
            : "No courses yet."}
        </p>
      )}
      <ul className="mt-5 grid border-l border-t border-[var(--app-border)] md:grid-cols-2">
        {visibleCourses.map((item) => (
          <li
            key={item.id}
            className="app-panel flex items-start gap-4 border-b border-r border-[var(--app-border)] p-5"
          >
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                {item.code || "No code"} · {item.type.toLowerCase()}
              </p>
              <p className="mt-2 text-xs text-[var(--app-muted)]">
                Defaults: {item.defaultLevel?.name ?? "No level"} ·{" "}
                {item.defaultTerm?.name ?? "No term"}
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
        title={editing ? "Edit course" : "Add course"}
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Default level{" "}
              <span className="font-normal text-[var(--app-muted)]">
                (optional)
              </span>
              <Select
                name="defaultLevelId"
                defaultValue={editing?.defaultLevelId ?? ""}
                className="mt-1"
              >
                <option value="">No default</option>
                {levels.data?.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </Select>
              <span className="mt-1 block text-xs font-normal text-[var(--app-muted)]">
                Prefills new offerings; it does not restrict this course.
              </span>
            </label>
            <label className="text-sm font-semibold">
              Default term{" "}
              <span className="font-normal text-[var(--app-muted)]">
                (optional)
              </span>
              <Select
                name="defaultTermId"
                defaultValue={editing?.defaultTermId ?? ""}
                className="mt-1"
              >
                <option value="">No default</option>
                {terms.data?.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </Select>
              <span className="mt-1 block text-xs font-normal text-[var(--app-muted)]">
                Prefills new offerings; it does not restrict this course.
              </span>
            </label>
          </div>
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
              Code
              <Input
                name="code"
                defaultValue={editing?.code ?? ""}
                className="mt-1"
                aria-invalid={Boolean(errors["course.code"])}
              />
              <FieldError>{errors["course.code"]}</FieldError>
            </label>
            <label className="text-sm font-semibold">
              Type
              <Select
                name="type"
                defaultValue={editing?.type ?? "COURSE"}
                className="mt-1"
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
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
              {mutation.isPending ? "Saving…" : "Save course"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !removal.isPending && setDeleting(null)}
        title="Delete course?"
        description={`Delete “${deleting?.name ?? "this course"}”? This may be blocked if it is referenced.`}
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
            {removal.isPending ? "Deleting…" : "Delete course"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
export default function WorkspaceCoursesPage({
  workspaceId,
}: {
  workspaceId: string;
}) {
  return (
    <WorkspaceChrome workspaceId={workspaceId}>
      {() => <Courses workspaceId={workspaceId} />}
    </WorkspaceChrome>
  );
}
