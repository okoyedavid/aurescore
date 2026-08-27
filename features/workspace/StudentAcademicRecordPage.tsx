"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import WorkspaceChrome from "./components/WorkspaceChrome";
import { RequestError } from "./components/FieldError";
import {
  useResultMutations,
  useStudentAcademicRecord,
} from "./records-hooks";
import type {
  AcademicRecordGroup,
  AcademicRecordResult,
  SavedAcademicSummaryWithLabels,
} from "./types";

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function scoreText(value: unknown) {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  return JSON.stringify(value);
}

function scopeName(group: AcademicRecordGroup) {
  return [
    group.session.name,
    group.term?.name,
    group.level?.code || group.level?.name,
  ]
    .filter(Boolean)
    .join(" · ");
}

function ResultDetails({ result }: { result: AcademicRecordResult }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
      <div className="col-span-2">
        <dt className="text-[var(--app-muted)]">Component scores</dt>
        <dd className="mt-1 flex flex-wrap gap-2">
          {Object.entries(result.scores).map(([key, value]) => (
            <span
              key={key}
              className="border border-[var(--app-border)] px-2 py-1"
            >
              {key}: {scoreText(value)}
            </span>
          ))}
        </dd>
      </div>
      <div>
        <dt className="text-[var(--app-muted)]">Total score</dt>
        <dd>{result.totalScore}</dd>
      </div>
      <div>
        <dt className="text-[var(--app-muted)]">Grade</dt>
        <dd>{result.grade ?? "Not resolved"}</dd>
      </div>
      <div>
        <dt className="text-[var(--app-muted)]">Grade point</dt>
        <dd>{result.gradePoint ?? "Not resolved"}</dd>
      </div>
      <div>
        <dt className="text-[var(--app-muted)]">Credit units</dt>
        <dd>{result.creditUnits ?? "Not configured"}</dd>
      </div>
    </dl>
  );
}

function ResultGroup({
  group,
  onDelete,
}: {
  group: AcademicRecordGroup;
  onDelete: (result: AcademicRecordResult) => void;
}) {
  return (
    <section
      className="app-panel border border-[var(--app-border)]"
      aria-label={scopeName(group)}
    >
      <header className="border-b border-[var(--app-border)] p-4">
        <h3 className="font-display text-lg font-semibold">
          {scopeName(group)}
        </h3>
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          Every row is a complete saved Result. GPA coverage requires one row
          for every CourseOffering in the selected scope.
        </p>
      </header>
      {group.results.length === 0 ? (
        <p className="p-6 text-xs text-[var(--app-muted)]">
          No results in this group.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] text-left text-xs">
              <caption className="sr-only">
                Results for {scopeName(group)}
              </caption>
              <thead className="app-panel">
                <tr>
                  <th className="p-3">Course</th>
                  <th className="p-3">Component scores</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3">Grade point</th>
                  <th className="p-3">Credit units</th>
                  <th className="p-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.results.map((result) => (
                  <tr
                    key={result.id}
                    className="border-t border-[var(--app-border)]"
                  >
                    <th scope="row" className="p-3 font-semibold">
                      {result.course.code ? `${result.course.code} — ` : ""}
                      {result.course.name}
                    </th>
                    <td className="p-3">
                      <span className="flex flex-wrap gap-1">
                        {Object.entries(result.scores).map(([key, value]) => (
                          <span
                            key={key}
                            className="border border-[var(--app-border)] px-1.5 py-0.5"
                          >
                            {key}: {scoreText(value)}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="p-3">{result.totalScore}</td>
                    <td className="p-3">{result.grade ?? "Not resolved"}</td>
                    <td className="p-3">
                      {result.gradePoint ?? "Not resolved"}
                    </td>
                    <td className="p-3">
                      {result.creditUnits ?? "Not configured"}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        className="app-icon-button text-red-600"
                        aria-label={`Delete result for ${result.course.name}`}
                        onClick={() => onDelete(result)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-[var(--app-border)] md:hidden">
            {group.results.map((result) => (
              <li key={result.id} className="p-4">
                <h4 className="mb-3 font-semibold">
                  {result.course.code ? `${result.course.code} — ` : ""}
                  {result.course.name}
                </h4>
                <ResultDetails result={result} />
                <Button
                  variant="ghost"
                  className="mt-3 min-h-9 px-3 text-xs text-red-700"
                  onClick={() => onDelete(result)}
                >
                  <Trash2 size={15} /> Delete result
                  <span className="sr-only"> for {result.course.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function SummaryCard({ summary }: { summary: SavedAcademicSummaryWithLabels }) {
  const scope = [
    summary.session.name,
    summary.term?.name,
    summary.level?.code || summary.level?.name,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="app-panel border-b border-r border-[var(--app-border)] p-5">
      <h3 className="font-semibold">{scope}</h3>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        Calculated {dateTime(summary.calculatedAt)}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-[var(--app-muted)]">GPA</dt>
          <dd className="font-display text-xl font-semibold">{summary.gpa}</dd>
        </div>
        <div>
          <dt className="text-[var(--app-muted)]">CGPA</dt>
          <dd className="font-display text-xl font-semibold">
            {summary.cgpa ?? "Not available"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--app-muted)]">Credit units</dt>
          <dd>{summary.totalCreditUnits}</dd>
        </div>
        <div>
          <dt className="text-[var(--app-muted)]">Quality points</dt>
          <dd>{summary.totalQualityPoints}</dd>
        </div>
        <div>
          <dt className="text-[var(--app-muted)]">Cumulative units</dt>
          <dd>{summary.cumulativeCreditUnits ?? "Not available"}</dd>
        </div>
        <div>
          <dt className="text-[var(--app-muted)]">Cumulative points</dt>
          <dd>{summary.cumulativeQualityPoints ?? "Not available"}</dd>
        </div>
      </dl>
    </li>
  );
}

function AcademicRecord({
  workspaceId,
  studentId,
}: {
  workspaceId: string;
  studentId: string;
}) {
  const query = useStudentAcademicRecord(workspaceId, studentId);
  const resultMutations = useResultMutations(workspaceId);
  const [deleting, setDeleting] = useState<AcademicRecordResult | null>(null);
  const base = `/workspace/${encodeURIComponent(workspaceId)}`;
  if (query.isPending)
    return (
      <div className="space-y-4" aria-label="Loading academic record">
        <Skeleton className="h-24 rounded-none" />
        <Skeleton className="h-64 rounded-none" />
      </div>
    );
  if (query.isError || !query.data) {
    const error = normalizeApiError(query.error);
    return (
      <section
        className="app-panel border border-[var(--app-border)] p-5"
        role="alert"
      >
        <h2 className="font-display text-2xl font-semibold">
          Academic record unavailable
        </h2>
        <p className="mt-2 text-xs text-[var(--app-muted)]">
          {error.status === 404
            ? "This student or workspace does not exist or is not accessible."
            : error.message}
        </p>
        <button
          className="focus-ring mt-4 text-xs font-semibold text-blue-600"
          onClick={() => void query.refetch()}
        >
          Try again
        </button>
      </section>
    );
  }
  const { student, groups, savedSummaries, hasSavedSummaries } = query.data;
  return (
    <>
      <Link
        href={`${base}/students`}
        className="focus-ring text-[10px] font-bold uppercase tracking-[0.13em] text-blue-600"
      >
        ← Students
      </Link>
      <header className="mt-4 flex flex-col gap-4 border-b border-[var(--app-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.13em] text-blue-600">
            Academic record
          </p>
          <h2 className="font-display text-3xl font-semibold">
            {student.name}
          </h2>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            {student.matricNumber || "No matric number"}
          </p>
        </div>
        <ButtonLink
          href={`${base}/gpa?student=${encodeURIComponent(student.id)}`}
        >
          Calculate GPA <ArrowRight size={16} />
        </ButtonLink>
      </header>

      <section className="mt-7" aria-labelledby="saved-summaries-heading">
        <div className="flex items-center gap-2">
          <BookOpen size={18} />
          <h2
            id="saved-summaries-heading"
            className="font-display text-xl font-semibold"
          >
            Saved GPA and CGPA summaries
          </h2>
        </div>
        {!hasSavedSummaries ? (
          <p className="app-panel mt-4 border border-dashed border-[var(--app-border)] p-8 text-center text-xs text-[var(--app-muted)]">
            No saved summaries. Opening this record does not calculate or save
            GPA.
          </p>
        ) : (
          <ul className="mt-4 grid border-l border-t border-[var(--app-border)] lg:grid-cols-2">
            {savedSummaries.map((summary) => (
              <SummaryCard key={summary.id} summary={summary} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-labelledby="academic-results-heading">
        <h2
          id="academic-results-heading"
          className="font-display text-xl font-semibold"
        >
          Grouped results
        </h2>
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          Grades and grade points shown here are returned by the backend; they
          are not inferred in the browser.
        </p>
        {groups.length === 0 ? (
          <p className="app-panel mt-4 border border-dashed border-[var(--app-border)] p-8 text-center text-xs text-[var(--app-muted)]">
            No academic results are available.
          </p>
        ) : (
          <div className="mt-4 space-y-5">
            {groups.map((group, index) => (
              <ResultGroup
                key={`${group.session.id}-${group.term?.id ?? "session"}-${group.level?.id ?? "all"}-${index}`}
                group={group}
                onDelete={(result) => {
                  resultMutations.remove.reset();
                  setDeleting(result);
                }}
              />
            ))}
          </div>
        )}
      </section>
      <Dialog
        open={Boolean(deleting)}
        onClose={() =>
          !resultMutations.remove.isPending && setDeleting(null)
        }
        title="Delete result?"
        description={`Delete ${student.name}'s result for ${deleting?.course.name ?? "this course"}? This cannot be undone.`}
      >
        <RequestError>
          {resultMutations.remove.isError
            ? normalizeApiError(resultMutations.remove.error).message
            : undefined}
        </RequestError>
        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={resultMutations.remove.isPending}
            onClick={() => setDeleting(null)}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-600"
            disabled={resultMutations.remove.isPending}
            onClick={async () => {
              if (!deleting) return;
              try {
                await resultMutations.remove.mutateAsync({
                  id: deleting.id,
                  studentId: student.id,
                });
                setDeleting(null);
              } catch {}
            }}
          >
            {resultMutations.remove.isPending ? "Deleting…" : "Delete result"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export default function StudentAcademicRecordPage({
  workspaceId,
  studentId,
}: {
  workspaceId: string;
  studentId: string;
}) {
  return (
    <WorkspaceChrome workspaceId={workspaceId}>
      {() => <AcademicRecord workspaceId={workspaceId} studentId={studentId} />}
    </WorkspaceChrome>
  );
}
