import Link from "next/link";
import { ArrowRight, Check, type LucideIcon } from "lucide-react";
import Footer from "@/components/layout/Footer";
import MotionProvider from "@/components/layout/MotionProvider";
import SiteHeader from "@/components/layout/SiteHeader";

export type MarketingSection = {
  icon: LucideIcon;
  title: string;
  copy: string;
  points: string[];
};

export default function MarketingShell({
  eyebrow,
  title,
  intro,
  sections,
  note,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: MarketingSection[];
  note: { label: string; value: string; copy: string };
}) {
  return (
    <main className="min-h-screen bg-cream">
      <MotionProvider />
      <SiteHeader />
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              {eyebrow}
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[0.98] text-ink md:text-7xl">
              {title}
            </h1>
          </div>
          <div>
            <p className="text-base leading-relaxed text-muted md:text-lg">
              {intro}
            </p>
            <Link
              href="/register"
              className="focus-ring mt-7 inline-flex min-h-12 items-center gap-2 rounded-md bg-blue-600 px-6 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5"
            >
              Register your institution{" "}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div
          data-reveal="children"
          className="mx-6 grid max-w-6xl gap-px overflow-hidden rounded-lg border border-line bg-line md:mx-10 md:grid-cols-2 lg:grid-cols-3 xl:mx-auto"
        >
          {sections.map(({ icon: Icon, title: sectionTitle, copy, points }) => (
            <article key={sectionTitle} className="bg-white p-7 md:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-line bg-orange-soft text-orange">
                <Icon size={21} aria-hidden="true" />
              </div>
              <h2 className="mt-8 font-display text-2xl font-semibold text-ink">
                {sectionTitle}
              </h2>
              <p className="mt-3 min-h-20 text-sm leading-relaxed text-muted">
                {copy}
              </p>
              <ul className="mt-6 space-y-3 border-t border-line pt-6">
                {points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm text-ink/75">
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-blue-600"
                      aria-hidden="true"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-navy-deep py-18 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-[0.35fr_1fr] md:px-10 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
              {note.label}
            </p>
            <p className="mt-3 font-display text-5xl font-semibold text-lime">
              {note.value}
            </p>
          </div>
          <p className="max-w-2xl font-display text-2xl font-medium leading-snug text-white/90 md:text-3xl">
            {note.copy}
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
