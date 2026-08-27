"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calculator,
  Check,
  Clipboard,
  Pencil,
  Printer,
  RotateCcw,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  FieldError,
  RequestError,
} from "@/features/workspace/components/FieldError";
import { normalizeApiError } from "@/lib/api/errors";
import {
  clearCalculatorDraft,
  configurationFingerprint,
  readCalculatorDraft,
  writeCalculatorDraft,
} from "./draft";
import { usePublicCalculation, usePublicCalculator } from "./hooks";
import type {
  CalculationDimension,
  PublicCalculationResponse,
  PublicCalculatorDetail,
} from "./types";
import { buildCalculationEntries, eligibleCourses } from "./validation";

type EntryMode = "score" | "grade";

const dimensionLabel = (dimension: CalculationDimension | null) =>
  dimension?.name ?? "Unspecified";

function ResultTotals({
  label,
  totalCreditUnits,
  totalQualityPoints,
  gpa,
}: {
  label: string;
  totalCreditUnits: string;
  totalQualityPoints: string;
  gpa: string | null;
}) {
  return (
    <div className="border border-line bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink">
        {gpa ?? "Not available"}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted">Credit units</dt>
          <dd className="font-semibold text-ink">{totalCreditUnits}</dd>
        </div>
        <div>
          <dt className="text-muted">Quality points</dt>
          <dd className="font-semibold text-ink">{totalQualityPoints}</dd>
        </div>
      </dl>
    </div>
  );
}

function CalculationReport({
  response,
  context,
  onEdit,
  onStartOver,
}: {
  response: PublicCalculationResponse;
  context: string[];
  onEdit: () => void;
  onStartOver: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const singleScope =
    response.groups.length <= 1 && response.sessions.length <= 1;

  async function copyLink() {
    const path = response.publicPath;
    const link = new URL(path, window.location.origin).toString();
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section
      aria-labelledby="calculation-result"
      className="public-calculator-report"
    >
      <div className="border border-line bg-white p-6 md:p-8">
        <div className="flex flex-col justify-between gap-5 border-b border-line pb-6 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Calculated with AureScore
            </p>
            <h2
              id="calculation-result"
              tabIndex={-1}
              className="mt-2 font-display text-3xl font-semibold outline-none"
            >
              {response.calculator.title}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {[
                response.calculator.institutionName,
                response.calculator.departmentName,
              ]
                .filter(Boolean)
                .join(" · ") || "Public academic calculator"}
            </p>
            {context.length > 0 && (
              <p className="mt-2 text-sm text-muted">{context.join(" · ")}</p>
            )}
          </div>
          <div className="print:hidden flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="min-h-10 px-4"
              onClick={onEdit}
            >
              <Pencil size={15} aria-hidden="true" /> Edit inputs
            </Button>
            <Button
              variant="outline"
              className="min-h-10 px-4"
              onClick={onStartOver}
            >
              <RotateCcw size={15} aria-hidden="true" /> Start over
            </Button>
            <Button
              variant="outline"
              className="min-h-10 px-4"
              onClick={() => void copyLink()}
            >
              {copied ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Clipboard size={15} aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              variant="outline"
              className="min-h-10 px-4"
              onClick={() => window.print()}
            >
              <Printer size={15} aria-hidden="true" /> Print / download
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-3">
          <div className="bg-cream p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {singleScope ? "GPA" : "Overall GPA"}
            </p>
            <p className="mt-2 font-display text-4xl font-semibold">
              {response.gpa ?? "Not available"}
            </p>
          </div>
          {!singleScope && (
            <div className="bg-cream p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                CGPA
              </p>
              <p className="mt-2 font-display text-4xl font-semibold">
                {response.cgpa ?? "Not available"}
              </p>
            </div>
          )}
          <div className="bg-cream p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Total credit units
            </p>
            <p className="mt-2 font-display text-4xl font-semibold">
              {response.totalCreditUnits}
            </p>
          </div>
          <div className="bg-cream p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Total quality points
            </p>
            <p className="mt-2 font-display text-4xl font-semibold">
              {response.totalQualityPoints}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <caption className="mb-3 text-left font-display text-2xl font-semibold">
              Course breakdown
            </caption>
            <thead>
              <tr className="border-y border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-3">Course</th>
                <th className="px-3 py-3">Context</th>
                <th className="px-3 py-3">Score</th>
                <th className="px-3 py-3">Grade</th>
                <th className="px-3 py-3">Point</th>
                <th className="px-3 py-3">Units</th>
                <th className="px-3 py-3">Quality points</th>
              </tr>
            </thead>
            <tbody>
              {response.entries.map((entry) => (
                <tr
                  key={entry.course.id}
                  className="border-b border-line align-top"
                >
                  <td className="px-3 py-4 font-semibold">
                    {entry.course.code ? `${entry.course.code} — ` : ""}
                    {entry.course.name}
                  </td>
                  <td className="px-3 py-4 text-muted">
                    {[entry.session, entry.term, entry.level]
                      .filter((item): item is CalculationDimension =>
                        Boolean(item),
                      )
                      .map((item) => item.name)
                      .join(" · ") || "Unspecified"}
                  </td>
                  <td className="px-3 py-4">{entry.score ?? "—"}</td>
                  <td className="px-3 py-4 font-semibold">{entry.grade}</td>
                  <td className="px-3 py-4">{entry.gradePoint}</td>
                  <td className="px-3 py-4">{entry.creditUnits}</td>
                  <td className="px-3 py-4">{entry.qualityPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {response.groups.length > 1 && (
          <section className="mt-8" aria-labelledby="group-gpas">
            <h3 id="group-gpas" className="font-display text-2xl font-semibold">
              Grouped GPA
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {response.groups.map((group, index) => (
                <ResultTotals
                  key={`${group.session?.id ?? "none"}-${group.term?.id ?? "none"}-${group.level?.id ?? "none"}-${index}`}
                  label={
                    [group.session, group.term, group.level]
                      .filter((item): item is CalculationDimension =>
                        Boolean(item),
                      )
                      .map((item) => item.name)
                      .join(" · ") || "Unspecified context"
                  }
                  {...group}
                />
              ))}
            </div>
          </section>
        )}

        {response.sessions.length > 1 && (
          <section className="mt-8" aria-labelledby="session-gpas">
            <h3
              id="session-gpas"
              className="font-display text-2xl font-semibold"
            >
              Session GPA
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {response.sessions.map((session, index) => (
                <ResultTotals
                  key={`${session.session?.id ?? "none"}-${index}`}
                  label={dimensionLabel(session.session)}
                  {...session}
                />
              ))}
            </div>
          </section>
        )}

        <p className="mt-8 break-all border-t border-line pt-5 text-xs text-muted">
          {response.publicPath}
        </p>
      </div>
    </section>
  );
}

function CalculatorForm({
  calculator,
}: {
  calculator: PublicCalculatorDetail;
}) {
  const calculate = usePublicCalculation(calculator.id);
  const fingerprint = useMemo(
    () => configurationFingerprint(calculator),
    [calculator],
  );
  const [mode, setMode] = useState<EntryMode>("score");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftHydrated, setDraftHydrated] = useState(false);
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorHeadingRef = useRef<HTMLHeadingElement>(null);

  const eligible = useMemo(
    () => eligibleCourses(calculator.courses, termId, levelId),
    [calculator.courses, levelId, termId],
  );
  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return eligible;
    return eligible.filter((course) =>
      `${course.code ?? ""} ${course.name}`.toLocaleLowerCase().includes(query),
    );
  }, [eligible, search]);

  useEffect(() => {
    const draft = readCalculatorDraft(calculator.id, fingerprint);
    const restoredSessionId =
      draft && calculator.sessions.some((item) => item.id === draft.sessionId)
        ? draft.sessionId
        : "";
    const restoredTermId =
      draft && calculator.terms.some((item) => item.id === draft.termId)
        ? draft.termId
        : "";
    const restoredLevelId =
      draft && calculator.levels.some((item) => item.id === draft.levelId)
        ? draft.levelId
        : "";
    const restoredEligibleIds = new Set(
      eligibleCourses(calculator.courses, restoredTermId, restoredLevelId).map(
        (course) => course.id,
      ),
    );
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (draft) {
        setMode(draft.mode);
        setSessionId(restoredSessionId);
        setTermId(restoredTermId);
        setLevelId(restoredLevelId);
        setSelectedCourseIds(
          draft.selectedCourseIds.filter((id) => restoredEligibleIds.has(id)),
        );
        setInputs(draft.inputs);
      }
      setDraftHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [calculator, fingerprint]);

  useEffect(() => {
    if (!draftHydrated) return;
    writeCalculatorDraft(calculator.id, {
      version: 1,
      updatedAt: new Date().toISOString(),
      configurationFingerprint: fingerprint,
      mode,
      sessionId,
      termId,
      levelId,
      selectedCourseIds,
      inputs,
    });
  }, [
    calculator.id,
    draftHydrated,
    fingerprint,
    inputs,
    levelId,
    mode,
    selectedCourseIds,
    sessionId,
    termId,
  ]);

  useEffect(() => {
    if (!calculate.data) return;
    requestAnimationFrame(() =>
      document.getElementById("calculation-result")?.focus(),
    );
  }, [calculate.data]);

  function resetResult() {
    if (calculate.data || calculate.error) calculate.reset();
  }

  function changeMode(nextMode: EntryMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setInputs({});
    setErrors({});
    resetResult();
  }

  function changeTerm(nextTermId: string) {
    setTermId(nextTermId);
    const eligibleIds = new Set(
      eligibleCourses(calculator.courses, nextTermId, levelId).map(
        (course) => course.id,
      ),
    );
    setSelectedCourseIds((current) =>
      current.filter((id) => eligibleIds.has(id)),
    );
    resetResult();
  }

  function changeLevel(nextLevelId: string) {
    setLevelId(nextLevelId);
    const eligibleIds = new Set(
      eligibleCourses(calculator.courses, termId, nextLevelId).map(
        (course) => course.id,
      ),
    );
    setSelectedCourseIds((current) =>
      current.filter((id) => eligibleIds.has(id)),
    );
    resetResult();
  }

  function toggleCourse(courseId: string) {
    setSelectedCourseIds((current) =>
      current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId],
    );
    setErrors((current) => {
      const next = { ...current };
      delete next.entries;
      delete next[`entries.${courseId}`];
      return next;
    });
    resetResult();
  }

  function updateInput(courseId: string, value: string) {
    setInputs((current) => ({ ...current, [courseId]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next.entries;
      delete next[`entries.${courseId}`];
      return next;
    });
    resetResult();
  }

  function startOver() {
    clearCalculatorDraft(calculator.id);
    setMode("score");
    setSessionId("");
    setTermId("");
    setLevelId("");
    setSelectedCourseIds([]);
    setInputs({});
    setSearch("");
    setErrors({});
    calculate.reset();
    requestAnimationFrame(() => formHeadingRef.current?.focus());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const built = buildCalculationEntries({
      mode,
      selectedCourseIds,
      inputs,
      allowedGrades: calculator.gradingScheme.bands.map((band) => band.label),
    });
    setErrors(built.errors);
    if (Object.keys(built.errors).length > 0) {
      requestAnimationFrame(() => errorHeadingRef.current?.focus());
      return;
    }
    try {
      await calculate.mutateAsync({
        ...(sessionId ? { sessionId } : {}),
        ...(termId ? { termId } : {}),
        ...(levelId ? { levelId } : {}),
        entries: built.entries,
      });
    } catch {
      requestAnimationFrame(() => errorHeadingRef.current?.focus());
    }
  }

  const context = [
    calculator.sessions.find((item) => item.id === sessionId)?.name,
    calculator.terms.find((item) => item.id === termId)?.name,
    calculator.levels.find((item) => item.id === levelId)?.name,
  ].filter((item): item is string => Boolean(item));

  if (calculate.data) {
    return (
      <div>
        <CalculationReport
          response={calculate.data}
          context={context}
          onEdit={() => {
            calculate.reset();
            requestAnimationFrame(() => formHeadingRef.current?.focus());
          }}
          onStartOver={startOver}
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="border border-line bg-white p-6 md:p-8"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-start">
        <div>
          <h2
            ref={formHeadingRef}
            tabIndex={-1}
            className="font-display text-3xl font-semibold outline-none"
          >
            Enter your courses
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Context is optional. Session provides context only; Term and Level
            determine which assigned courses appear.
          </p>
        </div>
        <button
          type="button"
          className="focus-ring self-start text-sm font-semibold text-blue-700"
          onClick={startOver}
        >
          Reset draft
        </button>
      </div>

      <fieldset className="mt-6 grid gap-4 md:grid-cols-3">
        <legend className="sr-only">Academic context</legend>
        {calculator.sessions.length > 0 && (
          <label className="text-sm font-semibold">
            Session
            <Select
              value={sessionId}
              onChange={(event) => {
                setSessionId(event.target.value);
                resetResult();
              }}
              className="mt-2 font-normal"
            >
              <option value="">No Session selected</option>
              {calculator.sessions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
        )}
        {calculator.terms.length > 0 && (
          <label className="text-sm font-semibold">
            Term
            <Select
              value={termId}
              onChange={(event) => changeTerm(event.target.value)}
              className="mt-2 font-normal"
            >
              <option value="">All Terms</option>
              {calculator.terms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code ? `${item.code} — ` : ""}
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
        )}
        {calculator.levels.length > 0 && (
          <label className="text-sm font-semibold">
            Level
            <Select
              value={levelId}
              onChange={(event) => changeLevel(event.target.value)}
              className="mt-2 font-normal"
            >
              <option value="">All Levels</option>
              {calculator.levels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code ? `${item.code} — ` : ""}
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
        )}
      </fieldset>

      <fieldset className="mt-7">
        <legend className="text-sm font-semibold">Entry mode</legend>
        <div className="mt-2 inline-flex border border-line bg-cream p-1">
          {(["score", "grade"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={mode === item}
              onClick={() => changeMode(item)}
              className={`focus-ring min-h-10 px-5 text-sm font-semibold capitalize ${mode === item ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-7">
        <label htmlFor="course-search" className="text-sm font-semibold">
          Search eligible Courses
        </label>
        <Input
          id="course-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by code or name"
          className="mt-2 max-w-xl"
        />
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="mt-6" role="alert">
          <h3
            ref={errorHeadingRef}
            tabIndex={-1}
            className="font-semibold text-red-700 outline-none"
          >
            Check your entries
          </h3>
          {errors.entries && (
            <p className="mt-1 text-sm text-red-700">{errors.entries}</p>
          )}
        </div>
      )}
      {calculate.isError && (
        <div className="mt-6">
          <h3 ref={errorHeadingRef} tabIndex={-1} className="sr-only">
            Calculation failed
          </h3>
          <RequestError>
            {normalizeApiError(calculate.error).message}
          </RequestError>
        </div>
      )}

      <fieldset className="mt-6">
        <legend className="sr-only">Courses and values</legend>
        <div className="border border-line">
          <div className="hidden grid-cols-[minmax(0,1fr)_100px_180px] gap-4 border-b border-line bg-cream px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted sm:grid">
            <span>Course</span>
            <span>Units</span>
            <span>{mode === "score" ? "Score" : "Grade"}</span>
          </div>
          {visible.map((course) => {
            const selected = selectedCourseIds.includes(course.id);
            const error = errors[`entries.${course.id}`];
            return (
              <div
                key={course.id}
                className="grid gap-3 border-b border-line p-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_100px_180px] sm:items-center sm:gap-4"
              >
                <label className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-blue-600"
                    checked={selected}
                    onChange={() => toggleCourse(course.id)}
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold">
                      {course.code ? `${course.code} — ` : ""}
                      {course.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {[
                        calculator.terms.find(
                          (item) => item.id === course.termId,
                        )?.name,
                        calculator.levels.find(
                          (item) => item.id === course.levelId,
                        )?.name,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Available in any Term and Level"}
                    </span>
                  </span>
                </label>
                <div>
                  <span className="text-xs text-muted sm:hidden">
                    Credit units:{" "}
                  </span>
                  <span className="font-semibold">{course.creditUnits}</span>
                </div>
                <div>
                  {mode === "score" ? (
                    <Input
                      aria-label={`Score for ${course.name}`}
                      aria-invalid={Boolean(error)}
                      aria-describedby={
                        error ? `entry-error-${course.id}` : undefined
                      }
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      disabled={!selected}
                      value={inputs[course.id] ?? ""}
                      onChange={(event) =>
                        updateInput(course.id, event.target.value)
                      }
                      placeholder="0–100"
                    />
                  ) : (
                    <Select
                      aria-label={`Grade for ${course.name}`}
                      aria-invalid={Boolean(error)}
                      aria-describedby={
                        error ? `entry-error-${course.id}` : undefined
                      }
                      disabled={!selected}
                      value={inputs[course.id] ?? ""}
                      onChange={(event) =>
                        updateInput(course.id, event.target.value)
                      }
                    >
                      <option value="">Select grade</option>
                      {calculator.gradingScheme.bands.map((band) => (
                        <option key={band.label} value={band.label}>
                          {band.label}
                        </option>
                      ))}
                    </Select>
                  )}
                  <FieldError id={`entry-error-${course.id}`}>
                    {error}
                  </FieldError>
                </div>
              </div>
            );
          })}
          {visible.length === 0 && (
            <p className="p-8 text-center text-sm text-muted">
              No Courses match this context and search.
            </p>
          )}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={calculate.isPending || eligible.length === 0}
        >
          <Calculator size={17} aria-hidden="true" />{" "}
          {calculate.isPending ? "Calculating…" : "Calculate GPA"}
        </Button>
        <p aria-live="polite" className="text-sm text-muted">
          {selectedCourseIds.length} Course
          {selectedCourseIds.length === 1 ? "" : "s"} selected
        </p>
      </div>
    </form>
  );
}

export default function PublicCalculatorPage({
  calculatorId,
}: {
  calculatorId: string;
}) {
  const query = usePublicCalculator(calculatorId);

  if (query.isPending) {
    return (
      <main className="min-h-screen bg-cream text-ink">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10">
          <p role="status" className="sr-only">
            Loading public calculator…
          </p>
          <Skeleton className="h-72" />
          <Skeleton className="mt-6 h-96" />
        </div>
        <Footer />
      </main>
    );
  }

  if (query.isError) {
    const error = normalizeApiError(query.error);
    const notFound = error.status === 404;
    return (
      <main className="min-h-screen bg-cream text-ink">
        <SiteHeader />
        <section className="mx-auto max-w-3xl px-6 py-20 text-center md:px-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {notFound ? "Not found" : "Unable to load"}
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold">
            {notFound
              ? "This calculator is unavailable"
              : "The calculator could not be loaded"}
          </h1>
          <p className="mt-4 text-muted">
            {notFound
              ? "It may be unpublished, deleted, or the link may be incorrect."
              : error.message}
          </p>
          <div className="mt-7 flex justify-center gap-3">
            {!notFound && (
              <Button onClick={() => void query.refetch()}>Try again</Button>
            )}
            <ButtonLink href="/public-calculators" variant="outline">
              Browse calculators
            </ButtonLink>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const calculator = query.data;
  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <Link
            href="/public-calculators"
            className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
          >
            <ArrowLeft size={15} aria-hidden="true" /> All public calculators
          </Link>
          <h1 className="mt-6 max-w-4xl font-display text-4xl font-semibold leading-tight md:text-6xl">
            {calculator.title}
          </h1>
          <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
            {[calculator.institutionName, calculator.departmentName]
              .filter(Boolean)
              .join(" · ") || "Independent calculator"}
          </p>
          {calculator.description && (
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted">
              {calculator.description}
            </p>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        <CalculatorForm calculator={calculator} />
      </section>
      <Footer />
    </main>
  );
}
