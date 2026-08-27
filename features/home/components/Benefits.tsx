import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "./ui";

export default function Benefits() {
  const audiences = [
    {
      id: 1,
      name: "Departments",
      description:
        "Manage courses, students, score entry, GPA calculations, and departmental approvals from one organized workspace.",
    },
    {
      id: 2,
      name: "Faculties",
      description:
        "Bring multiple departments together with faculty-level oversight, reporting, approval tracking, and performance insights.",
    },
    {
      id: 3,
      name: "Universities",
      description:
        "Scale academic result processing across faculties and departments with centralized administration and configurable workflows.",
    },
    {
      id: 4,
      name: "Students",
      description:
        "Give students secure access to approved results, academic history, GPA information, and downloadable records.",
    },
  ];

  return (
    <section id="solutions" className="py-20 lg:py-28">
      <div
        data-reveal="children"
        className="mx-auto grid max-w-6xl gap-10 px-6 md:px-10 lg:grid-cols-2 lg:gap-6"
      >
        {/* Left: copy + audience list */}
        <div>
          <Eyebrow dotColor="bg-blue-600">WHO IT&apos;S FOR</Eyebrow>

          <h2 className="mt-4 max-w-md font-display text-4xl font-medium tracking-tight text-ink">
            One platform. Every level of your institution.
          </h2>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            AureScore adapts to the way your institution works — from a single
            department to an entire university.
          </p>

          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line">
            {audiences.map((audience) => (
              <div key={audience.id} className="audience-card group bg-paper">
                <div className="flex gap-5 bg-background p-5 transition-colors duration-150 hover:bg-paper">
                  <span className="font-mono text-xs text-muted">
                    0{audience.id}
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {audience.name}
                    </p>

                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {audience.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AureScore product card */}
        <div className="group relative min-h-[460px] overflow-hidden rounded-lg border border-line bg-paper lg:h-full">
          <div className="absolute inset-0 z-0">
            <Image
              src="/benefits_image.jpg"
              alt="female student"
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <div>
              <div className="flex items-center justify-between">
                <Eyebrow dotColor="bg-blue-400">ACADEMIC OPERATIONS</Eyebrow>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/70">
                From score entry to final approval, keep every stage of your
                academic result workflow connected.
              </p>
            </div>

            <div className="flex flex-col space-y-4">
              <p className="font-display text-3xl font-medium text-white">
                Structured
                <br />
                Academic Workflows
              </p>

              <Link
                href="/solutions"
                className="focus-ring inline-flex w-fit items-center gap-1.5 rounded-md bg-white px-4 py-2.5 text-xs font-semibold text-ink transition-opacity duration-150 hover:opacity-90"
              >
                Explore AureScore <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
