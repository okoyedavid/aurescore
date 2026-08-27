import { engineeringScope } from "../data";

export default function EngineeringExtension() {
  return (
    <section className="border-y border-line bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.58fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Engineering extension
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">
              What I added beyond the report requirements.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-muted">
            <p>
              After defining the original academic workflow, I expanded the
              project to reinforce concepts that matter in larger SaaS
              applications. A system serving several institutions cannot be
              treated as a single shared database with unrestricted users.
            </p>
            <p>
              This changed the project from a narrow score-calculation tool into
              an architecture exercise involving tenant boundaries, role-based
              authorisation, protected operations, and auditable state
              transitions. It also gave me a practical reason to pivot my
              backend learning toward NestJS.
            </p>
          </div>
        </div>
        <div
          data-reveal="children"
          className="mt-14 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2"
        >
          {engineeringScope.map(({ icon: Icon, title, copy }) => (
            <article
              key={title}
              className="grid grid-cols-[auto_1fr] gap-4 bg-cream p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-line-dark bg-navy-deep text-lime">
                <Icon size={19} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {copy}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
