"use client";

import { useState } from "react";
import { Eyebrow } from "./ui";
import Image from "next/image";

const WORKFLOW_STEPS = [
  {
    id: 1,
    label: "Score Entry",
    statement:
      "Lecturers submit raw scores directly into a structured, auditable entry point.",

    badgeLeft: "Draft Saved",
    badgeRight: "CSC 401",
    title: ["Score", "Entry"],
    caption: "Lecturer submits → draft stored",
    from: "from-blue-800",
    to: "to-slate-950",
  },
  {
    id: 2,
    label: "Review",
    statement:
      "Exam officers cross-check entries against attendance and continuous assessment records.",

    badgeLeft: "3 Flagged",
    badgeRight: "Reviewing",
    title: ["Score", "Review"],
    caption: "Exam officer reviews → flags issues",
    from: "from-indigo-800",
    to: "to-slate-950",
  },
  {
    id: 3,
    label: "Approval",
    statement:
      "Department and faculty approvals happen in sequence, with a full sign-off trail.",

    badgeLeft: "2/2 Approved",
    badgeRight: "Locked",
    title: ["Result", "Approval"],
    caption: "Department → faculty → locked",
    from: "from-violet-800",
    to: "to-slate-950",
  },
  {
    id: 4,
    label: "Result Publishing",
    statement:
      "Approved results are compiled and published to official academic records.",

    badgeLeft: "✓ 96% Complete",
    badgeRight: "GPA 4.21",
    title: ["Result", "Management"],
    caption: "Score entry → approval → results",
    from: "from-blue-800",
    to: "to-slate-950",
  },
  {
    id: 5,
    label: "Student Access",
    statement:
      "Students securely view approved results, GPA history, and downloadable records.",

    badgeLeft: "Published",
    badgeRight: "GPA 4.21",
    title: ["Student", "Access"],
    caption: "Result published → student notified",
    from: "from-sky-800",
    to: "to-slate-950",
  },
];

export default function FeaturedProgram() {
  const [index, setIndex] = useState(0);
  const total = WORKFLOW_STEPS.length;
  const step = WORKFLOW_STEPS[index];

  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  return (
    <section
      id="workflow"
      className="mx-3 rounded-4xl border border-line bg-white py-20 lg:py-28"
    >
      <div data-reveal="children" className="mx-auto max-w-6xl px-5 sm:px-8 md:px-10">
        <Eyebrow dotColor="bg-blue-600">ACADEMIC WORKFLOW</Eyebrow>

        <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 className="font-display max-w-xl text-3xl font-medium leading-tight text-ink md:text-4xl">
            From score entry to approved results, every step stays connected.
          </h2>

          <p className="max-w-xs text-sm font-bold leading-relaxed text-black/30">
            AureScore makes the process of creating graduates, much easier.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-stretch">
          {/* Workflow counter */}
          <div className="flex flex-row items-center justify-between gap-4 lg:w-40 lg:flex-col lg:items-start lg:justify-between">
            <div>
              <p className="font-display text-6xl font-semibold text-ink sm:text-7xl">
                0{step.id}
                <span className="text-lg text-muted">/0{total}</span>
              </p>

              <p className="mt-2 text-xs text-muted">{step.label}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Previous workflow"
                onClick={goPrev}
                className="focus-ring flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-paper sm:h-15 sm:w-15"
              >
                ←
              </button>

              <button
                type="button"
                aria-label="Next workflow"
                onClick={goNext}
                className="focus-ring flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white transition-opacity hover:opacity-90 sm:h-15 sm:w-15"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-2">
            {/* Workflow statement card */}
            <div key={`statement-${step.id}`} className="workflow-swap flex min-h-[320px] flex-col justify-between rounded-4xl bg-ink p-6 text-white transition-all duration-300 sm:min-h-[360px]">
              <div>
                <p className="font-display text-2xl font-medium leading-snug md:text-3xl">
                  {step.statement}
                </p>
              </div>
              <div className="mt-8 flex items-center justify-between text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Connected
                </span>
                <span>AureScore</span>
              </div>
            </div>
            {/* Academic result visual */}

            <div key={`visual-${step.id}`} className="workflow-swap relative min-h-[320px] overflow-hidden rounded-4xl sm:min-h-[360px]">
              <div className="absolute inset-0 z-0">
                <Image
                  src="/process2.jpg"
                  alt="process image"
                  fill
                  className="object-cover object-top-left"
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>

              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-[11px] text-white/85">
                    {step.badgeLeft}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-[11px] text-white/85">
                    {step.badgeRight}
                  </span>
                </div>
                <div>
                  <p className="font-display text-2xl font-medium text-white">
                    {step.title[0]}
                    <br />
                    {step.title[1]}
                  </p>
                  <p className="mt-1 text-xs text-white/70">{step.caption}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
