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
            Current status and learning outcome
          </p>
          <h2 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight">
            The interface shows the product direction; the engineering work
            defines how it should become dependable.
          </h2>
          <div className="mt-7 grid gap-6 text-sm leading-7 text-muted md:grid-cols-2">
            <p>
              The current application is a functional product prototype. It
              demonstrates the user journeys, academic roles, result states,
              approval model, and responsive interface that the complete system
              is intended to support.
            </p>
            <p>
              Production use still requires the planned NestJS backend,
              persistent storage, verified tenant isolation, authentication,
              server-side authorisation, audit logging, tests, and operational
              security controls. I document that boundary deliberately rather
              than presenting unfinished functionality as complete.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
