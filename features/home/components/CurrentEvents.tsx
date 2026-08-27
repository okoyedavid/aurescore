"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Eyebrow } from "./ui";

const workflows = [
  {
    name: "Score Entry",
    description:
      "Lecturers enter CA and examination scores for their assigned courses.",
  },
  {
    name: "Result Review & Approval",
    description:
      "Submitted results move through the appropriate review and approval stages before publication.",
  },
  {
    name: "Student Records",
    description:
      "Maintain structured academic records throughout each student's academic journey.",
  },
  {
    name: "Reports & Exports",
    description:
      "Generate reports and export approved results for academic administration.",
  },
  {
    name: "Academic Analytics",
    description:
      "Monitor grades, averages, submission progress, and performance across courses and departments.",
  },
];

export default function CurrentEvents() {
  const [activeIndex, setActiveIndex] = useState(1);

  return (
    <section id="security" className="mx-3 rounded-lg bg-ink py-20 lg:py-28">
      <div
        data-reveal="children"
        className="mx-auto max-w-6xl px-5 sm:px-8 md:px-10"
      >
        <Eyebrow dotColor="bg-blue-600">ACADEMIC WORKFLOWS</Eyebrow>
        <h2 className="mt-5 max-w-2xl font-display text-3xl font-medium leading-tight text-white md:text-4xl">
          Everything connected from the first score to the final result.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60">
          AureScore brings the different stages of academic result processing
          into one structured workflow, giving every role the tools and access
          they need.
        </p>

        <div className="mt-10 divide-y divide-lineDark">
          {workflows.map((workflow, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={workflow.name}
                type="button"
                aria-expanded={isActive}
                onClick={() => setActiveIndex(index)}
                className={`workflow-row focus-ring flex w-full items-center justify-between rounded-md px-4 py-5 text-left transition-colors duration-150 sm:px-5 ${
                  isActive ? "bg-blue-600 text-white" : "hover:bg-white/5"
                }`}
              >
                <span className="pr-6">
                  <span
                    className={`block text-base font-medium ${isActive ? "text-white" : "text-white/90"}`}
                  >
                    {workflow.name}
                  </span>
                  <span
                    className={`workflow-description block max-w-lg overflow-hidden text-[11px] leading-relaxed text-white/80 ${isActive ? "is-open" : ""}`}
                  >
                    {workflow.description}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border text-sm transition-all duration-150 ${
                    isActive
                      ? "rotate-45 border-white bg-white text-blue-600"
                      : "border-white/10 bg-white/10 text-white"
                  }`}
                >
                  <ArrowUpRight size={16} strokeWidth={1.8} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
