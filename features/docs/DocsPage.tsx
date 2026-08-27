import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calculator,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import SiteHeader from "@/components/layout/SiteHeader";
const topics = [
  {
    icon: Building2,
    title: "Institution setup",
    copy: "Model faculties, departments, programmes, sessions, and semesters.",
  },
  {
    icon: Calculator,
    title: "Grading rules",
    copy: "Define units, grade bands, points, pass marks, and GPA treatment.",
  },
  {
    icon: Workflow,
    title: "Approval design",
    copy: "Assign reviewers and configure the path from submission to publication.",
  },
  {
    icon: ShieldCheck,
    title: "Roles and access",
    copy: "Understand what lecturers, officers, HODs, deans, and administrators can do.",
  },
];
export default function DocsPage() {
  return (
    <main className="min-h-screen bg-cream">
      <SiteHeader />
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-soft text-orange">
            <BookOpen size={23} aria-hidden="true" />
          </div>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold md:text-7xl">
            Documentation that follows the academic year.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Use this foundation to plan setup, permissions, result processing,
            and institutional rollout.
          </p>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[0.35fr_1fr] md:px-10">
          <aside>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Start here
            </p>
            <nav className="mt-5 space-y-3 text-sm font-semibold">
              <a href="#foundations" className="block text-blue-700">
                Foundations
              </a>
              <a href="#implementation" className="block text-ink/55">
                Implementation sequence
              </a>
              <Link href="/contact" className="block text-ink/55">
                Get implementation help
              </Link>
            </nav>
          </aside>
          <div>
            <div
              id="foundations"
              className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2"
            >
              {topics.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="bg-white p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-line bg-cream text-blue-600">
                    <Icon size={19} aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 font-display text-xl font-semibold">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
            <div
              id="implementation"
              className="mt-12 border-t border-line pt-10"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                Implementation sequence
              </p>
              <ol className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  "Map academic structure",
                  "Validate policies and roles",
                  "Pilot one result cycle",
                ].map((step, index) => (
                  <li key={step} className="border-l-2 border-orange pl-4">
                    <span className="text-xs text-muted">0{index + 1}</span>
                    <p className="mt-2 font-semibold">{step}</p>
                  </li>
                ))}
              </ol>
              <Link
                href="/contact"
                className="focus-ring mt-10 inline-flex min-h-12 items-center gap-2 rounded-md bg-ink px-6 text-sm font-semibold text-white"
              >
                Plan implementation <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
