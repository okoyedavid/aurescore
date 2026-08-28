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
import { useCourses, useLevels, useSessions, useTerms } from "./hooks";
import {
  useAssessmentSchemes,
  useCourseOfferings,
  useGradingSchemes,
  useResolveCourseOffering,
  useResultMutations,
  useResults,
  useStudents,
} from "./records-hooks";
import { buildScores } from "./records-validation";
import type {
  CourseOffering,
  ResultRecord,
  ResultOfferingContext,
  Student,
} from "./types";

type Context = {
  sessionId: string;
  termId: string;
  levelId: string;
  courseId: string;
  assessmentSchemeId: string;
  gradingSchemeId: string;
  creditUnits: string;
};
const initialContext: Context = {
  sessionId: "",
  termId: "",
  levelId: "",
  courseId: "",
  assessmentSchemeId: "",
  gradingSchemeId: "",
  creditUnits: "",
};
const contextParams: Record<keyof Context, string> = {
  sessionId: "session",
  termId: "term",
  levelId: "level",
  courseId: "course",
  assessmentSchemeId: "scheme",
  gradingSchemeId: "grading",
  creditUnits: "units",
};
type ScoreEditor = {
  student: Student;
  result?: ResultRecord;
  values: Record<string, string>;
};

function offeringContextText(context: ResultOfferingContext) {
  return [
    context.course.code || context.course.name,
    context.session.name,
    context.term?.name,
    context.level?.name,
    context.assessmentScheme?.name,
    context.gradingScheme?.name,
    context.creditUnits !== null ? `${context.creditUnits} units` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

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

export function Results({
  workspaceId,
  initialSelection = initialContext,
  initialOfferingId = "",
  initialStudentId = "",
}: {
  workspaceId: string;
  initialSelection?: Context;
  initialOfferingId?: string;
  initialStudentId?: string;
}) {
  const base = `/workspace/${encodeURIComponent(workspaceId)}`;
  const [context, setContext] = useState(initialSelection);
  const [termUsesCourseDefault, setTermUsesCourseDefault] = useState(false);
  const [levelUsesCourseDefault, setLevelUsesCourseDefault] = useState(false);
  const [termIsExplicit, setTermIsExplicit] = useState(
    Boolean(initialSelection.termId),
  );
  const [levelIsExplicit, setLevelIsExplicit] = useState(
    Boolean(initialSelection.levelId),
  );
  const sessions = useSessions(workspaceId);
  const terms = useTerms(workspaceId);
  const levels = useLevels(workspaceId);
  const courses = useCourses(workspaceId);
  const schemes = useAssessmentSchemes(workspaceId);
  const gradingSchemes = useGradingSchemes(workspaceId);
  const students = useStudents(workspaceId);
  const offerings = useCourseOfferings(workspaceId);
  const results = useResults(workspaceId);
  const resolver = useResolveCourseOffering(workspaceId);
  const mutations = useResultMutations(workspaceId);
  const [offering, setOffering] = useState<CourseOffering | null>(null);
  const [editor, setEditor] = useState<ScoreEditor | null>(null);
  const [scoreErrors, setScoreErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<ResultRecord | null>(null);
  const [contextError, setContextError] = useState<string>();
  const locked = useRef(false);
  const selectedTermId = context.termId;
  const components = offering?.assessmentScheme?.components ?? [];
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
          (item.termId ?? "") === selectedTermId &&
          (item.levelId ?? "") === context.levelId,
      ),
    [
      context.courseId,
      context.levelId,
      context.sessionId,
      offerings.data,
      selectedTermId,
    ],
  );
  const requestedOffering =
    offerings.data?.find((item) => item.id === initialOfferingId) ??
    existingConflict;
  const unsaved = Boolean(
    editor && Object.values(editor.values).some((value) => value !== ""),
  );

  function changeContext(field: keyof Context, value: string) {
    if (
      unsaved &&
      !window.confirm(
        "Changing this selection will discard unsaved scores. Continue?",
      )
    )
      return;
    const selectedCourse =
      field === "courseId"
        ? courses.data?.find((course) => course.id === value)
        : undefined;
    const next = {
      ...context,
      [field]: value,
      ...(field === "courseId" && !termIsExplicit
        ? { termId: selectedCourse?.defaultTermId ?? "" }
        : {}),
      ...(field === "courseId" && !levelIsExplicit
        ? { levelId: selectedCourse?.defaultLevelId ?? "" }
        : {}),
    };
    if (field === "termId") {
      setTermUsesCourseDefault(false);
      setTermIsExplicit(true);
    }
    if (field === "levelId") {
      setLevelUsesCourseDefault(false);
      setLevelIsExplicit(true);
    }
    if (field === "courseId") {
      setTermUsesCourseDefault(
        Boolean(!termIsExplicit && selectedCourse?.defaultTermId),
      );
      setLevelUsesCourseDefault(
        Boolean(!levelIsExplicit && selectedCourse?.defaultLevelId),
      );
    }
    const url = new URL(window.location.href);
    const param = contextParams[field];
    if (value) url.searchParams.set(param, value);
    else url.searchParams.delete(param);
    if (field === "courseId") {
      if (next.termId) url.searchParams.set(contextParams.termId, next.termId);
      if (next.levelId)
        url.searchParams.set(contextParams.levelId, next.levelId);
    }
    window.history.replaceState(null, "", url);
    setContext(next);
    setEditor(null);
    setOffering(null);
    setContextError(undefined);
  }

  async function resolveOffering() {
    const assessmentSchemeId =
      context.assessmentSchemeId || requestedOffering?.assessmentSchemeId || "";
    if (
      !context.sessionId ||
      !context.courseId ||
      !assessmentSchemeId ||
      resolver.isPending
    )
      return;
    const credit = context.creditUnits.trim()
      ? Number(context.creditUnits)
      : null;
    if (
      credit !== null &&
      (!Number.isFinite(credit) ||
        credit < 0 ||
        credit > 1000 ||
        (context.creditUnits.trim().split(".")[1]?.length ?? 0) > 3)
    ) {
      setContextError(
        "Credit units must be between 0 and 1000 with up to three decimal places.",
      );
      return;
    }
    setContextError(undefined);
    resolver.reset();
    try {
      const resolved = await resolver.mutateAsync({
        courseId: context.courseId,
        sessionId: context.sessionId,
        ...(termUsesCourseDefault ? {} : { termId: selectedTermId || null }),
        ...(levelUsesCourseDefault ? {} : { levelId: context.levelId || null }),
        assessmentSchemeId,
        gradingSchemeId:
          context.gradingSchemeId || requestedOffering?.gradingSchemeId || null,
        creditUnits:
          credit ??
          (requestedOffering?.creditUnits === null ||
          requestedOffering?.creditUnits === undefined
            ? null
            : Number(requestedOffering.creditUnits)),
      });
      if (!resolved.assessmentScheme) {
        setContextError(
          "Choose an assessment scheme before entering results for this course.",
        );
        setOffering(null);
        return;
      }
      setOffering(resolved);
      setContext((current) => ({
        ...current,
        termId: resolved.termId ?? "",
        levelId: resolved.levelId ?? "",
        assessmentSchemeId: resolved.assessmentSchemeId ?? "",
        gradingSchemeId: resolved.gradingSchemeId ?? "",
        creditUnits: resolved.creditUnits ?? "",
      }));
      setTermUsesCourseDefault(false);
      setLevelUsesCourseDefault(false);
      setTermIsExplicit(true);
      setLevelIsExplicit(true);
      const requestedStudent = students.data?.find(
        (student) => student.id === initialStudentId,
      );
      if (requestedStudent)
        openEditor(
          requestedStudent,
          (results.data ?? []).find(
            (result) =>
              result.courseOfferingId === resolved.id &&
              result.studentId === requestedStudent.id,
          ),
          resolved,
        );
    } catch {}
  }

  function openEditor(
    student: Student,
    result?: ResultRecord,
    selectedOffering = offering,
  ) {
    if (!selectedOffering?.assessmentScheme) return;
    setScoreErrors({});
    mutations.create.reset();
    mutations.update.reset();
    setEditor({
      student,
      result,
      values: Object.fromEntries(
        selectedOffering.assessmentScheme.components.map((component) => [
          component.key,
          result ? String(result.scores[component.key] ?? "") : "",
        ]),
      ),
    });
  }

  async function saveResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (
      !offering?.assessmentScheme ||
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
        form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      );
      return;
    }
    locked.current = true;
    try {
      if (editor.result)
        await mutations.update.mutateAsync({
          id: editor.result.id,
          input: { scores: built.scores },
        });
      else
        await mutations.create.mutateAsync({
          courseOfferingId: offering.id,
          studentId: editor.student.id,
          scores: built.scores,
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
  return (
    <>
      <div>
        <h2 className="font-display text-2xl font-semibold">Results</h2>
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          Choose a course and enter student scores.
        </p>
      </div>
      <section
        aria-labelledby="result-context"
        className="app-panel mt-5 border border-[var(--app-border)] p-5"
      >
        <h3 id="result-context" className="font-semibold">
          Result details
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            2. Term{" "}
            <span className="font-normal text-[var(--app-muted)]">
              (optional)
            </span>
            <Select
              value={selectedTermId}
              onChange={(e) => changeContext("termId", e.target.value)}
              className="mt-1"
              disabled={terms.isPending}
            >
              <option value="">No term</option>
              {terms.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-semibold">
            3. Level{" "}
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
            4. Course
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
            5. Assessment scheme
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
            6. Grading scheme{" "}
            <span className="font-normal text-[var(--app-muted)]">
              (optional)
            </span>
            <Select
              value={context.gradingSchemeId}
              onChange={(e) => changeContext("gradingSchemeId", e.target.value)}
              className="mt-1"
            >
              <option value="">No grading scheme</option>
              {gradingSchemes.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm font-semibold">
            7. Credit units{" "}
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
              !(
                context.assessmentSchemeId ||
                requestedOffering?.assessmentSchemeId
              ) ||
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
          {contextError ??
            (terms.isError
              ? normalizeApiError(terms.error).message
              : resolveError
                ? resolveError.message
                : undefined)}
        </RequestError>
        {resolveError?.status === 409 && existingConflict?.assessmentScheme && (
          <div className="mt-3 rounded-sm border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              This course, session, and level already use “
              {existingConflict.assessmentScheme.name}”. The scheme was not
              replaced.
            </p>
            <button
              className="focus-ring mt-2 rounded font-semibold underline"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set(
                  contextParams.assessmentSchemeId,
                  existingConflict.assessmentSchemeId ?? "",
                );
                if (existingConflict.gradingSchemeId)
                  url.searchParams.set(
                    contextParams.gradingSchemeId,
                    existingConflict.gradingSchemeId,
                  );
                else url.searchParams.delete(contextParams.gradingSchemeId);
                window.history.replaceState(null, "", url);
                setContext((current) => ({
                  ...current,
                  assessmentSchemeId: existingConflict.assessmentSchemeId ?? "",
                  gradingSchemeId: existingConflict.gradingSchemeId ?? "",
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
      {offering?.assessmentScheme && (
        <section className="mt-6">
          <div className="app-panel border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <strong>
              {offering.course.code ? `${offering.course.code} — ` : ""}
              {offering.course.name}
            </strong>
            <span className="mx-2">·</span>
            {offering.session.name}
            {offering.term && (
              <>
                <span className="mx-2">·</span>
                {offering.term.name}
              </>
            )}
            {offering.level && (
              <>
                <span className="mx-2">·</span>
                {offering.level.name}
              </>
            )}
            <span className="mx-2">·</span>
            {offering.assessmentScheme.name}
            {offering.gradingScheme && (
              <>
                <span className="mx-2">·</span>
                {offering.gradingScheme.name}
              </>
            )}
            {offering.creditUnits !== null && (
              <>
                <span className="mx-2">·</span>
                {offering.creditUnits} units
              </>
            )}
          </div>
          {students.isPending || results.isPending ? (
            <Skeleton className="mt-5 h-64 rounded-none" />
          ) : students.data?.length === 0 ? (
            <div className="app-panel mt-5 border border-dashed border-[var(--app-border)] p-10 text-center text-xs text-[var(--app-muted)]">
              No students are available.{" "}
              <EmptyLink href={`${base}/students`}>Add students</EmptyLink>{" "}
              first.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto border border-[var(--app-border)]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="app-panel">
                  <tr>
                    <th className="p-3">Student</th>
                    {components.map((component) => (
                      <th key={component.key} className="p-3">
                        {component.label}
                        <span className="block text-xs font-normal text-[var(--app-muted)]">
                          /{component.maxScore}
                        </span>
                      </th>
                    ))}
                    <th className="p-3">Total</th>
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
                          {result?.courseOffering && (
                            <span className="mt-1 block max-w-sm text-[10px] font-normal leading-relaxed text-[var(--app-muted)]">
                              {offeringContextText(result.courseOffering)}
                            </span>
                          )}
                        </th>
                        {components.map((component) => (
                          <td key={component.key} className="p-3">
                            {result?.scores[component.key] ?? "—"}
                          </td>
                        ))}
                        <td className="p-3 font-semibold">
                          {result?.totalScore ?? "—"}
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
          offering?.assessmentScheme
            ? `${offering.course.name} · ${offering.assessmentScheme.name}`
            : undefined
        }
      >
        <form onSubmit={saveResult} noValidate className="space-y-4">
          {offering?.assessmentScheme?.components.map((component, index) => (
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
          <p className="text-sm text-[var(--app-muted)]">
            Enter every score before saving. The total is calculated
            automatically.
          </p>
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
        description={`Delete ${deleting?.student.name ?? "this student"}'s result for ${deleting?.courseOffering.course.name ?? "this course"}? This cannot be undone.`}
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
                await mutations.remove.mutateAsync({
                  id: deleting.id,
                  studentId: deleting.studentId,
                });
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
  initialSelection,
  initialOfferingId,
  initialStudentId,
}: {
  workspaceId: string;
  initialSelection?: Context;
  initialOfferingId?: string;
  initialStudentId?: string;
}) {
  return (
    <WorkspaceChrome workspaceId={workspaceId}>
      {() => (
        <Results
          workspaceId={workspaceId}
          initialSelection={initialSelection}
          initialOfferingId={initialOfferingId}
          initialStudentId={initialStudentId}
        />
      )}
    </WorkspaceChrome>
  );
}
