import Image from "next/image";
import Link from "next/link";
import { CircleArrow, Eyebrow } from "./ui";

export default function ActivityTracking() {
  return (
    <section id="features" className="bg-cream py-20 lg:py-28">
      <div
        data-reveal="children"
        className="mx-auto grid max-w-6xl gap-10 px-6 md:px-10 lg:grid-cols-2 lg:items-center"
      >
        <div className="group relative min-h-[420px] overflow-hidden rounded-lg sm:min-h-[520px] lg:h-full">
          <div className="absolute inset-0 z-0">
            <Image
              src="/lecturers.jpg"
              alt="Lecturer working on academic results"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        </div>

        <div>
          <Eyebrow>Featured Capability</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-ink md:text-4xl">
            Track every result from submission to sign-off.
          </h2>

          <div className="mt-5 flex gap-3" aria-hidden="true">
            {["01", "02", "03", "04"].map((step, index) => (
              <span
                key={step}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold ${
                  index === 3
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-line bg-paper text-muted"
                }`}
              >
                {step}
              </span>
            ))}
          </div>

          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
            Manage scores, approvals, academic records, and results from one
            connected platform.
          </p>

          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/70">
            Built for Academic Workflows
          </p>

          <div className="mt-8 flex items-center gap-5 sm:gap-6">
            <Link
              href="/workflow"
              aria-label="Explore the AureScore workflow"
              className="focus-ring rounded-md"
            >
              <CircleArrow />
            </Link>

            <span className="text-base font-medium text-muted sm:text-lg">
              Explore AureScore
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
