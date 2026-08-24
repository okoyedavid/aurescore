"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Select } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import WorkspaceChrome from "./components/WorkspaceChrome";
import { FieldError, RequestError } from "./components/FieldError";
import { useCourses, useLevels, useSessions } from "./hooks";
import {
  useAssessmentSchemes,
  useCourseOfferings,
  useResolveCourseOffering,
  useResultMutations,
  useResults,
  useStudents,
} from "./records-hooks";
import { buildScores, estimatedTotal } from "./records-validation";
import type {
  CourseOffering,
  ResultRecord,
  ResultStatus,
  Student,
} from "./types";

type Context = {
  sessionId: string;
  levelId: string;
  courseId: string;
  assessmentSchemeId: string;
  creditUnits: string;
};
const initialContext: Context = {
  sessionId: "",
  levelId: "",
  courseId: "",
  assessmentSchemeId: "",
  creditUnits: "",
};
type ScoreEditor = {
  student: Student;
  result?: ResultRecord;
  values: Record<string, string>;
  status: ResultStatus;
};

function EmptyLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      className="focus-ring rounded font-semibold text-blue-600"
      href={href}
    >
      {children}
    </Link>
  );
}

export function Results({ workspaceId }: { workspaceId: string }) {
  const base = `/workspace/${encodeURIComponent(workspaceId)}`;
  const sessions = useSessions(workspaceId);
  const levels = useLevels(workspaceId);
  const courses = useCourses(workspaceId);
  const schemes = useAssessmentSchemes(workspaceId);
  const students = useStudents(workspaceId);
  const offerings = useCourseOfferings(workspaceId);
  const results = useResults(workspaceId);
  const resolver = useResolveCourseOffering(workspaceId);
  const mutations = useResultMutations(workspaceId);
  const [context, setContext] = useState(initialContext);
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [editor, setEditor] = useState<ScoreEditor | null>(null);
  const [scoreErrors, setScoreErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<ResultRecord | null>(null);
  const [contextError, setContextError] = useState<string>();
  const locked = useRef(false);
  const offeringResults = useMemo(
    () =>
      (results.data ?? []).filter(
        (result) => result.courseOfferingId === offering?.id,
      ),
    [results.data, offering?.id],
  );
  const byStudent = useMemo(
    () => new Map(offeringResults.map((result) => [result.studentId, result])),
    [offeringResults],
  );
  const existingConflict = useMemo(
    () =>
      offerings.data?.find(
        (item) =>
          item.courseId === context.courseId &&
          item.sessionId === context.sessionId &&
          (item.levelId ?? "") === context.levelId,
      ),
    [context, offerings.data],
  );
  const unsaved = Boolean(
    editor && Object.values(editor.values).some((value) => value !== ""),
  );

  function changeContext(field: keyof Context, value: string) {
    if (
      unsaved &&
      !window.confirm(
        "Changing result context will discard unsaved scores. Continue?",
      )
    )
      return;
    setContext((current) => ({ ...current, [field]: value }));
    setEditor(null);
    setOffering(null);
    setContextError(undefined);
  }

  async function resolveOffering() {
    if (
      !context.sessionId ||
      !context.courseId ||
      !context.assessmentSchemeId ||
      resolver.isPending
    )
      return;
    const credit =
      context.creditUnits.trim() === "" ? null : Number(context.creditUnits);
    if (
      credit !== null &&
      (!Number.isFinite(credit) ||
        credit < 0 ||
        credit > 1000 ||
        (String(credit).split(".")[1]?.length ?? 0) > 3)
    ) {
      setContextError(
        "Credit units must be between 0 and 1000 with up to three decimal places.",
      );
      return;
    }
    setContextError(undefined);
    resolver.reset();
    try {
      setOffering(
        await resolver.mutateAsync({
          courseId: context.courseId,
          sessionId: context.sessionId,
          levelId: context.levelId || null,
          assessmentSchemeId: context.assessmentSchemeId,
          creditUnits: credit,
        }),
      );
    } catch {}
  }

  function openEditor(student: Student, result?: ResultRecord) {
    if (!offering) return;
    setScoreErrors({});
    mutations.create.reset();
    mutations.update.reset();
    setEditor({
      student,
      result,
      status: result?.status ?? "DRAFT",
      values: Object.fromEntries(
        offering.assessmentScheme.components.map((component) => [
          component.key,
          result ? String(result.scores[component.key] ?? "") : "",
        ]),
      ),
    });
  }

  async function saveResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !offering ||
      !editor ||
      locked.current ||
      mutations.create.isPending ||
      mutations.update.isPending
    )
      return;
    const built = buildScores(
      offering.assessmentScheme.components,
      editor.values,
    );
    setScoreErrors(built.errors);
    if (Object.keys(built.errors).length) {
      requestAnimationFrame(() =>
        event.currentTarget
          .querySelector<HTMLElement>("[aria-invalid='true']")
          ?.focus(),
      );
      return;
    }
    locked.current = true;
    try {
      if (editor.result)
        await mutations.update.mutateAsync({
          id: editor.result.id,
          input: { scores: built.scores, status: editor.status },
        });
      else
        await mutations.create.mutateAsync({
          courseOfferingId: offering.id,
          studentId: editor.student.id,
          scores: built.scores,
          status: editor.status,
        });
      setEditor(null);
    } catch {
    } finally {
      locked.current = false;
    }
  }

  const resolveError = resolver.isError
    ? normalizeApiError(resolver.error)
    : null;
  const mutation = editor?.result ? mutations.update : mutations.create;
  const estimateScores =
    editor && offering
      ? buildScores(offering.assessmentScheme.components, editor.values).scores
      : {};
  return (
    <>
      <div>
        <h2 className="font-display text-2xl font-semibold">Results</h2>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          Choose a session-specific context, then enter and review weighted
          component scores.
        </p>
      </div>
      <section
        aria-labelledby="result-context"
        className="app-panel mt-5 rounded-xl border border-[var(--app-border)] p-5"
      >
        <h3 id="result-context" className="font-semibold">
          Result context
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-semibold">
            1. Session
            <Select
              value={context.sessionId}
              onChange={(e) => changeContext("sessionId", e.target.value)}
              className="mt-1"
            >
              <option value="">Select session</option>
              {sessions.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-semibold">
            2. Level{" "}
            <span className="font-normal text-[var(--app-muted)]">
              (optional)
            </span>
            <Select
              value={context.levelId}
              onChange={(e) => changeContext("levelId", e.target.value)}
              className="mt-1"
            >
              <option value="">No level</option>
              {levels.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-semibold">
            3. Course
            <Select
              value={context.courseId}
              onChange={(e) => changeContext("courseId", e.target.value)}
              className="mt-1"
            >
              <option value="">Select course</option>
              {courses.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code ? `${item.code} — ` : ""}
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-semibold">
            4. Scheme
            <Select
              value={context.assessmentSchemeId}
              onChange={(e) =>
                changeContext("assessmentSchemeId", e.target.value)
              }
              className="mt-1"
            >
              <option value="">Select scheme</option>
              {schemes.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-semibold">
            5. Credit units{" "}
            <span className="font-normal text-[var(--app-muted)]">
              (optional)
            </span>
            <Input
              type="number"
              min="0"
              max="1000"
              step="0.001"
              value={context.creditUnits}
              onChange={(e) => changeContext("creditUnits", e.target.value)}
              className="mt-1"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => void resolveOffering()}
            disabled={
              !context.sessionId ||
              !context.courseId ||
              !context.assessmentSchemeId ||
              resolver.isPending
            }
          >
            {resolver.isPending ? "Opening…" : "Open result entry"}
          </Button>
          {sessions.data?.length === 0 && (
            <span className="text-sm">
              No sessions.{" "}
              <EmptyLink href={`${base}/sessions`}>Create a session</EmptyLink>.
            </span>
          )}
          {courses.data?.length === 0 && (
            <span className="text-sm">
              No courses.{" "}
              <EmptyLink href={`${base}/courses`}>Create a course</EmptyLink>.
            </span>
          )}
          {schemes.data?.length === 0 && (
            <span className="text-sm">
              No schemes.{" "}
              <EmptyLink href={`${base}/assessment-schemes`}>
                Create a scheme
              </EmptyLink>
              .
            </span>
          )}
        </div>
        <RequestError>
          {contextError ?? (resolveError ? resolveError.message : undefined)}
        </RequestError>
        {resolveError?.status === 409 && existingConflict && (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              This course, session, and level already use “
              {existingConflict.assessmentScheme.name}”. The scheme was not
              replaced.
            </p>
            <button
              className="focus-ring mt-2 rounded font-semibold underline"
              onClick={() => {
                setContext((current) => ({
                  ...current,
                  assessmentSchemeId: existingConflict.assessmentSchemeId,
                }));
                setOffering(existingConflict);
                resolver.reset();
              }}
            >
              Use the existing offering
            </button>
          </div>
        )}
      </section>
      {offering && (
        <section className="mt-6">
          <div className="app-panel rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <strong>
              {offering.course.code ? `${offering.course.code} — ` : ""}
              {offering.course.name}
            </strong>
            <span className="mx-2">·</span>
            {offering.session?.name ?? "Legacy offering"}
            <span className="mx-2">·</span>
            {offering.level?.name ?? "No level"}
            <span className="mx-2">·</span>
            {offering.assessmentScheme.name}
            {offering.creditUnits !== null && (
              <>
                <span className="mx-2">·</span>
                {offering.creditUnits} units
              </>
            )}
          </div>
          {students.isPending || results.isPending ? (
            <Skeleton className="mt-5 h-64 rounded-xl" />
          ) : students.data?.length === 0 ? (
            <div className="app-panel mt-5 rounded-xl border border-dashed border-[var(--app-border)] p-10 text-center text-sm text-[var(--app-muted)]">
              No students are available.{" "}
              <EmptyLink href={`${base}/students`}>Add students</EmptyLink>{" "}
              first.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--app-border)]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="app-panel">
                  <tr>
                    <th className="p-3">Student</th>
                    {offering.assessmentScheme.components.map((component) => (
                      <th key={component.key} className="p-3">
                        {component.label}
                        <span className="block text-xs font-normal text-[var(--app-muted)]">
                          /{component.maxScore}
                        </span>
                      </th>
                    ))}
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.data?.map((student) => {
                    const result = byStudent.get(student.id);
                    return (
                      <tr
                        key={student.id}
                        className="border-t border-[var(--app-border)]"
                      >
                        <th scope="row" className="p-3 font-medium">
                          {student.name}
                          <span className="block text-xs font-normal text-[var(--app-muted)]">
                            {student.matricNumber || "No matric number"}
                          </span>
                        </th>
                        {offering.assessmentScheme.components.map(
                          (component) => (
                            <td key={component.key} className="p-3">
                              {result?.scores[component.key] ?? "—"}
                            </td>
                          ),
                        )}
                        <td className="p-3 font-semibold">
                          {result?.totalScore ?? "—"}
                        </td>
                        <td className="p-3">
                          {result
                            ? result.status === "PUBLISHED"
                              ? "Published"
                              : "Draft"
                            : "Not entered"}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              className="app-icon-button"
                              aria-label={`${result ? "Edit" : "Enter"} result for ${student.name}`}
                              onClick={() => openEditor(student, result)}
                            >
                              <Pencil size={16} />
                            </button>
                            {result && (
                              <button
                                className="app-icon-button text-red-600"
                                aria-label={`Delete result for ${student.name}`}
                                onClick={() => {
                                  mutations.remove.reset();
                                  setDeleting(result);
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      <Dialog
        open={Boolean(editor)}
        onClose={() => !mutation.isPending && setEditor(null)}
        title={`${editor?.result ? "Edit" : "Enter"} result — ${editor?.student.name ?? "student"}`}
        description={
          offering
            ? `${offering.course.name} · ${offering.assessmentScheme.name}`
            : undefined
        }
      >
        <form onSubmit={saveResult} noValidate className="space-y-4">
          {offering?.assessmentScheme.components.map((component, index) => (
            <label key={component.key} className="block text-sm font-semibold">
              {component.label}{" "}
              <span className="font-normal text-[var(--app-muted)]">
                (0–{component.maxScore})
              </span>
              <Input
                autoFocus={index === 0}
                type="number"
                min="0"
                max={component.maxScore}
                step="any"
                value={editor?.values[component.key] ?? ""}
                onChange={(e) =>
                  setEditor((current) =>
                    current
                      ? {
                          ...current,
                          values: {
                            ...current.values,
                            [component.key]: e.target.value,
                          },
                        }
                      : current,
                  )
                }
                className="mt-1"
                aria-invalid={Boolean(scoreErrors[component.key])}
              />
              <FieldError>{scoreErrors[component.key]}</FieldError>
            </label>
          ))}
          <label className="block text-sm font-semibold">
            Status
            <Select
              value={editor?.status ?? "DRAFT"}
              onChange={(e) =>
                setEditor((current) =>
                  current
                    ? { ...current, status: e.target.value as ResultStatus }
                    : current,
                )
              }
              className="mt-1"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </Select>
          </label>
          {offering && editor && (
            <p className="text-sm text-[var(--app-muted)]">
              Estimated total:{" "}
              <strong>
                {estimatedTotal(
                  offering.assessmentScheme.components,
                  estimateScores,
                ).toFixed(3)}
              </strong>
              . The saved server total is authoritative.
            </p>
          )}
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
              onClick={() => setEditor(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save result"}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onClose={() => !mutations.remove.isPending && setDeleting(null)}
        title="Delete result?"
        description={`Delete the result for ${deleting?.student.name ?? "this student"}? This cannot be undone.`}
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
            {mutations.remove.isPending ? "Deleting…" : "Delete result"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export default function WorkspaceResultsPage({
  workspaceId,
}: {
  workspaceId: string;
}) {
  return (
    <WorkspaceChrome workspaceId={workspaceId}>
      {() => <Results workspaceId={workspaceId} />}
    </WorkspaceChrome>
  );
}
