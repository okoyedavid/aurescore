import { Eyebrow } from "./ui";

const feedback = [
  {
    quote:
      "The approval trail gives our exam team one place to see what is pending, who reviewed it, and what is ready to publish.",
    role: "Departmental Exam Officer",
    context: "Result review and approval",
  },
  {
    quote:
      "We can calculate GPA from the same verified scores sent forward for review, without rebuilding separate spreadsheets.",
    role: "Lecturer and Level Coordinator",
    context: "Score entry and computation",
  },
  {
    quote:
      "A consistent submission format makes faculty review faster and gives every department a clear next step.",
    role: "Faculty Reviewer",
    context: "Faculty-level oversight",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-cream py-20 lg:py-28">
      <div data-reveal="children" className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Eyebrow dotColor="bg-blue-600">ACADEMIC TEAMS</Eyebrow>
            <h2 className="mt-5 max-w-2xl font-display text-3xl font-medium leading-tight text-ink md:text-4xl">
              Built around the people behind every approved result.
            </h2>
          </div>

          <p className="max-w-xs text-sm leading-relaxed text-muted md:text-right">
            Clear handoffs for the lecturers, exam officers, and faculty leaders
            responsible for accurate academic records.
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-[1.45fr_1fr]">
          <article className="flex min-h-[360px] flex-col justify-between bg-navy-deep p-7 text-white md:p-10">
            <div className="flex items-center justify-between gap-4 text-xs text-white/60">
              <span>01 / 03</span>
              <span className="rounded-full border border-white/15 px-3 py-1.5">
                Approval visibility
              </span>
            </div>

            <blockquote className="my-12 max-w-2xl font-display text-2xl font-medium leading-snug md:text-3xl">
              &ldquo;{feedback[0].quote}&rdquo;
            </blockquote>

            <div className="border-t border-white/15 pt-5">
              <p className="text-sm font-semibold">{feedback[0].role}</p>
              <p className="mt-1 text-xs text-white/55">
                {feedback[0].context}
              </p>
            </div>
          </article>

          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-1">
            {feedback.slice(1).map((item, index) => (
              <article
                key={item.role}
                className="flex min-h-[210px] flex-col justify-between bg-paper p-6"
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>0{index + 2} / 03</span>
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                </div>

                <blockquote className="my-7 font-display text-lg font-medium leading-snug text-ink">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>

                <div>
                  <p className="text-sm font-semibold text-ink">{item.role}</p>
                  <p className="mt-1 text-xs text-muted">{item.context}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
