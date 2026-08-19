"use client";

import { useState } from "react";
import AppShell from "@/features/app-shell/components/AppShell";
import ApprovalActivity from "./components/ApprovalActivity";
import CourseProgress from "./components/CourseProgress";
import SummaryCards from "./components/SummaryCards";

export default function InstitutionPage() {
  const [period, setPeriod] = useState("2025/2026 · First semester");
  return <AppShell area="institution"><div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500">Institution overview</p><h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Computer Science</h1><p className="mt-2 text-sm text-[var(--app-muted)]">Department result operations and approval progress.</p></div><select value={period} onChange={(event)=>setPeriod(event.target.value)} aria-label="Academic period" className="app-select h-11 rounded-md border px-4 text-sm font-semibold outline-none focus:border-blue-500"><option>2025/2026 · First semester</option><option>2024/2025 · Second semester</option></select></div><SummaryCards/><div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_0.75fr]"><CourseProgress/><ApprovalActivity/></div></div></AppShell>;
}
