import { engineeringScope } from "../data";

export default function EngineeringExtension() {
  return (
    <section className="border-y border-line bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.58fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              Beyond the original project
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">
              Growing AureScore into a complete academic platform.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-muted">
            <p>
              The original project focused on score compilation and GPA
              calculation. AureScore now supports a broader journey covering
              academic setup, result entry, student records, and account
              security.
            </p>
            <p>
              The long-term goal is a dependable SaaS product that can serve
              departments and institutions while keeping responsibilities and
              records clearly separated.
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
