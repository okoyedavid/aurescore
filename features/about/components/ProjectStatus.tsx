import { UserRound } from "lucide-react";

export default function ProjectStatus() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 md:px-10 lg:grid-cols-[0.35fr_1fr]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-soft text-orange">
          <UserRound size={26} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
            Product direction
          </p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight">
            Built as a final-year project. Growing into a SaaS product.
          </h2>
          <div className="mt-7 grid gap-6 text-sm leading-7 text-muted md:grid-cols-2">
            <p>
              AureScore began with a practical goal: make score compilation and
              GPA processing easier for Nigerian universities.
            </p>
            <p>
              It is now being expanded with secure accounts, reusable academic
              workspaces, public calculators, and clearer result-management
              workflows.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
