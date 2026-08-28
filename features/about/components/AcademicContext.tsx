import { academicScope } from "../data";

export default function AcademicContext() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.58fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
              The problem
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">
              Why I chose result processing.
            </h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-muted">
            <p>
              Result processing is a suitable automation problem because it
              combines calculation, record keeping, review, and institutional
              responsibility. A mistake does not affect only a spreadsheet; it
              can affect a student&apos;s GPA, progression, graduation, or
              transcript.
            </p>
            <p>
              I designed AureScore around a common university workflow:
              lecturers compile scores, exam officers review submissions,
              academic leaders approve results, and students receive only the
              final approved record. The project investigates how one system can
              connect those stages while reducing repeated calculations and
              disconnected file transfers.
            </p>
            <p>
              The initial focus is Nigerian universities, where the
              application must accommodate institutional grading rules and a
              formal hierarchy of academic review.
            </p>
          </div>
        </div>
        <div
          data-reveal="children"
          className="mt-14 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3"
        >
          {academicScope.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="bg-white p-7 md:p-8">
              <Icon size={22} className="text-orange" aria-hidden="true" />
              <h3 className="mt-7 font-display text-2xl font-semibold">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
