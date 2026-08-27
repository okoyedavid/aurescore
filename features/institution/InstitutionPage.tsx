"use client";

import { useState } from "react";
import AppShell from "@/features/app-shell/components/AppShell";
import ApprovalActivity from "./components/ApprovalActivity";
import CourseProgress from "./components/CourseProgress";
import SummaryCards from "./components/SummaryCards";

export default function InstitutionPage() {
  const [period, setPeriod] = useState("2025/2026 · First semester");
  return (
    <AppShell area="institution">
      <div className="mx-auto w-full max-w-[1500px] px-[clamp(20px,4.5vw,72px)] pb-[72px] pt-[clamp(28px,4vw,58px)] max-[900px]:px-5 max-[900px]:pb-14 max-[900px]:pt-7">
        <header className="flex items-end justify-between gap-6 border-b border-[var(--app-border)] pb-6 max-[650px]:flex-col max-[650px]:items-stretch">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase leading-normal tracking-[0.13em] text-blue-600">
              Institution overview
            </p>
            <h1 className="m-0 font-display text-[clamp(38px,4vw,50px)] font-medium leading-none tracking-[-0.045em] max-[650px]:text-[39px]">
              Computer Science
            </h1>
            <p className="mt-2.5 max-w-[660px] text-xs leading-normal text-[var(--app-muted)]">
              Department result operations and approval progress.
            </p>
          </div>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            aria-label="Academic period"
            className="app-select min-h-10 rounded-sm border px-4 text-xs font-semibold outline-none focus:border-blue-500"
          >
            <option>2025/2026 · First semester</option>
            <option>2024/2025 · Second semester</option>
          </select>
        </header>
        <SummaryCards />
        <div className="mt-12 grid grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] gap-6 max-[900px]:grid-cols-1">
          <CourseProgress />
          <ApprovalActivity />
        </div>
      </div>
    </AppShell>
  );
}
