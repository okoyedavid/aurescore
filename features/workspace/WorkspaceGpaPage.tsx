"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, Search } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Select } from "@/components/ui/FormField";
import { normalizeApiError } from "@/lib/api/errors";
import WorkspaceChrome from "./components/WorkspaceChrome";
import { FieldError, RequestError } from "./components/FieldError";
import { useLevels, useSessions, useTerms } from "./hooks";
import {
  useAcademicRevision,
  useAssessmentSchemes,
  useCalculateGpa,
  useGradingSchemes,
  useSaveBatchGpa,
  useSaveGpa,
  useStudents,
  useUpdateCourseOfferingConfiguration,
} from "./records-hooks";
import type {
  BatchGpaResponse,
  GpaPreflightResponse,
  GpaScope,
  GpaScopeInput,
  GpaScreenState,
  IncompleteStudent,
  MissingOfferingConfiguration,
  SaveBatchGpaInput,
  SaveGpaInput,
  SavedAcademicSummary,
  SingleStudentGpaResponse,
  UpdateCourseOfferingConfigurationInput,
} from "./types";

type GpaMode = "single" | "batch";
export type GpaInitialSelection = {
  sessionId: string;
  termId: string;
  levelId: string;
  studentId: string;
  mode: GpaMode;
};

type ScopeDraft = Omit<GpaInitialSelection, "mode">;
type RemediationDraft = {
  assessmentSchemeId: string;
  creditUnits: string;
  gradingSchemeId: string;
};
type RemediationErrors = Partial<RemediationDraft>;

const emptySelection: GpaInitialSelection = {
  sessionId: "",
  termId: "",
  levelId: "",
  studentId: "",
  mode: "single",
};

export function buildGpaScopeInput(
  draft: ScopeDraft,
  mode: GpaMode,
): GpaScopeInput {
  return {
    sessionId: draft.sessionId,
    ...(draft.termId ? { termId: draft.termId } : {}),
    ...(draft.levelId ? { levelId: draft.levelId } : {}),
    ...(mode === "single" && draft.studentId
      ? { studentId: draft.studentId }
      : {}),
  };
}

function saveScope(scope: GpaScope, studentId: string): SaveGpaInput;
function saveScope(scope: GpaScope): SaveBatchGpaInput;
function saveScope(
  scope: GpaScope,
  studentId?: string,
): SaveGpaInput | SaveBatchGpaInput {
  return {
    ...(studentId ? { studentId } : {}),
    sessionId: scope.sessionId,
    ...(scope.termId ? { termId: scope.termId } : {}),
    ...(scope.levelId ? { levelId: scope.levelId } : {}),
  };
}

function decimal(value: string | null) {
  return value ?? "Not available";
}

function calculatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function validCreditUnits(value: string) {
  if (!/^\d+(?:\.\d{1,3})?$/.test(value.trim())) return false;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0.001 && number <= 1000;
}

function courseName(item: MissingOfferingConfiguration) {
  return item.courseCode
    ? `${item.courseCode} — ${item.courseName}`
    : item.courseName;
}

function ScopeLabel({
  scope,
  sessionName,
  termName,
  levelName,
}: {
  scope: GpaScope;
  sessionName: string;
  termName?: string;
  levelName?: string;
}) {
  return (
    <p className="mt-1 text-xs text-[var(--app-muted)]">
      {sessionName || scope.sessionId}
      {scope.termId ? ` · ${termName || scope.termId}` : " · All terms"}
      {scope.levelId ? ` · ${levelName || scope.levelId}` : ""}
    </p>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-panel border-b border-r border-[var(--app-border)] p-4">
      <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--app-muted)]">
        {label}
      </dt>
      <dd className="mt-2 font-display text-2xl font-semibold">{value}</dd>
    </div>
  );
}

function CourseAudit({ response }: { response: SingleStudentGpaResponse }) {
  if (response.courses.length === 0)
    return (
      <p className="mt-5 border border-dashed border-[var(--app-border)] p-8 text-center text-xs text-[var(--app-muted)]">
        No course results are available for this selection.
      </p>
    );
  return (
    <>
      <div className="mt-5 hidden overflow-x-auto border border-[var(--app-border)] md:block">
        <table className="w-full min-w-[850px] text-left text-xs">
          <caption className="sr-only">Course GPA audit</caption>
          <thead className="app-panel">
            <tr>
              <th className="p-3">Course</th>
              <th className="p-3">Total score</th>
              <th className="p-3">Grade</th>
              <th className="p-3">Grade point</th>
              <th className="p-3">Credit units</th>
              <th className="p-3">Quality points</th>
            </tr>
          </thead>
          <tbody>
            {response.courses.map((course) => (
              <tr
                key={course.courseOfferingId}
                className="border-t border-[var(--app-border)]"
              >
                <th scope="row" className="p-3 font-semibold">
                  {course.courseCode ? `${course.courseCode} — ` : ""}
                  {course.courseName}
                </th>
                <td className="p-3">{course.totalScore}</td>
                <td className="p-3">{course.grade}</td>
                <td className="p-3">{course.gradePoint}</td>
                <td className="p-3">{course.creditUnits}</td>
                <td className="p-3">{course.qualityPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-5 divide-y divide-[var(--app-border)] border border-[var(--app-border)] md:hidden">
        {response.courses.map((course) => (
          <li key={course.courseOfferingId} className="app-panel p-4">
            <h4 className="font-semibold">
              {course.courseCode ? `${course.courseCode} — ` : ""}
              {course.courseName}
            </h4>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <dt className="text-[var(--app-muted)]">Total score</dt>
                <dd>{course.totalScore}</dd>
              </div>
              <div>
                <dt className="text-[var(--app-muted)]">Grade</dt>
                <dd>{course.grade}</dd>
              </div>
              <div>
                <dt className="text-[var(--app-muted)]">Grade point</dt>
                <dd>{course.gradePoint}</dd>
              </div>
              <div>
                <dt className="text-[var(--app-muted)]">Credit units</dt>
                <dd>{course.creditUnits}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[var(--app-muted)]">Quality points</dt>
                <dd>{course.qualityPoints}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

function resultEntryHref(
  workspaceId: string,
  scope: GpaScope,
  studentId: string,
  courseOfferingId: string,
  courseId: string,
) {
  const params = new URLSearchParams({
    session: scope.sessionId,
    course: courseId,
    offering: courseOfferingId,
    student: studentId,
  });
  if (scope.termId) params.set("term", scope.termId);
  if (scope.levelId) params.set("level", scope.levelId);
  return `/workspace/${encodeURIComponent(workspaceId)}/results?${params.toString()}`;
}

function IncompleteStudentsPanel({
  workspaceId,
  scope,
  students,
  heading,
}: {
  workspaceId: string;
  scope: GpaScope;
  students: IncompleteStudent[];
  heading: string;
}) {
  if (students.length === 0) return null;
  return (
    <section className="mt-5" aria-label={heading}>
      <h4 className="font-display text-lg font-semibold">{heading}</h4>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        Add a complete result for each course listed below before calculating
        this student&apos;s GPA.
      </p>
      <ul className="mt-3 grid border-l border-t border-[var(--app-border)] lg:grid-cols-2">
        {students.map((student) => (
          <li
            key={student.studentId}
            className="app-panel border-b border-r border-[var(--app-border)] p-4"
          >
            <h5 className="font-semibold">{student.studentName}</h5>
            <p className="text-xs text-[var(--app-muted)]">
              {student.matricNumber || "No matric number"} ·{" "}
              {student.missingResults.length}{" "}
              {student.missingResults.length === 1
                ? "missing result"
                : "missing results"}
            </p>
            <ul className="mt-3 space-y-2">
              {student.missingResults.map((course) => (
                <li
                  key={course.courseOfferingId}
                  className="flex flex-col gap-3 border border-[var(--app-border)] p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-xs font-semibold">
                    {course.courseCode ? `${course.courseCode} — ` : ""}
                    {course.courseName}
                  </span>
                  <ButtonLink
                    href={resultEntryHref(
                      workspaceId,
                      scope,
                      student.studentId,
                      course.courseOfferingId,
                      course.courseId,
                    )}
                    variant="outline"
                    className="min-h-9 shrink-0 px-3 text-xs"
                  >
                    Enter result
                    <span className="sr-only">
                      {` for ${student.studentName} in ${course.courseName}`}
                    </span>
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GpaWorkspace({
  workspaceId,
  initialSelection,
}: {
  workspaceId: string;
  initialSelection: GpaInitialSelection;
}) {
  const [draft, setDraft] = useState<ScopeDraft>({
    sessionId: initialSelection.sessionId,
    termId: initialSelection.termId,
    levelId: initialSelection.levelId,
    studentId: initialSelection.studentId,
  });
  const [mode, setMode] = useState<GpaMode>(initialSelection.mode);
  const [screen, setScreen] = useState<GpaScreenState>({ kind: "idle" });
  const [calculatedScope, setCalculatedScope] = useState<GpaScopeInput | null>(
    null,
  );
  const [previewRevision, setPreviewRevision] = useState<number | null>(null);
  const [remediation, setRemediation] = useState<
    Record<string, RemediationDraft>
  >({});
  const [remediationErrors, setRemediationErrors] = useState<
    Record<string, RemediationErrors>
  >({});
  const [configured, setConfigured] = useState<Set<string>>(new Set());
  const [singleConfirm, setSingleConfirm] = useState(false);
  const [batchConfirm, setBatchConfirm] = useState(false);
  const [savedSummary, setSavedSummary] = useState<SavedAcademicSummary | null>(
    null,
  );
  const [savedBatchCount, setSavedBatchCount] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("name");
  const locked = useRef(false);
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const sessions = useSessions(workspaceId);
  const terms = useTerms(workspaceId);
  const levels = useLevels(workspaceId);
  const students = useStudents(workspaceId);
  const assessmentSchemes = useAssessmentSchemes(workspaceId);
  const gradingSchemes = useGradingSchemes(workspaceId);
  const revision = useAcademicRevision(workspaceId);
  const calculate = useCalculateGpa(workspaceId);
  const configure = useUpdateCourseOfferingConfiguration(workspaceId);
  const saveSingle = useSaveGpa(workspaceId);
  const saveBatch = useSaveBatchGpa(workspaceId);
  const selectedTermId = draft.termId;
  const isStale = previewRevision !== null && previewRevision !== revision.data;

  const labels = (scope: GpaScope) => ({
    sessionName:
      sessions.data?.find((item) => item.id === scope.sessionId)?.name ?? "",
    termName: terms.data?.find((item) => item.id === scope.termId)?.name,
    levelName: levels.data?.find((item) => item.id === scope.levelId)?.name,
  });

  const filteredBatch = useMemo(() => {
    if (screen.kind !== "batch-ready") return [];
    const needle = filter.trim().toLocaleLowerCase();
    return screen.response.students
      .filter(
        (student) =>
          !needle ||
          student.name.toLocaleLowerCase().includes(needle) ||
          student.matricNumber?.toLocaleLowerCase().includes(needle),
      )
      .slice()
      .sort((left, right) => {
        if (sort === "gpa")
          return Number(right.gpa ?? -1) - Number(left.gpa ?? -1);
        if (sort === "cgpa")
          return Number(right.cgpa ?? -1) - Number(left.cgpa ?? -1);
        return left.name.localeCompare(right.name);
      });
  }, [filter, screen, sort]);

  function focusPreview() {
    requestAnimationFrame(() => previewHeading.current?.focus());
  }

  function setPreflight(response: GpaPreflightResponse) {
    setScreen({ kind: "preflight", response });
    setConfigured(new Set());
    setRemediation((current) => {
      const next = { ...current };
      response.missingConfiguration.forEach((item) => {
        next[item.courseOfferingId] ??= {
          assessmentSchemeId: "",
          creditUnits: "",
          gradingSchemeId: "",
        };
      });
      return next;
    });
  }

  function discardPreview() {
    setScreen({ kind: "idle" });
    setCalculatedScope(null);
    setPreviewRevision(null);
    setSavedSummary(null);
    setSavedBatchCount(null);
    setNotice("");
  }

  function canChangeScope() {
    if (
      ["preflight", "single-ready", "batch-ready"].includes(screen.kind) &&
      !window.confirm(
        "Changing this selection will discard the current preview. Continue?",
      )
    )
      return false;
    return true;
  }

  function updateUrl(next: ScopeDraft, nextMode: GpaMode) {
    const url = new URL(window.location.href);
    const values = {
      session: next.sessionId,
      term: next.termId,
      level: next.levelId,
      student: nextMode === "single" ? next.studentId : "",
      mode: nextMode === "batch" ? "batch" : "",
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    window.history.replaceState(null, "", url);
  }

  function changeDraft(field: keyof ScopeDraft, value: string) {
    if (!canChangeScope()) return;
    const next = { ...draft, [field]: value };
    setDraft(next);
    updateUrl(next, mode);
    discardPreview();
  }

  function changeMode(nextMode: GpaMode) {
    if (mode === nextMode || !canChangeScope()) return;
    setMode(nextMode);
    updateUrl(draft, nextMode);
    discardPreview();
  }

  async function runCalculation(scope: GpaScopeInput) {
    if (locked.current || calculate.isPending) return;
    locked.current = true;
    setScreen({ kind: "calculating", scope });
    setNotice("");
    calculate.reset();
    try {
      const response = await calculate.mutateAsync(scope);
      setCalculatedScope(scope);
      setPreviewRevision(revision.data);
      setSavedSummary(null);
      setSavedBatchCount(null);
      if (!response.ready) {
        setPreflight(response);
        setNotice(
          `GPA is not ready: ${response.incompleteStudents.length} ${response.incompleteStudents.length === 1 ? "student has" : "students have"} incomplete results and ${response.missingConfiguration.length} ${response.missingConfiguration.length === 1 ? "course needs" : "courses need"} more details.`,
        );
      } else if ("student" in response) {
        setScreen({ kind: "single-ready", response });
        setNotice(`GPA calculated for ${response.student.name}.`);
      } else if ("students" in response) {
        setScreen({ kind: "batch-ready", response });
        setNotice(
          `${response.students.length} calculated, ${response.incompleteStudents.length} skipped.`,
        );
      } else
        setScreen({
          kind: "error",
          message: "The GPA response could not be understood.",
        });
      focusPreview();
    } catch (error) {
      setScreen({ kind: "error", message: normalizeApiError(error).message });
      focusPreview();
    } finally {
      locked.current = false;
    }
  }

  function submitScope(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const scope = buildGpaScopeInput(
      { ...draft, termId: selectedTermId },
      mode,
    );
    if (!scope.sessionId || (mode === "single" && !scope.studentId)) return;
    void runCalculation(scope);
  }

  function updateRemediation(
    offeringId: string,
    field: keyof RemediationDraft,
    value: string,
  ) {
    setRemediation((current) => ({
      ...current,
      [offeringId]: {
        ...(current[offeringId] ?? {
          assessmentSchemeId: "",
          creditUnits: "",
          gradingSchemeId: "",
        }),
        [field]: value,
      },
    }));
    setRemediationErrors((current) => ({
      ...current,
      [offeringId]: { ...current[offeringId], [field]: undefined },
    }));
  }

  async function repair(item: MissingOfferingConfiguration) {
    if (configure.isPending) return;
    const values = remediation[item.courseOfferingId] ?? {
      assessmentSchemeId: "",
      creditUnits: "",
      gradingSchemeId: "",
    };
    const errors: RemediationErrors = {};
    if (
      item.missing.includes("assessmentSchemeId") &&
      !values.assessmentSchemeId
    )
      errors.assessmentSchemeId = "Select an assessment scheme.";
    if (
      item.missing.includes("creditUnits") &&
      !validCreditUnits(values.creditUnits)
    )
      errors.creditUnits =
        "Enter 0.001 to 1000 with no more than three decimal places.";
    if (item.missing.includes("gradingSchemeId") && !values.gradingSchemeId)
      errors.gradingSchemeId = "Select a grading scheme.";
    setRemediationErrors((current) => ({
      ...current,
      [item.courseOfferingId]: errors,
    }));
    if (Object.keys(errors).length) return;
    const input: UpdateCourseOfferingConfigurationInput = {
      ...(item.missing.includes("assessmentSchemeId")
        ? { assessmentSchemeId: values.assessmentSchemeId }
        : {}),
      ...(item.missing.includes("creditUnits")
        ? { creditUnits: Number(values.creditUnits) }
        : {}),
      ...(item.missing.includes("gradingSchemeId")
        ? { gradingSchemeId: values.gradingSchemeId }
        : {}),
    };
    configure.reset();
    try {
      await configure.mutateAsync({ id: item.courseOfferingId, input });
      setConfigured((current) => new Set(current).add(item.courseOfferingId));
      setNotice(`${courseName(item)} was updated.`);
    } catch {}
  }

  async function saveSingleSummary(response: SingleStudentGpaResponse) {
    if (saveSingle.isPending || response.gpa === null || isStale) return;
    saveSingle.reset();
    try {
      const saved = await saveSingle.mutateAsync(
        saveScope(response.scope, response.student.id),
      );
      setSingleConfirm(false);
      if (!saved.ready) {
        setPreflight(saved);
        setNotice(
          "Results have changed. Review the issues below.",
        );
      } else {
        setSavedSummary(saved.summary);
        setScreen({ kind: "single-ready", response: saved.calculation });
        setCalculatedScope(
          saveScope(saved.calculation.scope, saved.calculation.student.id),
        );
        setPreviewRevision(revision.data);
        setNotice(
          `Summary saved at ${calculatedAt(saved.summary.calculatedAt)}.`,
        );
      }
      focusPreview();
    } catch {
      setSingleConfirm(false);
    }
  }

  async function saveBatchSummaries(response: BatchGpaResponse) {
    if (saveBatch.isPending || response.students.length === 0 || isStale)
      return;
    saveBatch.reset();
    try {
      const saved = await saveBatch.mutateAsync(saveScope(response.scope));
      setBatchConfirm(false);
      if (!saved.ready) {
        setPreflight(saved);
        setNotice(
          "Results have changed. Review the issues below.",
        );
      } else {
        const count = saved.savedSummaries.length;
        setSavedBatchCount(count);
        setScreen({
          kind: "batch-ready",
          response: {
            ...response,
            incompleteStudents: saved.incompleteStudents,
          },
        });
        setNotice(
          `${count} ${count === 1 ? "summary was" : "summaries were"} saved; ${saved.incompleteStudents.length} skipped.`,
        );
      }
      focusPreview();
    } catch {
      setBatchConfirm(false);
    }
  }

  const visibleScope =
    screen.kind === "preflight" ||
    screen.kind === "single-ready" ||
    screen.kind === "batch-ready"
      ? screen.response.scope
      : null;
  const visibleLabels = visibleScope ? labels(visibleScope) : null;

  return (
    <>
      <header>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-blue-600">
          Academic performance
        </p>
        <h2 className="font-display text-2xl font-semibold">GPA and CGPA</h2>
        <p className="mt-1 max-w-3xl text-xs text-[var(--app-muted)]">
          Calculate GPA and CGPA from saved student results.
        </p>
      </header>

      <form
        onSubmit={submitScope}
        className="app-panel mt-5 border border-[var(--app-border)] p-5"
      >
        <h3 className="font-semibold">Results to include</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold">
            Session
            <Select
              value={draft.sessionId}
              onChange={(event) => changeDraft("sessionId", event.target.value)}
              className="mt-1"
              disabled={calculate.isPending}
              required
            >
              <option value="">Select session</option>
              {sessions.data?.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
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
              value={selectedTermId}
              onChange={(event) => changeDraft("termId", event.target.value)}
              className="mt-1"
              disabled={calculate.isPending || terms.isPending}
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
            Level{" "}
            <span className="font-normal text-[var(--app-muted)]">
              (optional)
            </span>
            <Select
              value={draft.levelId}
              onChange={(event) => changeDraft("levelId", event.target.value)}
              className="mt-1"
              disabled={calculate.isPending}
            >
              <option value="">All levels</option>
              {levels.data?.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.code ? `${level.code} — ` : ""}
                  {level.name}
                </option>
              ))}
            </Select>
          </label>
          <fieldset>
            <legend className="text-sm font-semibold">Students</legend>
            <div className="mt-2 flex min-h-11 items-center gap-4 border border-[var(--app-border)] px-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="radio"
                  name="gpa-mode"
                  checked={mode === "single"}
                  onChange={() => changeMode("single")}
                  disabled={calculate.isPending}
                />
                One student
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="radio"
                  name="gpa-mode"
                  checked={mode === "batch"}
                  onChange={() => changeMode("batch")}
                  disabled={calculate.isPending}
                />
                All applicable
              </label>
            </div>
          </fieldset>
          {mode === "single" && (
            <label className="text-sm font-semibold sm:col-span-2 lg:col-span-4 lg:max-w-md">
              Student
              <Select
                value={draft.studentId}
                onChange={(event) =>
                  changeDraft("studentId", event.target.value)
                }
                className="mt-1"
                disabled={calculate.isPending}
                required
              >
                <option value="">Select student</option>
                {students.data?.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                    {student.matricNumber ? ` · ${student.matricNumber}` : ""}
                  </option>
                ))}
              </Select>
            </label>
          )}
        </div>
        <div className="mt-5 flex flex-col gap-4 border-t border-[var(--app-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xs text-[var(--app-muted)]">
            Students need a complete saved result for every course included.
          </p>
          <Button
            type="submit"
            disabled={
              calculate.isPending ||
              !draft.sessionId ||
              (mode === "single" && !draft.studentId)
            }
          >
            <Calculator size={16} />
            {calculate.isPending ? "Calculating…" : "Preview GPA"}
          </Button>
        </div>
      </form>

      <p className="sr-only" role="status" aria-live="polite">
        {notice}
      </p>

      {screen.kind === "calculating" && (
        <section
          className="app-panel mt-6 border border-[var(--app-border)] p-8"
          aria-busy="true"
        >
          <h3 className="font-display text-xl font-semibold">
            Calculating preview…
          </h3>
          <p className="mt-2 text-xs text-[var(--app-muted)]">
            Checking student results…
          </p>
        </section>
      )}

      {screen.kind === "error" && (
        <section
          className="app-panel mt-6 border border-red-300 p-5"
          role="alert"
        >
          <h3
            ref={previewHeading}
            tabIndex={-1}
            className="font-display text-xl font-semibold"
          >
            Calculation unavailable
          </h3>
          <p className="mt-2 text-sm text-red-700">{screen.message}</p>
        </section>
      )}

      {screen.kind === "preflight" && (
        <section
          className="app-panel mt-6 border border-amber-300 p-5"
          aria-labelledby="preflight-heading"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3
                id="preflight-heading"
                ref={previewHeading}
                tabIndex={-1}
                className="flex items-center gap-2 font-display text-xl font-semibold"
              >
                <AlertTriangle size={20} /> GPA not ready
              </h3>
              {visibleLabels && (
                <ScopeLabel scope={screen.response.scope} {...visibleLabels} />
              )}
              <p className="mt-3 max-w-3xl text-xs text-[var(--app-muted)]">
                Fix the missing results and course details below, then calculate
                again.
              </p>
            </div>
            <Button
              variant="outline"
              disabled={calculate.isPending || !calculatedScope}
              onClick={() =>
                calculatedScope && void runCalculation(calculatedScope)
              }
            >
              Recalculate
            </Button>
          </div>
          <IncompleteStudentsPanel
            workspaceId={workspaceId}
            scope={screen.response.scope}
            students={screen.response.incompleteStudents}
            heading="Missing student results"
          />
          {screen.response.missingConfiguration.length > 0 && (
            <section className="mt-5" aria-label="Course details">
              <h4 className="font-display text-lg font-semibold">
                Missing course details
              </h4>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                Complete these course details before calculating GPA.
              </p>
              <ul className="mt-3 grid border-l border-t border-[var(--app-border)] lg:grid-cols-2">
                {screen.response.missingConfiguration.map((item) => {
                  const values = remediation[item.courseOfferingId] ?? {
                    assessmentSchemeId: "",
                    creditUnits: "",
                    gradingSchemeId: "",
                  };
                  const errors = remediationErrors[item.courseOfferingId] ?? {};
                  return (
                    <li
                      key={item.courseOfferingId}
                      className="border-b border-r border-[var(--app-border)] p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold">{courseName(item)}</h4>
                          <p className="mt-1 text-xs text-[var(--app-muted)]">
                            Missing:{" "}
                            {item.missing
                              .map((field) => {
                                if (field === "assessmentSchemeId")
                                  return "assessment scheme";
                                if (field === "creditUnits")
                                  return "credit units";
                                return "grading scheme";
                              })
                              .join(", ")}
                          </p>
                        </div>
                        {configured.has(item.courseOfferingId) && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={15} /> Updated
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-xs text-[var(--app-muted)]">
                        These details apply to every student taking this course.
                      </p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {item.missing.includes("assessmentSchemeId") && (
                          <label className="text-sm font-semibold">
                            Assessment scheme
                            <Select
                              value={values.assessmentSchemeId}
                              onChange={(event) =>
                                updateRemediation(
                                  item.courseOfferingId,
                                  "assessmentSchemeId",
                                  event.target.value,
                                )
                              }
                              className="mt-1"
                              aria-invalid={Boolean(errors.assessmentSchemeId)}
                            >
                              <option value="">Select scheme</option>
                              {assessmentSchemes.data?.map((scheme) => (
                                <option key={scheme.id} value={scheme.id}>
                                  {scheme.name}
                                </option>
                              ))}
                            </Select>
                            <FieldError>{errors.assessmentSchemeId}</FieldError>
                          </label>
                        )}
                        {item.missing.includes("creditUnits") && (
                          <label className="text-sm font-semibold">
                            Credit units
                            <Input
                              value={values.creditUnits}
                              onChange={(event) =>
                                updateRemediation(
                                  item.courseOfferingId,
                                  "creditUnits",
                                  event.target.value,
                                )
                              }
                              inputMode="decimal"
                              className="mt-1"
                              aria-invalid={Boolean(errors.creditUnits)}
                            />
                            <FieldError>{errors.creditUnits}</FieldError>
                          </label>
                        )}
                        {item.missing.includes("gradingSchemeId") && (
                          <label className="text-sm font-semibold">
                            Grading scheme
                            <Select
                              value={values.gradingSchemeId}
                              onChange={(event) =>
                                updateRemediation(
                                  item.courseOfferingId,
                                  "gradingSchemeId",
                                  event.target.value,
                                )
                              }
                              className="mt-1"
                              aria-invalid={Boolean(errors.gradingSchemeId)}
                            >
                              <option value="">Select scheme</option>
                              {gradingSchemes.data?.map((scheme) => (
                                <option key={scheme.id} value={scheme.id}>
                                  {scheme.name}
                                </option>
                              ))}
                            </Select>
                            <FieldError>{errors.gradingSchemeId}</FieldError>
                          </label>
                        )}
                      </div>
                      <Button
                        className="mt-4"
                        disabled={
                          configure.isPending ||
                          configured.has(item.courseOfferingId)
                        }
                        onClick={() => void repair(item)}
                      >
                        {configure.isPending &&
                        configure.variables?.id === item.courseOfferingId
                          ? "Updating…"
                          : "Update course"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              <RequestError>
                {configure.isError
                  ? normalizeApiError(configure.error).message
                  : undefined}
              </RequestError>
            </section>
          )}
        </section>
      )}

      {screen.kind === "single-ready" && (
        <section className="mt-6" aria-labelledby="single-preview-heading">
          <div className="app-panel border border-[var(--app-border)] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3
                  id="single-preview-heading"
                  ref={previewHeading}
                  tabIndex={-1}
                  className="font-display text-xl font-semibold"
                >
                  {screen.response.student.name}
                </h3>
                <p className="text-xs text-[var(--app-muted)]">
                  {screen.response.student.matricNumber || "No matric number"}
                </p>
                {visibleLabels && (
                  <ScopeLabel
                    scope={screen.response.scope}
                    {...visibleLabels}
                  />
                )}
              </div>
              <Button
                disabled={screen.response.gpa === null || isStale}
                onClick={() => setSingleConfirm(true)}
              >
                {savedSummary ? "Update saved summary" : "Save summary"}
              </Button>
            </div>
            {isStale && (
              <p className="mt-4 border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                Academic data has changed. Calculate again before saving.
              </p>
            )}
            {screen.response.gpa === null && (
              <p className="mt-4 border border-dashed border-[var(--app-border)] p-6 text-center text-xs text-[var(--app-muted)]">
                There is no current GPA to save. Previous cumulative values may
                still appear below.
              </p>
            )}
            {savedSummary && (
              <p className="mt-4 text-xs text-emerald-700" role="status">
                Saved summary calculated{" "}
                {calculatedAt(savedSummary.calculatedAt)}.
              </p>
            )}
            <dl className="mt-5 grid border-l border-t border-[var(--app-border)] sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Current credit units"
                value={screen.response.totalCreditUnits}
              />
              <Metric
                label="Current quality points"
                value={screen.response.totalQualityPoints}
              />
              <Metric label="GPA" value={decimal(screen.response.gpa)} />
              <Metric
                label="Cumulative credit units"
                value={screen.response.cumulativeCreditUnits}
              />
              <Metric
                label="Cumulative quality points"
                value={screen.response.cumulativeQualityPoints}
              />
              <Metric label="CGPA" value={decimal(screen.response.cgpa)} />
            </dl>
          </div>
          <CourseAudit response={screen.response} />
          <RequestError>
            {saveSingle.isError
              ? normalizeApiError(saveSingle.error).message
              : undefined}
          </RequestError>
        </section>
      )}

      {screen.kind === "batch-ready" && (
        <section className="mt-6" aria-labelledby="batch-preview-heading">
          <div className="app-panel border border-[var(--app-border)] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3
                  id="batch-preview-heading"
                  ref={previewHeading}
                  tabIndex={-1}
                  className="font-display text-xl font-semibold"
                >
                  GPA preview
                </h3>
                {visibleLabels && (
                  <ScopeLabel
                    scope={screen.response.scope}
                    {...visibleLabels}
                  />
                )}
                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  {screen.response.students.length} calculated,{" "}
                  {screen.response.incompleteStudents.length} skipped.
                </p>
              </div>
              <Button
                disabled={screen.response.students.length === 0 || isStale}
                onClick={() => setBatchConfirm(true)}
              >
                Save batch summaries
              </Button>
            </div>
            {isStale && (
              <p className="mt-4 border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                Academic data has changed. Calculate again before saving.
              </p>
            )}
            {savedBatchCount !== null && (
              <p className="mt-4 text-xs text-emerald-700" role="status">
                {savedBatchCount}{" "}
                {savedBatchCount === 1 ? "summary" : "summaries"} saved.
              </p>
            )}
            {screen.response.students.length === 0 ? (
              <p className="mt-5 border border-dashed border-[var(--app-border)] p-8 text-center text-xs text-[var(--app-muted)]">
                No students have complete results for this selection. Review the
                missing courses below.
              </p>
            ) : (
              <>
                <h4 className="mt-5 font-display text-lg font-semibold">
                  Calculated students
                </h4>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <label className="relative text-sm font-semibold">
                    Filter students
                    <Search
                      className="absolute bottom-3 left-3 text-[var(--app-muted)]"
                      size={16}
                    />
                    <Input
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                      className="mt-1 pl-9"
                    />
                  </label>
                  <label className="text-sm font-semibold">
                    Sort students
                    <Select
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                      className="mt-1"
                    >
                      <option value="name">Name</option>
                      <option value="gpa">GPA, highest first</option>
                      <option value="cgpa">CGPA, highest first</option>
                    </Select>
                  </label>
                </div>
                <div className="mt-5 hidden overflow-x-auto border border-[var(--app-border)] md:block">
                  <table className="w-full min-w-[900px] text-left text-xs">
                    <caption className="sr-only">Batch GPA preview</caption>
                    <thead className="app-panel">
                      <tr>
                        <th className="p-3">Student</th>
                        <th className="p-3">Credit units</th>
                        <th className="p-3">Quality points</th>
                        <th className="p-3">GPA</th>
                        <th className="p-3">Cumulative units</th>
                        <th className="p-3">Cumulative points</th>
                        <th className="p-3">CGPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatch.map((student) => (
                        <tr
                          key={student.studentId}
                          className="border-t border-[var(--app-border)]"
                        >
                          <th scope="row" className="p-3 font-semibold">
                            {student.name}
                            <span className="block font-normal text-[var(--app-muted)]">
                              {student.matricNumber || "No matric number"}
                            </span>
                          </th>
                          <td className="p-3">{student.totalCreditUnits}</td>
                          <td className="p-3">{student.totalQualityPoints}</td>
                          <td className="p-3">{decimal(student.gpa)}</td>
                          <td className="p-3">
                            {student.cumulativeCreditUnits}
                          </td>
                          <td className="p-3">
                            {student.cumulativeQualityPoints}
                          </td>
                          <td className="p-3">{decimal(student.cgpa)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="mt-5 divide-y divide-[var(--app-border)] border border-[var(--app-border)] md:hidden">
                  {filteredBatch.map((student) => (
                    <li key={student.studentId} className="app-panel p-4">
                      <h4 className="font-semibold">{student.name}</h4>
                      <p className="text-xs text-[var(--app-muted)]">
                        {student.matricNumber || "No matric number"}
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <dt className="text-[var(--app-muted)]">GPA</dt>
                          <dd>{decimal(student.gpa)}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--app-muted)]">CGPA</dt>
                          <dd>{decimal(student.cgpa)}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--app-muted)]">
                            Credit units
                          </dt>
                          <dd>{student.totalCreditUnits}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--app-muted)]">
                            Quality points
                          </dt>
                          <dd>{student.totalQualityPoints}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--app-muted)]">
                            Cumulative units
                          </dt>
                          <dd>{student.cumulativeCreditUnits}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--app-muted)]">
                            Cumulative points
                          </dt>
                          <dd>{student.cumulativeQualityPoints}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <RequestError>
            {saveBatch.isError
              ? normalizeApiError(saveBatch.error).message
              : undefined}
          </RequestError>
          <IncompleteStudentsPanel
            workspaceId={workspaceId}
            scope={screen.response.scope}
            students={screen.response.incompleteStudents}
            heading="Skipped students"
          />
        </section>
      )}

      <Dialog
        open={singleConfirm && screen.kind === "single-ready"}
        onClose={() => !saveSingle.isPending && setSingleConfirm(false)}
        title={savedSummary ? "Update saved summary?" : "Save GPA summary?"}
        description={
          screen.kind === "single-ready"
            ? `Calculate and save ${screen.response.student.name}'s GPA summary?`
            : undefined
        }
      >
        {screen.kind === "single-ready" && (
          <>
            <RequestError>
              {saveSingle.isError
                ? normalizeApiError(saveSingle.error).message
                : undefined}
            </RequestError>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={saveSingle.isPending}
                onClick={() => setSingleConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={saveSingle.isPending}
                onClick={() => void saveSingleSummary(screen.response)}
              >
                {saveSingle.isPending
                  ? "Saving…"
                  : savedSummary
                    ? "Update summary"
                    : "Save summary"}
              </Button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog
        open={batchConfirm && screen.kind === "batch-ready"}
        onClose={() => !saveBatch.isPending && setBatchConfirm(false)}
        title="Save batch summaries?"
        description={
          screen.kind === "batch-ready"
            ? `Save GPA summaries for ${screen.response.students.length} ${screen.response.students.length === 1 ? "student" : "students"}? ${screen.response.incompleteStudents.length} ${screen.response.incompleteStudents.length === 1 ? "student has" : "students have"} incomplete results and will be skipped.`
            : undefined
        }
      >
        {screen.kind === "batch-ready" && (
          <>
            {visibleLabels && (
              <ScopeLabel scope={screen.response.scope} {...visibleLabels} />
            )}
            <RequestError>
              {saveBatch.isError
                ? normalizeApiError(saveBatch.error).message
                : undefined}
            </RequestError>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={saveBatch.isPending}
                onClick={() => setBatchConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={saveBatch.isPending}
                onClick={() => void saveBatchSummaries(screen.response)}
              >
                {saveBatch.isPending
                  ? "Saving…"
                  : `Save ${screen.response.students.length} ${screen.response.students.length === 1 ? "summary" : "summaries"}`}
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}

export default function WorkspaceGpaPage({
  workspaceId,
  initialSelection = emptySelection,
}: {
  workspaceId: string;
  initialSelection?: GpaInitialSelection;
}) {
  return (
    <WorkspaceChrome workspaceId={workspaceId}>
      {() => (
        <GpaWorkspace
          workspaceId={workspaceId}
          initialSelection={initialSelection}
        />
      )}
    </WorkspaceChrome>
  );
}
