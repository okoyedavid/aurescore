import { projectDetails } from "../data";

export default function ProjectOrigin() {
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <div
            data-reveal="children"
            className="grid gap-12 lg:grid-cols-[1fr_0.65fr] lg:items-end"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                About the project
              </p>
              <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[0.98] text-ink md:text-7xl">
                AureScore began as my final-year Computer Science project.
              </h1>
            </div>
            <p className="text-base leading-relaxed text-muted md:text-lg">
              This page documents why I built it, the academic problem I chose
              to address, and how I expanded the work to develop stronger
              backend architecture and application-security skills.
            </p>
          </div>
        </div>
      </section>
      <section className="bg-navy-deep text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:px-10 lg:grid-cols-[0.75fr_1fr] lg:py-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-lime">
              Project report
            </p>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight md:text-4xl">
              AureScore: Automatic Score Sheet for Nigerian Universities
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55">
              A Project Report on Automated Score Compilation, GPA/CGPA
              Processing, Result Approval and Transcript Generation.
            </p>
          </div>
          <div className="border-t border-white/15 lg:border-l lg:border-t-0 lg:pl-10">
            <div className="grid gap-x-8 gap-y-6 pt-8 sm:grid-cols-2 lg:pt-0">
              {projectDetails.map(([label, value]) => (
                <dl key={label}>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                    {label}
                  </dt>
                  <dd className="mt-2 text-sm font-semibold leading-snug">
                    {value}
                  </dd>
                </dl>
              ))}
            </div>
            <p className="mt-8 border-t border-white/15 pt-6 text-sm leading-relaxed text-white/50">
              Submitted in partial fulfilment of the requirements for the award
              of a Bachelor of Science degree in Computer Science.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
