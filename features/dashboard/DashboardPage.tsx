"use client";

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
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500">
            Account overview
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Welcome, {firstName}.
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            Choose a workspace or continue a task assigned to you.
          </p>
        </div>
        <div className="mt-8">
          <WorkspaceOverview />
        </div>
        <div className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
          <PendingTasks />
          <InvitationPanel />
        </div>
      </div>
    </AppShell>
  );
}
