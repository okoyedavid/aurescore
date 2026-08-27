"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import WorkspaceChrome from "./components/WorkspaceChrome";
import { FieldError, RequestError } from "./components/FieldError";
import { useStudentMutations, useStudents } from "./records-hooks";
import { validateStudent, type RecordErrors } from "./records-validation";
import type { Student } from "./types";

function Students({ workspaceId }: { workspaceId: string }) {
  const query = useStudents(workspaceId);
  const mutations = useStudentMutations(workspaceId);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Student | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [errors, setErrors] = useState<RecordErrors>({});
  const locked = useRef(false);
  const mutation = editing?.id ? mutations.update : mutations.create;
  const students = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return (query.data ?? []).filter(
      (student) =>
        !needle ||
        student.name.toLocaleLowerCase().includes(needle) ||
        student.matricNumber?.toLocaleLowerCase().includes(needle),
    );
  }, [query.data, search]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || mutation.isPending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const matric = String(data.get("matricNumber") ?? "").trim();
    const input = {
      name: String(data.get("name") ?? "").trim(),
      matricNumber: matric || null,
    };
    const next = validateStudent(input);
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
        await mutations.update.mutateAsync({ id: editing.id, input });
      else await mutations.create.mutateAsync(input);
      setEditing(undefined);
    } catch {
    } finally {
      locked.current = false;
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Students</h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Students are workspace records and can participate in many
            offerings.
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
          Add student
        </Button>
      </div>
      <label className="relative mt-5 block max-w-md">
        <span className="sr-only">Search students</span>
        <Search
          className="absolute left-3 top-3.5 text-[var(--app-muted)]"
          size={18}
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or matric number"
          className="pl-10"
        />
      </label>
      {query.isPending && <Skeleton className="mt-5 h-52 rounded-none" />}
      <RequestError>
        {query.isError
          ? normalizeApiError(query.error).status === 404
            ? "These students do not exist or are not accessible."
            : normalizeApiError(query.error).message
          : undefined}
      </RequestError>
      {query.data?.length === 0 && (
        <div className="app-panel mt-5 border border-dashed border-[var(--app-border)] p-10 text-center">
          <p className="text-sm text-[var(--app-muted)]">
            No students yet. Add a student to prepare for result entry.
          </p>
        </div>
      )}
      {query.data && query.data.length > 0 && students.length === 0 && (
        <p className="mt-5 text-sm text-[var(--app-muted)]">
          No students match “{search}”.
        </p>
      )}
      <ul className="mt-5 divide-y divide-[var(--app-border)] overflow-hidden border border-[var(--app-border)]">
        {students.map((student) => (
          <li
            key={student.id}
            className="app-panel flex items-center gap-3 p-4"
          >
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{student.name}</h3>
              <p className="text-xs text-[var(--app-muted)]">
                {student.matricNumber || "No matric number"}
              </p>
            </div>
            <Link
              href={`/workspace/${encodeURIComponent(workspaceId)}/students/${encodeURIComponent(student.id)}/academic-record`}
              className="app-icon-button"
              aria-label={`Open academic record for ${student.name}`}
            >
              <BookOpen size={16} />
            </Link>
            <button
              className="app-icon-button"
              aria-label={`Edit ${student.name}`}
              onClick={() => {
                setErrors({});
                mutations.update.reset();
                setEditing(student);
              }}
            >
              <Pencil size={16} />
            </button>
            <button
              className="app-icon-button text-red-600"
              aria-label={`Delete ${student.name}`}
              onClick={() => {
                mutations.remove.reset();
                setDeleting(student);
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
        title={editing ? "Edit student" : "Add student"}
      >
        <form onSubmit={save} noValidate className="space-y-4">
          <label className="block text-sm font-semibold">
            Name
            <Input
              autoFocus
              name="name"
              defaultValue={editing?.name ?? ""}
              className="mt-1"
              aria-invalid={Boolean(errors.name)}
            />
            <FieldError>{errors.name}</FieldError>
          </label>
          <label className="block text-sm font-semibold">
            Matric number{" "}
            <span className="font-normal text-[var(--app-muted)]">
              (optional)
            </span>
            <Input
              name="matricNumber"
              defaultValue={editing?.matricNumber ?? ""}
              className="mt-1"
              aria-invalid={Boolean(errors.matricNumber)}
            />
            <FieldError>{errors.matricNumber}</FieldError>
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
              {mutation.isPending ? "Saving…" : "Save student"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !mutations.remove.isPending && setDeleting(null)}
        title="Delete student?"
        description={`Delete “${deleting?.name ?? "this student"}”? Students referenced by results are protected.`}
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
            onClick={async () => {
              if (!deleting) return;
              try {
                await mutations.remove.mutateAsync(deleting.id);
                setDeleting(null);
              } catch {}
            }}
          >
            {mutations.remove.isPending ? "Deleting…" : "Delete student"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export default function WorkspaceStudentsPage({
  workspaceId,
}: {
  workspaceId: string;
}) {
  return (
    <WorkspaceChrome workspaceId={workspaceId}>
      {() => <Students workspaceId={workspaceId} />}
    </WorkspaceChrome>
  );
}
