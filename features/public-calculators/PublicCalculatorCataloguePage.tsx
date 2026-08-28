"use client";

import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { normalizeApiError } from "@/lib/api/errors";
import { usePublicCalculatorCatalogue } from "./hooks";

export default function PublicCalculatorCataloguePage() {
  const query = usePublicCalculatorCatalogue(20);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <main className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
            GPA calculators
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-none md:text-7xl">
            Public GPA calculators
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
            Choose a calculator to get started.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-20">
        {query.isPending && (
          <>
            <p role="status" className="sr-only">
              Loading public calculators…
            </p>
            <div className="grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="bg-white p-6">
                  <Skeleton className="h-48" />
                </div>
              ))}
            </div>
          </>
        )}
        {query.isError && (
          <div role="alert" className="border border-line bg-white p-6">
            <h2 className="font-display text-2xl font-semibold">
              Calculators could not be loaded
            </h2>
            <p className="mt-2 text-sm text-muted">
              {normalizeApiError(query.error).message}
            </p>
            <button
              className="focus-ring mt-4 text-sm font-semibold text-blue-700"
              onClick={() => void query.refetch()}
            >
              Try again
            </button>
          </div>
        )}
        {!query.isPending && !query.isError && items.length === 0 && (
          <div className="border border-dashed border-line bg-white p-12 text-center">
            <Calculator className="mx-auto text-muted" />
            <h2 className="mt-4 font-display text-2xl font-semibold">
              No published calculators yet
            </h2>
            <p className="mt-2 text-sm text-muted">
              Published calculators will appear here.
            </p>
          </div>
        )}
        {items.length > 0 && (
          <div className="grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/public-calculator/${encodeURIComponent(item.id)}`}
                className="focus-ring group bg-white p-6 transition-colors hover:bg-cream"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-line text-blue-700">
                  <Calculator size={18} />
                </span>
                <h2 className="mt-5 font-display text-2xl font-semibold">
                  {item.title}
                </h2>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {[item.institutionName, item.departmentName]
                    .filter(Boolean)
                    .join(" · ") || "Independent calculator"}
                </p>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">
                  {item.description ||
                    "Enter your results and calculate your GPA."}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                  Open calculator{" "}
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            ))}
          </div>
        )}
        {query.hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
        {query.isFetchNextPageError && (
          <p role="alert" className="mt-4 text-center text-sm text-red-700">
            {normalizeApiError(query.error).message}
          </p>
        )}
      </section>
      <Footer />
    </main>
  );
}
