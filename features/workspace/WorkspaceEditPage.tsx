"use client";

import { FormEvent, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/FormField";
import { normalizeApiError } from "@/lib/api/errors";
import WorkspaceChrome from "./components/WorkspaceChrome";
import { FieldError, RequestError } from "./components/FieldError";
import { usePatchWorkspace } from "./hooks";
import type { CourseType, WorkspaceDetails } from "./types";
import {
  isoToDateInput,
  normalizeCourse,
  normalizeLevel,
  normalizeSession,
  validateCourse,
  validateLevel,
  validateSession,
  type FieldErrors,
} from "./validation";
import { buildWorkspacePatch, type WideValues } from "./wide-patch";

let newKey = 0;
const courseTypes: CourseType[] = [
  "COURSE",
  "SUBJECT",
  "PROGRAM",
  "MODULE",
  "CUSTOM",
];
function initial(workspace: WorkspaceDetails): WideValues {
  return {
    name: workspace.name,
    description: workspace.description ?? "",
    sessions: workspace.sessions.map((item) => ({
      key: item.id,
      id: item.id,
      name: item.name,
      startsAt: isoToDateInput(item.startsAt),
      endsAt: isoToDateInput(item.endsAt),
    })),
    levels: workspace.levels.map((item) => ({
      key: item.id,
      id: item.id,
      name: item.name,
      code: item.code ?? "",
      order: item.order === null ? "" : String(item.order),
    })),
    courses: workspace.courses.map((item) => ({
      key: item.id,
      id: item.id,
      name: item.name,
      code: item.code ?? "",
      type: item.type,
      defaultLevelId: item.defaultLevelId ?? "",
      defaultTermId: item.defaultTermId ?? "",
    })),
  };
}
function Editor({ workspace }: { workspace: WorkspaceDetails }) {
  const router = useRouter();
  const save = usePatchWorkspace(workspace.id);
  const [values, setValues] = useState(() => initial(workspace));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState("");
  const locked = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  function validate() {
    const next: FieldErrors = {};
    const name = values.name.trim();
    if (name.length < 2 || name.length > 80)
      next.name = "Workspace name must be between 2 and 80 characters.";
    if (values.description.trim().length > 500)
      next.description = "Description must be at most 500 characters.";
    values.sessions.forEach((row, index) =>
      Object.assign(
        next,
        validateSession(normalizeSession(row), `sessions.${index}`),
      ),
    );
    values.levels.forEach((row, index) =>
      Object.assign(
        next,
        validateLevel(normalizeLevel(row), `levels.${index}`),
      ),
    );
    values.courses.forEach((row, index) =>
      Object.assign(
        next,
        validateCourse(normalizeCourse(row), `courses.${index}`),
      ),
    );
    return next;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || save.isPending) return;
    const next = validate();
    setErrors(next);
    setNotice("");
    save.reset();
    if (Object.keys(next).length) {
      const key = Object.keys(next)[0];
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>(`[data-field="${key}"]`)
          ?.focus(),
      );
      return;
    }
    const patch = buildWorkspacePatch(workspace, values);
    if (!Object.keys(patch).length) {
      setNotice("There are no changes to save.");
      return;
    }
    locked.current = true;
    try {
      await save.mutateAsync(patch);
      router.replace(`/workspace/${encodeURIComponent(workspace.id)}`);
    } catch {
    } finally {
      locked.current = false;
    }
  }
  function removeNew(kind: "sessions" | "levels" | "courses", key: string) {
    setValues(
      (current) =>
        ({
          ...current,
          [kind]: current[kind].filter(
            (row: { key: string; id?: string }) => row.id || row.key !== key,
          ),
        }) as WideValues,
    );
  }
  return (
    <>
      <h2 className="font-display text-2xl font-semibold">
        Transactional wide edit
      </h2>
      <p className="mt-2 max-w-3xl text-xs text-[var(--app-muted)]">
        Save several intentional creates and updates as one atomic request.
        Existing rows are never deleted here; omitted fields and rows remain
        unchanged.
      </p>
      <form
        ref={formRef}
        onSubmit={submit}
        noValidate
        className="mt-6 space-y-8"
      >
        <section className="app-panel space-y-4 border border-[var(--app-border)] p-5 sm:p-6">
          <h3 className="font-display text-xl font-semibold">
            Workspace details
          </h3>
          <label className="block text-sm font-semibold">
            Name
            <Input
              data-field="name"
              value={values.name}
              onChange={(e) =>
                setValues((v) => ({ ...v, name: e.target.value }))
              }
              className="mt-1"
              aria-invalid={Boolean(errors.name)}
            />
            <FieldError>{errors.name}</FieldError>
          </label>
          <label className="block text-sm font-semibold">
            Description
            <Textarea
              data-field="description"
              value={values.description}
              onChange={(e) =>
                setValues((v) => ({ ...v, description: e.target.value }))
              }
              rows={3}
              className="mt-1"
              aria-invalid={Boolean(errors.description)}
            />
            <FieldError>{errors.description}</FieldError>
          </label>
        </section>
        <WideSection
          title="Sessions"
          onAdd={() =>
            setValues((v) => ({
              ...v,
              sessions: [
                ...v.sessions,
                { key: `new-${++newKey}`, name: "", startsAt: "", endsAt: "" },
              ],
            }))
          }
        >
          {values.sessions.map((row, index) => (
            <div
              key={row.key}
              className="rounded-sm border border-[var(--app-border)] p-4"
            >
              <RowHeading
                label={row.id ? "Existing session" : "New session"}
                isNew={!row.id}
                remove={
                  !row.id ? () => removeNew("sessions", row.key) : undefined
                }
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="text-sm">
                  Name
                  <Input
                    data-field={`sessions.${index}.name`}
                    value={row.name}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        sessions: v.sessions.map((item) =>
                          item.key === row.key
                            ? { ...item, name: e.target.value }
                            : item,
                        ),
                      }))
                    }
                    className="mt-1"
                    aria-invalid={Boolean(errors[`sessions.${index}.name`])}
                  />
                  <FieldError>{errors[`sessions.${index}.name`]}</FieldError>
                </label>
                {(["startsAt", "endsAt"] as const).map((field) => (
                  <label key={field} className="text-sm">
                    {field === "startsAt" ? "Start date" : "End date"}
                    <Input
                      data-field={`sessions.${index}.${field}`}
                      type="date"
                      value={row[field]}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          sessions: v.sessions.map((item) =>
                            item.key === row.key
                              ? { ...item, [field]: e.target.value }
                              : item,
                          ),
                        }))
                      }
                      className="mt-1"
                      aria-invalid={Boolean(
                        errors[`sessions.${index}.${field}`],
                      )}
                    />
                    <FieldError>
                      {errors[`sessions.${index}.${field}`]}
                    </FieldError>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </WideSection>
        <WideSection
          title="Levels"
          onAdd={() =>
            setValues((v) => ({
              ...v,
              levels: [
                ...v.levels,
                { key: `new-${++newKey}`, name: "", code: "", order: "" },
              ],
            }))
          }
        >
          {values.levels.map((row, index) => (
            <div
              key={row.key}
              className="rounded-sm border border-[var(--app-border)] p-4"
            >
              <RowHeading
                label={row.id ? "Existing level" : "New level"}
                isNew={!row.id}
                remove={
                  !row.id ? () => removeNew("levels", row.key) : undefined
                }
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {(["name", "code", "order"] as const).map((field) => (
                  <label key={field} className="text-sm">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                    <Input
                      data-field={`levels.${index}.${field}`}
                      type={field === "order" ? "number" : "text"}
                      min={field === "order" ? 0 : undefined}
                      value={row[field]}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          levels: v.levels.map((item) =>
                            item.key === row.key
                              ? { ...item, [field]: e.target.value }
                              : item,
                          ),
                        }))
                      }
                      className="mt-1"
                      aria-invalid={Boolean(errors[`levels.${index}.${field}`])}
                    />
                    <FieldError>
                      {errors[`levels.${index}.${field}`]}
                    </FieldError>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </WideSection>
        <WideSection
          title="Courses"
          onAdd={() =>
            setValues((v) => ({
              ...v,
              courses: [
                ...v.courses,
                {
                  key: `new-${++newKey}`,
                  name: "",
                  code: "",
                  type: "COURSE",
                  defaultLevelId: "",
                  defaultTermId: "",
                },
              ],
            }))
          }
        >
          {values.courses.map((row, index) => (
            <div
              key={row.key}
              className="rounded-sm border border-[var(--app-border)] p-4"
            >
              <RowHeading
                label={row.id ? "Existing course" : "New course"}
                isNew={!row.id}
                remove={
                  !row.id ? () => removeNew("courses", row.key) : undefined
                }
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="text-sm">
                  Name
                  <Input
                    data-field={`courses.${index}.name`}
                    value={row.name}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        courses: v.courses.map((item) =>
                          item.key === row.key
                            ? { ...item, name: e.target.value }
                            : item,
                        ),
                      }))
                    }
                    className="mt-1"
                    aria-invalid={Boolean(errors[`courses.${index}.name`])}
                  />
                  <FieldError>{errors[`courses.${index}.name`]}</FieldError>
                </label>
                <label className="text-sm">
                  Code
                  <Input
                    data-field={`courses.${index}.code`}
                    value={row.code}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        courses: v.courses.map((item) =>
                          item.key === row.key
                            ? { ...item, code: e.target.value }
                            : item,
                        ),
                      }))
                    }
                    className="mt-1"
                  />
                </label>
                <label className="text-sm">
                  Type
                  <Select
                    value={row.type}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        courses: v.courses.map((item) =>
                          item.key === row.key
                            ? { ...item, type: e.target.value as CourseType }
                            : item,
                        ),
                      }))
                    }
                    className="mt-1"
                  >
                    {courseTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </Select>
                </label>
                <label className="text-sm">
                  Default level
                  <Select
                    value={row.defaultLevelId}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        courses: v.courses.map((item) =>
                          item.key === row.key
                            ? { ...item, defaultLevelId: e.target.value }
                            : item,
                        ),
                      }))
                    }
                    className="mt-1"
                  >
                    <option value="">No default</option>
                    {workspace.levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="text-sm">
                  Default term
                  <Select
                    value={row.defaultTermId}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        courses: v.courses.map((item) =>
                          item.key === row.key
                            ? { ...item, defaultTermId: e.target.value }
                            : item,
                        ),
                      }))
                    }
                    className="mt-1"
                  >
                    <option value="">No default</option>
                    {workspace.terms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            </div>
          ))}
        </WideSection>
        {notice && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
          >
            {notice}
          </p>
        )}
        <RequestError>
          {save.isError ? normalizeApiError(save.error).message : undefined}
        </RequestError>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={save.isPending}
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving atomic update…" : "Save all changes"}
          </Button>
        </div>
      </form>
    </>
  );
}
function WideSection({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="app-panel border border-[var(--app-border)] p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <legend className="font-display text-xl font-semibold">{title}</legend>
        <button
          type="button"
          onClick={onAdd}
          className="focus-ring inline-flex items-center gap-2 rounded text-sm font-semibold text-blue-600"
        >
          <Plus size={15} />
          Add new
        </button>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </fieldset>
  );
}
function RowHeading({
  label,
  isNew,
  remove,
}: {
  label: string;
  isNew: boolean;
  remove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold">
        {label}{" "}
        {isNew && (
          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] uppercase text-blue-700">
            New
          </span>
        )}
      </p>
      {remove && (
        <button
          type="button"
          aria-label={`Remove ${label.toLowerCase()}`}
          onClick={remove}
          className="app-icon-button"
        >
          <Minus size={15} />
        </button>
      )}
    </div>
  );
}
export default function WorkspaceEditPage({
  workspaceId,
}: {
  workspaceId: string;
}) {
  return (
    <WorkspaceChrome workspaceId={workspaceId}>
      {(workspace) => (
        <Editor key={workspace.updatedAt} workspace={workspace} />
      )}
    </WorkspaceChrome>
  );
}
