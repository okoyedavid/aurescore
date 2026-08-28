"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { Check, Copy, ExternalLink, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import AppShell from "@/features/app-shell/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/FormField";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import {
  FieldError,
  RequestError,
} from "@/features/workspace/components/FieldError";
import CourseManager from "./components/CourseManager";
import DimensionManager from "./components/DimensionManager";
import { GradingBandEditor } from "./components/GradingBandEditor";
import { useCalculatorMutations, useCreatorCalculator } from "./hooks";
import type { CreatorCalculatorDetail } from "./types";
import {
  buildGradingScheme,
  normalizeIdentity,
  validateIdentity,
  type CalculatorFieldErrors,
  type GradingBandDraft,
} from "./validation";
import { missingCourseFields } from "./hierarchy";

const tabs = [
  "overview",
  "courses",
  "sessions",
  "terms",
  "levels",
  "grading",
  "publish",
] as const;
type Tab = (typeof tabs)[number];

function OverviewEditor({
  calculator,
}: {
  calculator: CreatorCalculatorDetail;
}) {
  const mutations = useCalculatorMutations(calculator.id);
  const [errors, setErrors] = useState<CalculatorFieldErrors>({});
  const locked = useRef(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || mutations.update.isPending) return;
    const data = new FormData(event.currentTarget);
    const input = normalizeIdentity({
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      institutionName: String(data.get("institutionName") ?? ""),
      departmentName: String(data.get("departmentName") ?? ""),
    });
    const next = validateIdentity(input);
    setErrors(next);
    mutations.update.reset();
    if (Object.keys(next).length) return;
    locked.current = true;
    try {
      await mutations.update.mutateAsync(input);
    } catch {
    } finally {
      locked.current = false;
    }
  }
  return (
    <section aria-labelledby="calculator-overview-heading">
      <h2
        id="calculator-overview-heading"
        className="font-display text-2xl font-semibold"
      >
        Overview
      </h2>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        Update the branding shown on the public calculator and report.
      </p>
      <form
        onSubmit={save}
        noValidate
        className="app-panel mt-5 max-w-3xl space-y-4 border border-[var(--app-border)] p-5 sm:p-6"
      >
        <label className="block text-sm font-semibold">
          Title
          <Input
            name="title"
            autoFocus
            defaultValue={calculator.title}
            className="mt-1"
            aria-invalid={Boolean(errors.title)}
          />
          <FieldError>{errors.title}</FieldError>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Institution
            <Input
              name="institutionName"
              defaultValue={calculator.institutionName ?? ""}
              className="mt-1"
            />
          </label>
          <label className="text-sm font-semibold">
            Department
            <Input
              name="departmentName"
              defaultValue={calculator.departmentName ?? ""}
              className="mt-1"
            />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Description
          <Textarea
            name="description"
            rows={3}
            defaultValue={calculator.description ?? ""}
            className="mt-1"
          />
        </label>
        <RequestError>
          {mutations.update.isError
            ? normalizeApiError(mutations.update.error).message
            : undefined}
        </RequestError>
        <Button type="submit" disabled={mutations.update.isPending}>
          {mutations.update.isPending ? "Saving…" : "Save overview"}
        </Button>
      </form>
    </section>
  );
}

function GradingEditor({
  calculator,
}: {
  calculator: CreatorCalculatorDetail;
}) {
  const mutations = useCalculatorMutations(calculator.id);
  const [maxGradePoint, setMaxGradePoint] = useState(
    calculator.gradingScheme?.maxGradePoint ?? "5",
  );
  const [bands, setBands] = useState<GradingBandDraft[]>(
    calculator.gradingScheme?.bands.map((band, index) => ({
      rowId: index + 1,
      label: band.label,
      minScore: String(band.minScore),
      gradePoint: String(band.gradePoint),
    })) ?? [],
  );
  const [errors, setErrors] = useState<CalculatorFieldErrors>({});
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutations.update.isPending) return;
    const built = buildGradingScheme({ maxGradePoint, bands });
    setErrors(built.errors);
    mutations.update.reset();
    if (!built.input) return;
    try {
      await mutations.update.mutateAsync({ gradingScheme: built.input });
    } catch {}
  }
  return (
    <section aria-labelledby="calculator-grading-heading">
      <h2
        id="calculator-grading-heading"
        className="font-display text-2xl font-semibold"
      >
        Grading Scheme
      </h2>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        Saving replaces the complete grading configuration and may unpublish the
        calculator.
      </p>
      <form
        onSubmit={save}
        noValidate
        className="app-panel mt-5 max-w-4xl space-y-5 border border-[var(--app-border)] p-5 sm:p-6"
      >
        <GradingBandEditor
          maxGradePoint={maxGradePoint}
          setMaxGradePoint={setMaxGradePoint}
          bands={bands}
          setBands={setBands}
          errors={errors}
        />
        <RequestError>
          {mutations.update.isError
            ? normalizeApiError(mutations.update.error).message
            : undefined}
        </RequestError>
        <Button type="submit" disabled={mutations.update.isPending}>
          {mutations.update.isPending ? "Saving…" : "Save complete scheme"}
        </Button>
      </form>
    </section>
  );
}

function PublishPanel({ calculator }: { calculator: CreatorCalculatorDetail }) {
  const router = useRouter();
  const mutations = useCalculatorMutations(calculator.id);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  const checks = [
    {
      label: "Grading scheme configured",
      ready: Boolean(calculator.gradingScheme),
    },
    { label: "At least one Course", ready: calculator.courses.length > 0 },
    { label: "At least one Session", ready: calculator.sessions.length > 0 },
    { label: "At least one Level", ready: calculator.levels.length > 0 },
    { label: "At least one Term", ready: calculator.terms.length > 0 },
    {
      label: "Every Course has positive credit units",
      ready:
        calculator.courses.length > 0 &&
        calculator.courses.every((course) => Number(course.creditUnits) > 0),
    },
    {
      label: "Every Course has a Level and Term",
      ready:
        calculator.courses.length > 0 &&
        calculator.courses.every(
          (course) => !missingCourseFields(course).length,
        ),
    },
  ];
  const publication = calculator.isPublished
    ? mutations.unpublish
    : mutations.publish;
  const path =
    calculator.publicPath ??
    `/public-calculator/${encodeURIComponent(calculator.id)}`;

  async function toggle() {
    publication.reset();
    try {
      await publication.mutateAsync();
      setNotice(
        calculator.isPublished
          ? "Calculator unpublished."
          : "Calculator published. Its public link is now available.",
      );
    } catch {}
  }
  async function copy() {
    await navigator.clipboard.writeText(
      new URL(path, window.location.origin).href,
    );
    setNotice("Public link copied.");
  }
  async function remove() {
    if (mutations.remove.isPending) return;
    try {
      await mutations.remove.mutateAsync();
      router.replace("/dashboard/public-calculators");
    } catch {}
  }
  return (
    <section aria-labelledby="calculator-publish-heading">
      <h2
        id="calculator-publish-heading"
        className="font-display text-2xl font-semibold"
      >
        Review, publish, and share
      </h2>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        Sessions remain optional. Configuration changes may unpublish a
        previously shared calculator.
      </p>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="app-panel border border-[var(--app-border)] p-5">
          <h3 className="font-semibold">Readiness checklist</h3>
          <ul className="mt-4 space-y-3">
            {checks.map((check) => (
              <li key={check.label} className="flex items-center gap-3 text-xs">
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 items-center justify-center border ${check.ready ? "border-emerald-500 text-emerald-600" : "border-amber-500 text-amber-700"}`}
                >
                  {check.ready ? <Check size={14} /> : <X size={14} />}
                </span>
                <span>
                  {check.label}: {check.ready ? "Ready" : "Needs attention"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="app-panel border border-[var(--app-border)] p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Publication</h3>
            <span className="text-xs font-semibold">
              {calculator.isPublished ? "Published" : "Unpublished"}
            </span>
          </div>
          <p className="mt-3 break-all text-xs text-[var(--app-muted)]">
            {path}
          </p>
          {!calculator.isPublished && (
            <p className="mt-3 text-xs text-amber-700">
              The link is unavailable publicly until publication succeeds.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              disabled={
                publication.isPending ||
                (!calculator.isPublished &&
                  checks.some((check) => !check.ready))
              }
              onClick={() => void toggle()}
            >
              {publication.isPending
                ? "Working…"
                : calculator.isPublished
                  ? "Unpublish"
                  : "Publish"}
            </Button>
            <Button variant="outline" onClick={() => void copy()}>
              <Copy size={15} /> Copy link
            </Button>
            {calculator.isPublished && (
              <Link
                href={path}
                target="_blank"
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-sm border border-[var(--app-border)] px-3 text-xs font-semibold"
              >
                Open public page <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
      {(notice || publication.isError) && (
        <p
          role={publication.isError ? "alert" : "status"}
          aria-live="polite"
          className={`mt-4 border p-3 text-xs ${publication.isError ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-800"}`}
        >
          {publication.isError
            ? normalizeApiError(publication.error).message
            : notice}
        </p>
      )}
      <div className="mt-8 border border-red-300/70 p-5">
        <h3 className="font-display text-xl font-semibold">
          Delete calculator
        </h3>
        <p className="mt-2 text-xs text-[var(--app-muted)]">
          Deletion permanently removes its configuration and public
          availability.
        </p>
        <Button
          className="mt-4 bg-red-700 hover:bg-red-600"
          onClick={() => {
            mutations.remove.reset();
            setDeleting(true);
          }}
        >
          <Trash2 size={15} /> Delete calculator
        </Button>
      </div>
      <Dialog
        open={deleting}
        onClose={() => !mutations.remove.isPending && setDeleting(false)}
        title="Delete public calculator?"
        description={`Delete “${calculator.title}”? This cannot be undone.`}
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
            onClick={() => setDeleting(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-700 hover:bg-red-600"
            disabled={mutations.remove.isPending}
            onClick={() => void remove()}
          >
            {mutations.remove.isPending ? "Deleting…" : "Delete calculator"}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

export default function PublicCalculatorManagementPage({
  calculatorId,
  initialTab = "overview",
}: {
  calculatorId: string;
  initialTab?: string;
}) {
  const query = useCreatorCalculator(calculatorId);
  const [tab, setTab] = useState<Tab>(
    tabs.includes(initialTab as Tab) ? (initialTab as Tab) : "overview",
  );
  function changeTab(next: Tab) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }
  return (
    <AppShell area="dashboard">
      <div className="mx-auto w-full max-w-[1500px] px-[clamp(20px,4.5vw,72px)] pb-[72px] pt-[clamp(28px,4vw,58px)] max-[900px]:px-5">
        {query.isPending && (
          <div className="space-y-5">
            <p role="status" className="sr-only">
              Loading calculator management…
            </p>
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-16 rounded-none" />
            <Skeleton className="h-72 rounded-none" />
          </div>
        )}
        {query.isError && (
          <section
            role="alert"
            className="app-panel border border-[var(--app-border)] p-5"
          >
            <h1 className="font-display text-2xl font-semibold">
              Calculator unavailable
            </h1>
            <p className="mt-2 text-xs text-[var(--app-muted)]">
              {normalizeApiError(query.error).status === 404
                ? "This calculator does not exist or is not accessible to your account."
                : normalizeApiError(query.error).message}
            </p>
            <div className="mt-4 flex gap-5">
              <Link
                href="/dashboard/public-calculators"
                className="text-xs font-semibold text-blue-600"
              >
                All calculators
              </Link>
              <button
                className="text-xs font-semibold text-blue-600"
                onClick={() => void query.refetch()}
              >
                Try again
              </button>
            </div>
          </section>
        )}
        {query.data && (
          <>
            <Link
              href="/dashboard/public-calculators"
              className="focus-ring text-[10px] font-bold uppercase tracking-[0.13em] text-blue-600"
            >
              ← All public calculators
            </Link>
            <header className="mt-5 flex flex-col gap-4 border-b border-[var(--app-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-display text-[clamp(38px,4vw,50px)] font-medium leading-none tracking-[-0.045em]">
                  {query.data.title}
                </h1>
                <p className="mt-2.5 text-xs text-[var(--app-muted)]">
                  {query.data.institutionName || "No institution"}
                  {query.data.departmentName
                    ? ` · ${query.data.departmentName}`
                    : ""}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${query.data.isPublished ? "bg-emerald-500" : "bg-amber-500"}`}
                />
                {query.data.isPublished ? "Published" : "Unpublished"}
              </span>
            </header>
            <nav
              aria-label="Calculator sections"
              className="overflow-x-auto border-b border-[var(--app-border)]"
            >
              <ul className="flex min-w-max gap-6 pt-5">
                {tabs.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      aria-current={tab === item ? "page" : undefined}
                      onClick={() => changeTab(item)}
                      className={`focus-ring block pb-3 text-[11px] font-semibold capitalize ${tab === item ? "border-b-2 border-blue-600 text-blue-600" : "text-[var(--app-muted)] hover:text-[var(--app-text)]"}`}
                    >
                      {item === "grading" ? "Grading Scheme" : item}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-7">
              {tab === "overview" && (
                <OverviewEditor
                  key={query.data.updatedAt}
                  calculator={query.data}
                />
              )}
              {tab === "courses" && (
                <CourseManager
                  calculatorId={calculatorId}
                  terms={query.data.terms}
                  levels={query.data.levels}
                />
              )}
              {tab === "sessions" && (
                <DimensionManager
                  calculatorId={calculatorId}
                  resource="sessions"
                />
              )}
              {tab === "terms" && (
                <DimensionManager
                  calculatorId={calculatorId}
                  resource="terms"
                />
              )}
              {tab === "levels" && (
                <DimensionManager
                  calculatorId={calculatorId}
                  resource="levels"
                />
              )}
              {tab === "grading" && (
                <GradingEditor
                  key={query.data.gradingScheme?.updatedAt ?? "empty"}
                  calculator={query.data}
                />
              )}
              {tab === "publish" && <PublishPanel calculator={query.data} />}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
