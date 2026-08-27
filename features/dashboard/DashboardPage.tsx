"use client";

import Link from "next/link";
import AppShell from "@/features/app-shell/components/AppShell";
import { useAuthUser } from "@/features/auth/hooks";
import InvitationPanel from "./components/InvitationPanel";
import PendingTasks from "./components/PendingTasks";
import WorkspaceOverview from "./components/WorkspaceOverview";

export default function DashboardPage() {
  const { data: user } = useAuthUser();
  const firstName = user?.name.split(/\s+/)[0] ?? "there";
  return (
    <AppShell area="dashboard">
      <div className="mx-auto w-full max-w-[1500px] px-[clamp(20px,4.5vw,72px)] pb-[72px] pt-[clamp(28px,4vw,58px)] max-[900px]:px-5 max-[900px]:pb-14 max-[900px]:pt-7">
        <header className="flex items-end justify-between gap-6 border-b border-[var(--app-border)] pb-6 max-[650px]:flex-col max-[650px]:items-stretch">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase leading-normal tracking-[0.13em] text-blue-600">
              Account overview
            </p>
            <h1 className="m-0 font-display text-[clamp(38px,4vw,50px)] font-medium leading-none tracking-[-0.045em] max-[650px]:text-[39px]">
              Welcome, {firstName}.
            </h1>
            <p className="mt-2.5 max-w-[660px] text-xs leading-normal text-[var(--app-muted)]">
              Choose a workspace or continue a task assigned to you.
            </p>
          </div>
          <Link
            href="/workspace/new"
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-[var(--app-border)] bg-[var(--app-panel)] px-4 text-xs font-semibold text-[var(--app-text)] transition-colors duration-150 hover:bg-[var(--app-hover)]"
          >
            Create workspace
          </Link>
        </header>
        <WorkspaceOverview />
        <div className="mt-12 grid grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] gap-6 max-[900px]:grid-cols-1">
          <PendingTasks />
          <InvitationPanel />
        </div>
      </div>
    </AppShell>
  );
}
