"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  Check,
  Pencil,
  PlusCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
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
import {
  byCourseOrder,
  byDimensionOrder,
  groupCourses,
  missingCourseFields,
} from "./hierarchy";
import { usePublicCalculation, usePublicCalculator } from "./hooks";
import type {
  AttemptType,
  CalculationDraftGroup,
  CalculatedCourse,
  EntryMode,
  PublicCalculationEntry,
  PublicCalculationResponse,
  PublicCourse,
  PublicCalculatorDetail,
} from "./types";
import { buildCalculationEntries } from "./validation";

const PdfReportButton = dynamic(() => import("./components/PdfReportButton"), {
  ssr: false,
  loading: () => (
    <span className="text-sm text-muted">Preparing report tools…</span>
  ),
});
type CurrentDraft = {
  mode: EntryMode;
  sessionId: string;
  levelId: string;
  termId: string;
  inputs: Record<string, string>;
  carryovers: Array<{
    attemptId: string;
    courseId: string;
    originalLevelId: string;
    originalTermId: string;
    attemptType: AttemptType;
    repeatedFromId?: string;
  }>;
};
const emptyCurrent = (): CurrentDraft => ({
  mode: "score",
  sessionId: "",
  levelId: "",
  termId: "",
  inputs: {},
  carryovers: [],
});
const groupKey = (
  value: Pick<CalculationDraftGroup, "sessionId" | "levelId" | "termId">,
) => `${value.sessionId}:${value.levelId}:${value.termId}`;

function entriesForGroup(
  group: CalculationDraftGroup,
): PublicCalculationEntry[] {
  return group.entries.map((entry) => ({
    courseId: entry.courseId,
    ...(group.mode === "score"
      ? { score: Number(entry.value) }
      : { grade: entry.value }),
    sessionId: group.sessionId,
    levelId: group.levelId,
    termId: group.termId,
    attemptType: entry.attemptType,
  }));
}

function isCarryoverEligible(
  course: PublicCourse,
  selectedLevelId: string,
  selectedTermId: string,
  levels: PublicCalculatorDetail["levels"],
) {
  if (!selectedLevelId || !selectedTermId || !course.levelId) return false;
  const originalLevel = levels.find((level) => level.id === course.levelId);
  const currentLevel = levels.find((level) => level.id === selectedLevelId);
  return (
    originalLevel?.order != null &&
    currentLevel?.order != null &&
    originalLevel.order < currentLevel.order &&
    course.termId === selectedTermId
  );
}

function resultGroup(
  response: PublicCalculationResponse | undefined,
  group: CalculationDraftGroup,
) {
  return response?.groups.find(
    (item) =>
      item.session?.id === group.sessionId &&
      item.level?.id === group.levelId &&
      item.term?.id === group.termId,
  );
}

function CourseBreakdown({
  entries,
}: {
  entries: CalculatedCourse[];
}) {
  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-y border-line bg-cream text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-3">Course</th>
              <th className="px-3 py-3">Score</th>
              <th className="px-3 py-3">Grade</th>
              <th className="px-3 py-3">GP</th>
              <th className="px-3 py-3">Units</th>
              <th className="px-3 py-3">Quality points</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.course.id} className="border-b border-line">
                <td className="px-3 py-3 font-semibold">
                  {entry.course.code ? `${entry.course.code} — ` : ""}
                  {entry.course.name}{" "}
                  {entry.attemptType === "CARRYOVER" && (
                    <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                      Carryover
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">{entry.score ?? "—"}</td>
                <td className="px-3 py-3 font-semibold">{entry.grade}</td>
                <td className="px-3 py-3">{entry.gradePoint}</td>
                <td className="px-3 py-3">{entry.creditUnits}</td>
                <td className="px-3 py-3">{entry.qualityPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line border-y border-line sm:hidden">
        {entries.map((entry) => (
          <li key={entry.course.id} className="py-4">
            <p className="break-words font-semibold">
              {entry.course.code ? `${entry.course.code} — ` : ""}
              {entry.course.name}{" "}
              {entry.attemptType === "CARRYOVER" && (
                <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  Carryover
                </span>
              )}
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <div>
                <dt className="text-muted">Score</dt>
                <dd className="mt-1 font-semibold">{entry.score ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Grade / GP</dt>
                <dd className="mt-1 font-semibold">
                  {entry.grade} / {entry.gradePoint}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Units / QP</dt>
                <dd className="mt-1 font-semibold">
                  {entry.creditUnits} / {entry.qualityPoints}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

function Breakdown({
  response,
  calculator,
}: {
  response: PublicCalculationResponse;
  calculator: PublicCalculatorDetail;
}) {
  const sessions = calculator.sessions
    .slice()
    .sort(byDimensionOrder)
    .map((session) => ({
      session,
      levels: calculator.levels
        .slice()
        .sort(byDimensionOrder)
        .map((level) => ({
          level,
          terms: calculator.terms
            .slice()
            .sort(byDimensionOrder)
            .map((term) => ({
              term,
              entries: response.entries
                .filter(
                  (entry) =>
                    entry.session?.id === session.id &&
                    entry.level?.id === level.id &&
                    entry.term?.id === term.id,
                )
                .sort((a, b) =>
                  byCourseOrder(
                    {
                      ...a.course,
                      levelId: level.id,
                      termId: term.id,
                      creditUnits: a.creditUnits,
                      order:
                        calculator.courses.find(
                          (course) => course.id === a.course.id,
                        )?.order ?? null,
                    },
                    {
                      ...b.course,
                      levelId: level.id,
                      termId: term.id,
                      creditUnits: b.creditUnits,
                      order:
                        calculator.courses.find(
                          (course) => course.id === b.course.id,
                        )?.order ?? null,
                    },
                  ),
                ),
              total: response.groups.find(
                (group) =>
                  group.session?.id === session.id &&
                  group.level?.id === level.id &&
                  group.term?.id === term.id,
              ),
            }))
            .filter((group) => group.entries.length),
        }))
        .filter((group) => group.terms.length),
      total: response.sessions.find((item) => item.session?.id === session.id),
    }))
    .filter((group) => group.levels.length);
  return (
    <section
      className="border border-line bg-white p-5 sm:p-7"
      aria-labelledby="breakdown-heading"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
            Calculation results
          </p>
          <h2
            id="breakdown-heading"
            className="mt-1 font-display text-3xl font-semibold"
          >
            Calculation breakdown
          </h2>
        </div>
        <PdfReportButton
          response={response}
          calculator={calculator}
        />
      </div>
      <div className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-ink p-5 text-white">
          <p className="text-xs uppercase tracking-wide text-blue-200">CGPA</p>
          <p className="mt-1 font-display text-4xl font-semibold">
            {response.cgpa ?? response.gpa ?? "—"}
          </p>
        </div>
        <div className="bg-cream p-5">
          <p className="text-xs uppercase tracking-wide text-muted">
            Total credit units
          </p>
          <p className="mt-1 font-display text-3xl font-semibold">
            {response.totalCreditUnits}
          </p>
        </div>
        <div className="bg-cream p-5">
          <p className="text-xs uppercase tracking-wide text-muted">
            Total quality points
          </p>
          <p className="mt-1 font-display text-3xl font-semibold">
            {response.totalQualityPoints}
          </p>
        </div>
      </div>
      <div className="mt-8 space-y-9">
        {sessions.map(({ session, levels, total }) => (
          <section
            key={session.id}
            aria-labelledby={`result-session-${session.id}`}
          >
            <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-ink pb-2">
              <h3
                id={`result-session-${session.id}`}
                className="font-display text-2xl font-semibold"
              >
                {session.name}
              </h3>
              <p className="text-sm font-bold text-blue-700">
                SESSION GPA: {total?.gpa ?? "—"}
              </p>
            </div>
            <div className="mt-5 space-y-7">
              {levels.map(({ level, terms }) => (
                <section key={level.id}>
                  <h4 className="text-sm font-bold uppercase tracking-[0.12em] text-muted">
                    {level.name}
                  </h4>
                  <div className="mt-4 space-y-6">
                    {terms.map(({ term, entries, total: termTotal }) => (
                      <section key={term.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50 px-4 py-3">
                          <h5 className="font-semibold uppercase">
                            {term.name}
                          </h5>
                          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-blue-700">
                            GPA {termTotal?.gpa ?? "—"}
                          </span>
                        </div>
                        <CourseBreakdown entries={entries} />
                      </section>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-8 border-t border-line pt-4 text-xs text-muted">
        Unofficial calculation based on user-entered academic data.
      </p>
    </section>
  );
}

function CalculatorWorkspace({
  calculator,
}: {
  calculator: PublicCalculatorDetail;
}) {
  const preview = usePublicCalculation(calculator.id);
  const aggregate = usePublicCalculation(calculator.id);
  const restoreAggregate = aggregate.mutate;
  const fingerprint = useMemo(
    () => configurationFingerprint(calculator),
    [calculator],
  );
  const [current, setCurrent] = useState<CurrentDraft>(emptyCurrent);
  const [groups, setGroups] = useState<CalculationDraftGroup[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [previewKey, setPreviewKey] = useState("");
  const [carryoverOpen, setCarryoverOpen] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState("");
  const errorRef = useRef<HTMLHeadingElement>(null);
  const validCourses = useMemo(
    () =>
      calculator.courses.filter(
        (course) => !missingCourseFields(course).length,
      ),
    [calculator.courses],
  );
  const incompleteCount = calculator.courses.length - validCourses.length;
  const courses = useMemo(
    () =>
      validCourses
        .filter(
          (course) =>
            course.levelId === current.levelId &&
            course.termId === current.termId,
        )
        .sort(byCourseOrder),
    [current.levelId, current.termId, validCourses],
  );
  const sortedSessions = useMemo(
    () => calculator.sessions.slice().sort(byDimensionOrder),
    [calculator.sessions],
  );
  const sortedLevels = useMemo(
    () => calculator.levels.slice().sort(byDimensionOrder),
    [calculator.levels],
  );
  const sortedTerms = useMemo(
    () => calculator.terms.slice().sort(byDimensionOrder),
    [calculator.terms],
  );
  const currentLevelOrder = calculator.levels.find(
    (level) => level.id === current.levelId,
  )?.order;
  const availableCarryoverGroups = useMemo(
    () =>
      groupCourses(
        validCourses.filter(
          (course) =>
            isCarryoverEligible(
              course,
              current.levelId,
              current.termId,
              calculator.levels,
            ) &&
            !current.carryovers.some((item) => item.courseId === course.id),
        ),
        calculator.levels,
        calculator.terms,
      ),
    [
      calculator.levels,
      calculator.terms,
      current.carryovers,
      current.levelId,
      current.termId,
      validCourses,
    ],
  );
  const contextReady = Boolean(
    current.sessionId && current.levelId && current.termId,
  );
  const currentKey = `${current.sessionId}:${current.levelId}:${current.termId}`;

  useEffect(() => {
    const saved = readCalculatorDraft(calculator.id, fingerprint);
    const candidateGroups =
      saved?.groups.filter(
        (group) =>
          calculator.sessions.some((item) => item.id === group.sessionId) &&
          calculator.levels.some((item) => item.id === group.levelId) &&
          calculator.terms.some((item) => item.id === group.termId) &&
          group.entries.some((entry) =>
            validCourses.some((course) => course.id === entry.courseId),
          ),
      ) ?? [];
    const restoredGroups = candidateGroups
      .map((group) => ({
        ...group,
        entries: group.entries
          .map((entry) => ({
            ...entry,
            attemptType: entry.originalLevelId
              ? ("CARRYOVER" as const)
              : ("REGULAR" as const),
          }))
          .filter((entry) => {
            if (entry.attemptType !== "CARRYOVER") return true;
            const course = validCourses.find(
              (item) => item.id === entry.courseId,
            );
            return Boolean(
              course &&
                isCarryoverEligible(
                  course,
                  group.levelId,
                  group.termId,
                  calculator.levels,
                ),
            );
          }),
      }))
      .filter((group) => group.entries.length);
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (saved)
        setCurrent({
          ...saved.current,
          sessionId: calculator.sessions.some(
            (item) => item.id === saved.current.sessionId,
          )
            ? saved.current.sessionId
            : "",
          levelId: calculator.levels.some(
            (item) => item.id === saved.current.levelId,
          )
            ? saved.current.levelId
            : "",
          termId: calculator.terms.some(
            (item) => item.id === saved.current.termId,
          )
            ? saved.current.termId
            : "",
          carryovers: saved.current.carryovers
            .filter((entry) => {
              const course = validCourses.find(
                (item) => item.id === entry.courseId,
              );
              return Boolean(
                course &&
                  isCarryoverEligible(
                    course,
                    saved.current.levelId,
                    saved.current.termId,
                    calculator.levels,
                  ),
              );
            })
            .map((entry) => ({
              ...entry,
              attemptType: "CARRYOVER" as const,
            })),
        });
      setGroups(restoredGroups);
      setHydrated(true);
      if (restoredGroups.length)
        restoreAggregate({ entries: restoredGroups.flatMap(entriesForGroup) });
    });
    return () => {
      cancelled = true;
    };
  }, [
    calculator.id,
    calculator.levels,
    calculator.sessions,
    calculator.terms,
    fingerprint,
    restoreAggregate,
    validCourses,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    writeCalculatorDraft(calculator.id, {
      version: 4,
      calculatorId: calculator.id,
      updatedAt: new Date().toISOString(),
      configurationFingerprint: fingerprint,
      current,
      groups,
    });
  }, [calculator.id, current, fingerprint, groups, hydrated]);

  function setContext(
    field: "sessionId" | "levelId" | "termId",
    value: string,
  ) {
    setCurrent((draft) => ({
      ...draft,
      [field]: value,
      ...(field === "levelId" || field === "termId"
        ? { inputs: {}, carryovers: [] }
        : {}),
    }));
    setErrors({});
    preview.reset();
    setPreviewKey("");
  }

  function buildCurrentGroup() {
    const contextErrors: Record<string, string> = {};
    if (!current.sessionId) contextErrors.sessionId = "Select a Session.";
    if (!current.levelId) contextErrors.levelId = "Select a Level.";
    if (!current.termId) contextErrors.termId = "Select a Term.";
    const built = buildCalculationEntries({
      mode: current.mode,
      selectedCourseIds: courses.map((course) => course.id),
      inputs: current.inputs,
      allowedGrades: calculator.gradingScheme.bands.map((band) => band.label),
    });
    const carryoverBuilt = current.carryovers.length
      ? buildCalculationEntries({
          mode: current.mode,
          selectedCourseIds: current.carryovers.map((item) => item.attemptId),
          inputs: current.inputs,
          allowedGrades: calculator.gradingScheme.bands.map(
            (band) => band.label,
          ),
        })
      : { entries: [], errors: {} };
    const { entries: regularEntriesError, ...regularErrors } = built.errors;
    const { entries: carryoverEntriesError, ...carryoverErrors } =
      carryoverBuilt.errors;
    const nextErrors = {
      ...contextErrors,
      ...regularErrors,
      ...carryoverErrors,
      ...(current.carryovers.some((carryover) => {
        const course = validCourses.find(
          (item) => item.id === carryover.courseId,
        );
        return (
          !course ||
          (carryover.attemptType === "CARRYOVER" &&
            !isCarryoverEligible(
              course,
              current.levelId,
              current.termId,
              calculator.levels,
            ))
        );
      })
        ? {
            carryovers:
              "A selected carryover must be from a lower ordered Level in this same Term.",
          }
        : {}),
      ...(!built.entries.length && !carryoverBuilt.entries.length
        ? {
            entries:
              regularEntriesError ??
              carryoverEntriesError ??
              "Complete at least one Course.",
          }
        : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => errorRef.current?.focus());
      return null;
    }
    return {
      sessionId: current.sessionId,
      levelId: current.levelId,
      termId: current.termId,
      mode: current.mode,
      entries: [
        ...built.entries.map((entry) => ({
          attemptId: `attempt:${currentKey}:${entry.courseId}`,
          courseId: entry.courseId,
          value: "score" in entry ? String(entry.score) : entry.grade,
          attemptType: "REGULAR" as const,
        })),
        ...carryoverBuilt.entries.map((entry) => {
          const carryover = current.carryovers.find(
            (item) => item.attemptId === entry.courseId,
          )!;
          return {
            ...carryover,
            courseId: carryover.courseId,
            value: "score" in entry ? String(entry.score) : entry.grade,
            attemptType: carryover.attemptType,
          };
        }),
      ],
      updatedAt: new Date().toISOString(),
    } satisfies CalculationDraftGroup;
  }

  async function calculateCurrent(event?: FormEvent) {
    event?.preventDefault();
    const group = buildCurrentGroup();
    if (!group) return null;
    try {
      const response = await preview.mutateAsync({
        sessionId: group.sessionId,
        levelId: group.levelId,
        termId: group.termId,
        entries: entriesForGroup(group),
      });
      setPreviewKey(groupKey(group));
      return { group, response };
    } catch {
      requestAnimationFrame(() => errorRef.current?.focus());
      return null;
    }
  }

  async function addCurrent() {
    const calculated =
      preview.data && previewKey === currentKey
        ? { group: buildCurrentGroup(), response: preview.data }
        : await calculateCurrent();
    if (!calculated?.group) return;
    const previous = groups.find(
      (item) => groupKey(item) === groupKey(calculated.group!),
    );
    if (previous) {
      const retainedAttemptIds = new Set(
        calculated.group.entries.map((entry) => entry.attemptId),
      );
      const removedAttemptIds = new Set(
        previous.entries
          .filter((entry) => !retainedAttemptIds.has(entry.attemptId))
          .map((entry) => entry.attemptId),
      );
      const dependent = groups.some(
        (candidate) =>
          groupKey(candidate) !== groupKey(previous) &&
          candidate.entries.some(
            (entry) =>
              entry.repeatedFromId &&
              removedAttemptIds.has(entry.repeatedFromId),
          ),
      );
      if (dependent) {
        setWorkspaceNotice(
          "This edit removes an original attempt used by a later carryover. Remove the carryover attempt first.",
        );
        return;
      }
    }
    setWorkspaceNotice("");
    const next = [
      ...groups.filter(
        (item) => groupKey(item) !== groupKey(calculated.group!),
      ),
      calculated.group,
    ];
    setGroups(next);
    try {
      await aggregate.mutateAsync({ entries: next.flatMap(entriesForGroup) });
    } catch {}
  }

  async function removeGroup(group: CalculationDraftGroup) {
    const sourceAttemptIds = new Set(
      group.entries.map((entry) => entry.attemptId),
    );
    const dependent = groups.some(
      (candidate) =>
        groupKey(candidate) !== groupKey(group) &&
        candidate.entries.some(
          (entry) =>
            entry.repeatedFromId && sourceAttemptIds.has(entry.repeatedFromId),
        ),
    );
    if (dependent) {
      setWorkspaceNotice(
        "This Term contains an original attempt used by a later carryover. Remove the carryover attempt first.",
      );
      return;
    }
    setWorkspaceNotice("");
    const next = groups.filter((item) => groupKey(item) !== groupKey(group));
    setGroups(next);
    if (!next.length) aggregate.reset();
    else
      try {
        await aggregate.mutateAsync({ entries: next.flatMap(entriesForGroup) });
      } catch {}
  }

  function editGroup(group: CalculationDraftGroup) {
    setCurrent({
      mode: group.mode,
      sessionId: group.sessionId,
      levelId: group.levelId,
      termId: group.termId,
      inputs: Object.fromEntries(
        group.entries.map((entry) => [
          entry.originalLevelId ? entry.attemptId : entry.courseId,
          entry.value,
        ]),
      ),
      carryovers: group.entries
        .filter(
          (
            entry,
          ): entry is typeof entry & {
            originalLevelId: string;
            originalTermId: string;
          } =>
            Boolean(
              entry.originalLevelId && entry.originalTermId,
            ),
        )
        .map((entry) => ({
          attemptId: entry.attemptId,
          courseId: entry.courseId,
          originalLevelId: entry.originalLevelId,
          originalTermId: entry.originalTermId,
          attemptType: "CARRYOVER",
          repeatedFromId: entry.repeatedFromId,
        })),
    });
    preview.reset();
    setPreviewKey("");
    setErrors({});
    requestAnimationFrame(() => {
      const entry = document.getElementById("current-term-entry");
      if (typeof entry?.scrollIntoView === "function")
        entry.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function recalculateGroup() {
    try {
      await aggregate.mutateAsync({ entries: groups.flatMap(entriesForGroup) });
    } catch {}
  }

  function clearAll() {
    clearCalculatorDraft(calculator.id);
    setCurrent(emptyCurrent());
    setGroups([]);
    setErrors({});
    setPreviewKey("");
    setWorkspaceNotice("");
    preview.reset();
    aggregate.reset();
  }

  function addCarryover(courseId: string) {
    if (current.carryovers.some((item) => item.courseId === courseId)) return;
    const course = validCourses.find((item) => item.id === courseId);
    if (
      !course?.levelId ||
      !course.termId ||
      !isCarryoverEligible(
        course,
        current.levelId,
        current.termId,
        calculator.levels,
      )
    ) return;
    const attemptId = `carryover:${currentKey}:${courseId}`;
    setCurrent((draft) => ({
      ...draft,
      carryovers: [
        ...draft.carryovers,
        {
          attemptId,
          courseId,
          originalLevelId: course.levelId!,
          originalTermId: course.termId!,
          attemptType: "CARRYOVER",
        },
      ],
    }));
    setWorkspaceNotice("");
    preview.reset();
    setPreviewKey("");
  }

  function removeCarryover(attemptId: string) {
    setCurrent((draft) => {
      const inputs = { ...draft.inputs };
      delete inputs[attemptId];
      return {
        ...draft,
        inputs,
        carryovers: draft.carryovers.filter(
          (item) => item.attemptId !== attemptId,
        ),
      };
    });
    preview.reset();
    setPreviewKey("");
  }

  const label = (kind: "session" | "level" | "term", id: string) =>
    (kind === "session"
      ? calculator.sessions
      : kind === "level"
        ? calculator.levels
        : calculator.terms
    ).find((item) => item.id === id)?.name ?? "Unknown";
  const currentTotal = preview.data?.groups[0] ?? preview.data;
  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.75fr)] xl:items-start">
      <div className="space-y-7">
        {incompleteCount > 0 && (
          <div className="flex gap-3 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <p>
              <strong>Some courses are unavailable:</strong>{" "}
              {incompleteCount}{" "}
              {incompleteCount === 1 ? "course is" : "courses are"} missing a
              level, term, or credit units.
            </p>
          </div>
        )}
        {workspaceNotice && (
          <div
            role="alert"
            className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
          >
            {workspaceNotice}
          </div>
        )}
        <form
          onSubmit={(event) => void calculateCurrent(event)}
          id="current-term-entry"
          className="scroll-mt-5 border border-line bg-white p-5 sm:p-7"
        >
          <div className="flex flex-col justify-between gap-3 border-b border-line pb-5 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
                Results entry
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold">
                Enter your results
              </h2>
            </div>
            <button
              type="button"
              className="focus-ring self-start text-sm font-semibold text-red-700"
              onClick={clearAll}
            >
              Clear calculation
            </button>
          </div>
          <fieldset className="mt-6 grid gap-4 md:grid-cols-3">
            <legend className="sr-only">Academic period</legend>
            <label className="text-sm font-semibold">
              Session *
              <Select
                value={current.sessionId}
                onChange={(event) =>
                  setContext("sessionId", event.target.value)
                }
                className="mt-2 font-normal"
                aria-invalid={Boolean(errors.sessionId)}
              >
                <option value="">Select Session</option>
                {sortedSessions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
              <FieldError>{errors.sessionId}</FieldError>
            </label>
            <label className="text-sm font-semibold">
              Level *
              <Select
                value={current.levelId}
                onChange={(event) => setContext("levelId", event.target.value)}
                className="mt-2 font-normal"
                aria-invalid={Boolean(errors.levelId)}
              >
                <option value="">Select Level</option>
                {sortedLevels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
              <FieldError>{errors.levelId}</FieldError>
            </label>
            <label className="text-sm font-semibold">
              Term *
              <Select
                value={current.termId}
                onChange={(event) => setContext("termId", event.target.value)}
                className="mt-2 font-normal"
                aria-invalid={Boolean(errors.termId)}
              >
                <option value="">Select Term</option>
                {sortedTerms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
              <FieldError>{errors.termId}</FieldError>
            </label>
          </fieldset>
          {contextReady && (
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                {label("session", current.sessionId)}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                {label("level", current.levelId)}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                {label("term", current.termId)}
              </span>
            </div>
          )}
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">Input mode</legend>
            <div className="mt-2 inline-flex border border-line bg-cream p-1">
              {(["score", "grade"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={current.mode === mode}
                  onClick={() => {
                    setCurrent((draft) => ({ ...draft, mode, inputs: {} }));
                    preview.reset();
                    setPreviewKey("");
                  }}
                  className={`focus-ring min-h-10 px-5 text-sm font-semibold capitalize ${current.mode === mode ? "bg-ink text-white" : "text-muted"}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="mt-6 flex flex-col gap-2 border-y border-line py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">
                Carryover courses
              </p>
              <p className="mt-1 text-xs text-muted">
                Add a course from an earlier level. Its original
                result will remain unchanged.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={
                !contextReady ||
                currentLevelOrder == null ||
                availableCarryoverGroups.length === 0
              }
              onClick={() => setCarryoverOpen(true)}
            >
              <PlusCircle size={16} /> Add Carryover Course
            </Button>
          </div>
          <fieldset className="mt-6">
            <legend className="sr-only">Courses</legend>
            {!contextReady && (
              <p className="border border-dashed border-line p-8 text-center text-sm text-muted">
                Select a session, level, and term to view courses.
              </p>
            )}
            {contextReady && !courses.length && !current.carryovers.length && (
              <p className="border border-dashed border-line p-8 text-center text-sm text-muted">
                No courses are available for this level and term.
              </p>
            )}
            {courses.length + current.carryovers.length > 0 && (
              <div className="border border-line">
                <div className="border-b border-line bg-cream px-4 py-3">
                  <h3 className="font-semibold uppercase">
                    {label("term", current.termId)}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {courses.length + current.carryovers.length}{" "}
                    {courses.length + current.carryovers.length === 1
                      ? "course"
                      : "courses"}
                  </p>
                </div>
                {courses.map((course) => {
                  const error = errors[`entries.${course.id}`];
                  return (
                    <div
                      key={course.id}
                      className="grid gap-3 border-b border-line p-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_80px_170px] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="break-words font-semibold">
                          {course.code ? `${course.code} — ` : ""}
                          {course.name}
                        </p>
                        <p className="mt-1 text-xs text-muted sm:hidden">
                          {course.creditUnits} credit units
                        </p>
                      </div>
                      <p className="hidden text-sm font-semibold sm:block">
                        {course.creditUnits} units
                      </p>
                      <div>
                        {current.mode === "score" ? (
                          <Input
                            aria-label={`Score for ${course.name}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="any"
                            placeholder="Score 0–100"
                            value={current.inputs[course.id] ?? ""}
                            aria-invalid={Boolean(error)}
                            onChange={(event) => {
                              setCurrent((draft) => ({
                                ...draft,
                                inputs: {
                                  ...draft.inputs,
                                  [course.id]: event.target.value,
                                },
                              }));
                              preview.reset();
                              setPreviewKey("");
                            }}
                          />
                        ) : (
                          <Select
                            aria-label={`Grade for ${course.name}`}
                            value={current.inputs[course.id] ?? ""}
                            aria-invalid={Boolean(error)}
                            onChange={(event) => {
                              setCurrent((draft) => ({
                                ...draft,
                                inputs: {
                                  ...draft.inputs,
                                  [course.id]: event.target.value,
                                },
                              }));
                              preview.reset();
                              setPreviewKey("");
                            }}
                          >
                            <option value="">Select grade</option>
                            {calculator.gradingScheme.bands.map((band) => (
                              <option key={band.label} value={band.label}>
                                {band.label}
                              </option>
                            ))}
                          </Select>
                        )}
                        <FieldError>{error}</FieldError>
                      </div>
                    </div>
                  );
                })}
                {current.carryovers.map((carryover) => {
                  const course = validCourses.find(
                    (item) => item.id === carryover.courseId,
                  );
                  if (!course) return null;
                  const error = errors[`entries.${carryover.attemptId}`];
                  return (
                    <div
                      key={carryover.attemptId}
                      className="grid gap-3 border-b border-amber-200 bg-amber-50/60 p-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_80px_170px] sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-words font-semibold">
                            {course.code ? `${course.code} — ` : ""}
                            {course.name}
                          </p>
                          {carryover.attemptType === "CARRYOVER" && (
                            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                              Carryover
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          Originally {label("level", carryover.originalLevelId)}{" "}
                          · {label("term", carryover.originalTermId)}
                        </p>
                        <button
                          type="button"
                          className="focus-ring mt-2 text-xs font-semibold text-red-700"
                          onClick={() => removeCarryover(carryover.attemptId)}
                        >
                          Remove carryover
                        </button>
                      </div>
                      <p className="text-sm font-semibold">
                        {course.creditUnits} units
                      </p>
                      <div>
                        {current.mode === "score" ? (
                          <Input
                            aria-label={`Score for carryover ${course.name}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="any"
                            placeholder="New score 0–100"
                            value={current.inputs[carryover.attemptId] ?? ""}
                            aria-invalid={Boolean(error)}
                            onChange={(event) => {
                              setCurrent((draft) => ({
                                ...draft,
                                inputs: {
                                  ...draft.inputs,
                                  [carryover.attemptId]: event.target.value,
                                },
                              }));
                              preview.reset();
                              setPreviewKey("");
                            }}
                          />
                        ) : (
                          <Select
                            aria-label={`Grade for carryover ${course.name}`}
                            value={current.inputs[carryover.attemptId] ?? ""}
                            aria-invalid={Boolean(error)}
                            onChange={(event) => {
                              setCurrent((draft) => ({
                                ...draft,
                                inputs: {
                                  ...draft.inputs,
                                  [carryover.attemptId]: event.target.value,
                                },
                              }));
                              preview.reset();
                              setPreviewKey("");
                            }}
                          >
                            <option value="">Select new grade</option>
                            {calculator.gradingScheme.bands.map((band) => (
                              <option key={band.label} value={band.label}>
                                {band.label}
                              </option>
                            ))}
                          </Select>
                        )}
                        <FieldError>{error}</FieldError>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </fieldset>
          {(errors.entries ||
            errors.carryovers ||
            preview.isError ||
            aggregate.isError) && (
            <div className="mt-5" role="alert">
              <h3
                ref={errorRef}
                tabIndex={-1}
                className="font-semibold text-red-700 outline-none"
              >
                Check this Term
              </h3>
              {errors.entries && (
                <p className="mt-1 text-sm text-red-700">{errors.entries}</p>
              )}
              {errors.carryovers && (
                <p className="mt-1 text-sm text-red-700">{errors.carryovers}</p>
              )}
              <RequestError>
                {preview.isError
                  ? normalizeApiError(preview.error).message
                  : aggregate.isError
                    ? normalizeApiError(aggregate.error).message
                    : undefined}
              </RequestError>
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={
                preview.isPending ||
                courses.length + current.carryovers.length === 0
              }
            >
              <Calculator size={17} />
              {preview.isPending ? "Calculating…" : "Calculate this Term"}
            </Button>
            {preview.data && previewKey === currentKey && (
              <Button
                type="button"
                onClick={() => void addCurrent()}
                disabled={aggregate.isPending}
              >
                <Check size={17} />
                {groups.some((group) => groupKey(group) === currentKey)
                  ? "Update calculation"
                  : "Add to calculation"}
              </Button>
            )}
          </div>
          {preview.data && previewKey === currentKey && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border border-emerald-300 bg-emerald-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase text-emerald-800">
                  Current Term GPA
                </p>
                <p className="mt-1 font-display text-3xl font-semibold text-emerald-950">
                  {currentTotal?.gpa ?? "—"}
                </p>
              </div>
              <p className="text-xs text-emerald-900">
                Add this term to update your CGPA.
              </p>
            </div>
          )}
        </form>
        {aggregate.data && groups.length > 0 && (
          <Breakdown
            response={aggregate.data}
            calculator={calculator}
          />
        )}
      </div>
      <aside
        className="border border-line bg-white p-5 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-7.25rem)] xl:self-start xl:overflow-y-auto xl:overscroll-contain"
        aria-labelledby="my-calculation-heading"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              My calculation
            </p>
            <h2
              id="my-calculation-heading"
              className="mt-1 font-display text-2xl font-semibold"
            >
              Your results
            </h2>
          </div>
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
            {groups.length}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Saved on this device.
        </p>
        {!groups.length && (
          <p className="mt-5 border border-dashed border-line p-6 text-center text-sm text-muted">
            Add your first term.
          </p>
        )}
        <div className="mt-5 space-y-3">
          {groups.map((group) => {
            const total = resultGroup(aggregate.data, group);
            return (
              <article
                key={groupKey(group)}
                className={`border p-4 ${groupKey(group) === currentKey ? "border-blue-400 bg-blue-50/50" : "border-line"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {label("session", group.sessionId)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {label("level", group.levelId)} ·{" "}
                      {label("term", group.termId)}
                    </p>
                    {group.entries.some(
                      (entry) => entry.attemptType === "CARRYOVER",
                    ) && (
                      <p className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                        {
                          group.entries.filter(
                            (entry) => entry.attemptType === "CARRYOVER",
                          ).length
                        }{" "}
                        {group.entries.filter(
                          (entry) => entry.attemptType === "CARRYOVER",
                        ).length === 1
                          ? "carryover"
                          : "carryovers"}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-muted">
                      GPA
                    </p>
                    <p className="font-display text-2xl font-semibold">
                      {total?.gpa ?? (aggregate.isPending ? "…" : "—")}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="focus-ring inline-flex min-h-9 items-center gap-1.5 border border-line bg-white px-3 text-xs font-semibold"
                    onClick={() => editGroup(group)}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    className="focus-ring inline-flex min-h-9 items-center gap-1.5 border border-line bg-white px-3 text-xs font-semibold"
                    onClick={() => void recalculateGroup()}
                    disabled={aggregate.isPending}
                  >
                    <RefreshCw size={13} /> Recalculate
                  </button>
                  <button
                    className="focus-ring inline-flex min-h-9 items-center gap-1.5 border border-red-200 bg-white px-3 text-xs font-semibold text-red-700"
                    onClick={() => void removeGroup(group)}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {groups.length > 0 && (
          <div className="mt-5 bg-ink p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
              Current CGPA
            </p>
            <p className="mt-1 font-display text-4xl font-semibold">
              {aggregate.data?.cgpa ??
                aggregate.data?.gpa ??
                (aggregate.isPending ? "…" : "—")}
            </p>
            {aggregate.isError && (
              <p className="mt-2 text-xs text-red-200">
                {normalizeApiError(aggregate.error).message}
              </p>
            )}
          </div>
        )}
      </aside>
      <Dialog
        open={carryoverOpen}
        onClose={() => setCarryoverOpen(false)}
        title="Add Carryover Course"
        description="Choose a course from an earlier level. Existing results will not change."
        className="max-w-3xl!"
      >
        {currentLevelOrder == null && (
          <p className="border border-dashed border-line p-6 text-center text-sm text-muted">
            Carryover courses are unavailable for this level.
          </p>
        )}
        {currentLevelOrder != null &&
          availableCarryoverGroups.length === 0 && (
            <p className="border border-dashed border-line p-6 text-center text-sm text-muted">
              No earlier-level courses are available for this term.
            </p>
          )}
        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
          {availableCarryoverGroups.map(({ level, terms }) => (
            <section key={level.id} aria-labelledby={`carry-level-${level.id}`}>
              <h3
                id={`carry-level-${level.id}`}
                className="sticky top-0 border-b border-line bg-white py-2 font-display text-xl font-semibold uppercase"
              >
                {level.name}
              </h3>
              <div className="mt-3 space-y-4">
                {terms.map(({ term, courses: availableCourses }) => (
                  <section key={term.id}>
                    <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">
                      {term.name}
                    </h4>
                    <ul className="mt-2 divide-y divide-line border border-line">
                      {availableCourses.map((course) => (
                        <li
                          key={course.id}
                          className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="break-words font-semibold">
                              {course.code ? `${course.code} — ` : ""}
                              {course.name}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {course.creditUnits} credit units · Originally{" "}
                              {level.name}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => addCarryover(course.id)}
                          >
                            <PlusCircle size={15} /> Add repeat
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCarryoverOpen(false)}
          >
            Done
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export default function PublicCalculatorPage({
  calculatorId,
}: {
  calculatorId: string;
}) {
  const query = usePublicCalculator(calculatorId);
  if (query.isPending)
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
        <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-14">
          <Link
            href="/public-calculators"
            className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
          >
            <ArrowLeft size={15} /> All public calculators
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
      <section className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 md:px-10 md:py-12">
        <CalculatorWorkspace calculator={calculator} />
      </section>
      <Footer />
    </main>
  );
}
