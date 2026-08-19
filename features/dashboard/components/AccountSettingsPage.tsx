"use client";

import {
  Activity,
  Bell,
  KeyRound,
  Mail,
  MonitorCog,
  ShieldCheck,
  UserRound,
  PlugZap,
} from "lucide-react";
import { useState } from "react";
import AppShell from "@/features/app-shell/components/AppShell";
import AuditHistory from "@/features/account/components/AuditHistory";
import EmailSettings from "@/features/account/components/EmailSettings";
import PasswordSettings from "@/features/account/components/PasswordSettings";
import PreferencesSettings from "@/features/account/components/PreferencesSettings";
import ProfileSettings from "@/features/account/components/ProfileSettings";
import SecuritySettings from "@/features/account/components/SecuritySettings";
import SessionsSettings from "@/features/account/components/SessionsSettings";
import ConnectedApplications from "@/features/account/components/ConnectedApplications";
import { SettingsSkeleton } from "@/features/account/components/shared";
import { useCurrentUser } from "@/features/account/hooks";

const sections = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "preferences", label: "Preferences", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "password", label: "Password", icon: KeyRound },
  { id: "email", label: "Email address", icon: Mail },
  { id: "sessions", label: "Sessions and devices", icon: MonitorCog },
  { id: "connected-apps", label: "Connected applications", icon: PlugZap },
  { id: "activity", label: "Account activity", icon: Activity },
] as const;

type Section = (typeof sections)[number]["id"];

export default function AccountSettingsPage({
  initialSection = "profile",
}: {
  initialSection?: Section;
}) {
  const [active, setActive] = useState<Section>(initialSection);
  const currentUser = useCurrentUser();
  const user = currentUser.data;

  return (
    <AppShell area="dashboard">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500">
              Account settings
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              Settings
            </h1>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Manage your profile, login security, sessions, and account
              history.
            </p>
          </div>
          {currentUser.isFetching && !currentUser.isPending && (
            <p role="status" className="text-xs text-blue-500">
              Refreshing account…
            </p>
          )}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav
            aria-label="Account settings"
            className="app-panel flex gap-1 overflow-x-auto rounded-xl border border-[var(--app-border)] p-2 lg:block lg:space-y-1 lg:self-start"
          >
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                aria-current={active === id ? "page" : undefined}
                className={`focus-ring flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 text-left text-sm transition-colors lg:w-full ${active === id ? "bg-[var(--app-active)] font-semibold text-[var(--app-text)]" : "text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]"}`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div>
            {currentUser.isPending || !user ? (
              <SettingsSkeleton />
            ) : (
              <>
                {active === "profile" && (
                  <ProfileSettings
                    key={`${user.updatedAt ?? "profile"}-${user.name}-${user.username}-${user.avatar}`}
                    user={user}
                  />
                )}
                {active === "preferences" && (
                  <PreferencesSettings user={user} />
                )}
                {active === "security" && <SecuritySettings user={user} />}
                {active === "password" && <PasswordSettings user={user} />}
                {active === "email" && <EmailSettings user={user} />}
                {active === "sessions" && <SessionsSettings />}
                {active === "connected-apps" && <ConnectedApplications />}
                {active === "activity" && <AuditHistory />}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
