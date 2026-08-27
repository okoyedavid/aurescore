"use client";

import Link from "next/link";
import { useState } from "react";
import { Calculator, Copy, ExternalLink, Trash2 } from "lucide-react";
import AppShell from "@/features/app-shell/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import { publicCalculatorsApi } from "./api";
import { useCalculatorMutations, useCreatorCalculators } from "./hooks";
import type { CreatorCalculatorSummary } from "./types";

function date(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function CalculatorCard({
  calculator,
}: {
  calculator: CreatorCalculatorSummary;
}) {
  const mutations = useCalculatorMutations(calculator.id);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  const publication = calculator.isPublished
    ? mutations.unpublish
    : mutations.publish;
  const actionError =
    (publication.isError && normalizeApiError(publication.error).message) ||
    (mutations.remove.isError &&
      normalizeApiError(mutations.remove.error).message);

  async function copyLink() {
    try {
      const detail = await publicCalculatorsApi.creatorDetail(calculator.id);
      const path =
        detail.publicPath ??
        `/public-calculator/${encodeURIComponent(calculator.id)}`;
      await navigator.clipboard.writeText(
        new URL(path, window.location.origin).href,
      );
      setNotice("Public link copied.");
    } catch (error) {
      setNotice(normalizeApiError(error).message);
    }
  }

  async function togglePublication() {
    try {
      await publication.mutateAsync();
      setNotice(
        calculator.isPublished
          ? "Calculator unpublished."
          : "Calculator published.",
      );
    } catch {}
  }

  async function remove() {
    if (mutations.remove.isPending) return;
    try {
      await mutations.remove.mutateAsync();
      setDeleting(false);
    } catch {}
  }

  return (
    <article className="app-panel flex min-w-0 flex-col border-b border-r border-[var(--app-border)] p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center border border-[var(--app-border)] text-blue-600">
          <Calculator size={18} />
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-semibold">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${calculator.isPublished ? "bg-emerald-500" : "bg-amber-500"}`}
          />
          {calculator.isPublished ? "Published" : "Unpublished"}
        </span>
      </div>
      <h2 className="mt-5 font-display text-xl font-semibold">
        {calculator.title}
      </h2>
      <p className="mt-1 text-xs text-[var(--app-muted)]">
        {[calculator.institutionName, calculator.departmentName]
          .filter(Boolean)
          .join(" · ") || "No institution details"}
      </p>
      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--app-muted)]">
        {calculator.description || "No description provided."}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-2 border-y border-[var(--app-border)] py-3 text-xs sm:grid-cols-4">
        {(
          [
            ["Sessions", calculator._count.sessions],
            ["Terms", calculator._count.terms],
            ["Levels", calculator._count.levels],
            ["Courses", calculator._count.courses],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="text-[var(--app-muted)]">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[10px] text-[var(--app-muted)]">
        Updated {date(calculator.updatedAt)}
      </p>
      {!calculator.isPublished && (
        <p className="mt-3 text-xs text-amber-700">
          Its public link is unavailable until it is published.
        </p>
      )}
      {(notice || actionError) && (
        <p
          role={actionError ? "alert" : "status"}
          className={`mt-3 text-xs ${actionError ? "text-red-600" : "text-blue-600"}`}
        >
          {actionError || notice}
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Link
          href={`/dashboard/public-calculators/${encodeURIComponent(calculator.id)}`}
          className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-sm border border-[var(--app-border)] px-3 text-xs font-semibold hover:bg-[var(--app-hover)]"
        >
          Open <ExternalLink size={14} />
        </Link>
        <Button
          className="min-h-10! px-3!"
          variant="outline"
          disabled={publication.isPending}
          onClick={() => void togglePublication()}
        >
          {publication.isPending
            ? "Working…"
            : calculator.isPublished
              ? "Unpublish"
              : "Publish"}
        </Button>
        <Button
          className="min-h-10! px-3!"
          variant="outline"
          onClick={() => void copyLink()}
        >
          <Copy size={14} /> Copy link
        </Button>
        <button
          className="app-icon-button text-red-600"
          aria-label={`Delete ${calculator.title}`}
          onClick={() => {
            mutations.remove.reset();
            setDeleting(true);
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>
      <Dialog
        open={deleting}
        onClose={() => !mutations.remove.isPending && setDeleting(false)}
        title="Delete public calculator?"
        description={`Delete “${calculator.title}”? Its public link will stop working immediately.`}
      >
        {mutations.remove.isError && (
          <p
            role="alert"
            className="border border-red-200 bg-red-50 p-3 text-xs text-red-700"
          >
            {normalizeApiError(mutations.remove.error).message}
          </p>
        )}
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
    </article>
  );
}

export default function CreatorCalculatorsPage() {
  const query = useCreatorCalculators();
  return (
    <AppShell area="dashboard">
      <div className="mx-auto w-full max-w-[1500px] px-[clamp(20px,4.5vw,72px)] pb-[72px] pt-[clamp(28px,4vw,58px)] max-[900px]:px-5 max-[900px]:pb-14 max-[900px]:pt-7">
        <header className="flex items-end justify-between gap-6 border-b border-[var(--app-border)] pb-6 max-[650px]:flex-col max-[650px]:items-stretch">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-blue-600">
              Shareable tools
            </p>
            <h1 className="font-display text-[clamp(38px,4vw,50px)] font-medium leading-none tracking-[-0.045em]">
              Public calculators
            </h1>
            <p className="mt-2.5 max-w-2xl text-xs text-[var(--app-muted)]">
              Configure branded calculators without creating Students or
              Results.
            </p>
          </div>
          <Link
            href="/dashboard/public-calculators/new"
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-sm border border-[var(--app-border)] bg-[var(--app-panel)] px-4 text-xs font-semibold hover:bg-[var(--app-hover)]"
          >
            Create calculator
          </Link>
        </header>
        {query.isPending && (
          <>
            <p role="status" className="sr-only">
              Loading public calculators…
            </p>
            <div className="mt-8 grid border-l border-t border-[var(--app-border)] md:grid-cols-2">
              <Skeleton className="h-72 rounded-none border-b border-r border-[var(--app-border)]" />
              <Skeleton className="h-72 rounded-none border-b border-r border-[var(--app-border)]" />
            </div>
          </>
        )}
        {query.isError && (
          <section
            role="alert"
            className="app-panel mt-8 border border-[var(--app-border)] p-5"
          >
            <h2 className="font-display text-2xl font-semibold">
              Calculators unavailable
            </h2>
            <p className="mt-2 text-xs text-[var(--app-muted)]">
              {normalizeApiError(query.error).message}
            </p>
            <button
              className="focus-ring mt-4 text-xs font-semibold text-blue-600"
              onClick={() => void query.refetch()}
            >
              Try again
            </button>
          </section>
        )}
        {query.data?.length === 0 && (
          <section className="app-panel mt-8 border border-dashed border-[var(--app-border)] p-12 text-center">
            <Calculator className="mx-auto text-[var(--app-muted)]" />
            <h2 className="mt-4 font-display text-2xl font-semibold">
              No public calculators yet
            </h2>
            <p className="mt-2 text-xs text-[var(--app-muted)]">
              Create one, add Courses, then publish its anonymous share link.
            </p>
          </section>
        )}
        {query.data && query.data.length > 0 && (
          <div className="mt-8 grid border-l border-t border-[var(--app-border)] md:grid-cols-2">
            {query.data.map((calculator) => (
              <CalculatorCard key={calculator.id} calculator={calculator} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
