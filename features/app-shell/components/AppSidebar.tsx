"use client";

import Link from "next/link";
import {
  ChevronUp,
  ExternalLink,
  MonitorCog,
  Moon,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthUser } from "@/features/auth/hooks";
import { useAppShell } from "../AppShellContext";
import {
  type AppArea,
  type NavigationItem,
  destinations,
  navigationByArea,
  settingsByArea,
} from "../navigation";
import UserAvatar from "./UserAvatar";
import LogoutButton from "@/features/auth/components/LogoutButton";

function NavigationLink({
  item,
  compact,
  active,
  close,
}: {
  item: NavigationItem;
  compact: boolean;
  active: boolean;
  close?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={compact ? item.label : undefined}
      aria-label={compact ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      onClick={close}
      className={`focus-ring relative flex min-h-[38px] items-center rounded-sm text-[11px] transition-colors [&_svg]:h-4 [&_svg]:w-4 [&_svg]:stroke-[1.7] ${compact ? "justify-center px-2" : "gap-3 px-3"} ${active ? "bg-[var(--app-active)] font-semibold text-[var(--app-text)]" : "text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]"}`}
    >
      <Icon size={18} aria-hidden="true" />
      <span className={compact ? "sr-only" : "flex-1 font-medium"}>
        {item.label}
      </span>
      {item.badge &&
        (compact ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange" />
        ) : (
          <span className="rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold text-white">
            {item.badge}
          </span>
        ))}
    </Link>
  );
}

export default function AppSidebar({
  area,
  close,
  mobile = false,
}: {
  area: AppArea;
  close?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const { data: user } = useAuthUser();
  const { collapsed, theme, toggleTheme } = useAppShell();
  const [profileOpen, setProfileOpen] = useState(false);
  const compact = collapsed && !mobile;
  const navigation = navigationByArea[area];
  const settings = settingsByArea[area];
  useEffect(() => {
    if (!profileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [profileOpen]);

  return (
    <div className="flex h-full flex-col overflow-visible bg-[var(--app-sidebar)] text-[var(--app-text)]">
      <div
        className={`flex h-18 shrink-0 items-center border-b border-[var(--app-border)] ${compact ? "justify-center px-3" : "justify-between px-5"}`}
      >
        <Link
          href="/dashboard"
          aria-label="AureScore dashboard"
          className="focus-ring rounded-sm"
        >
          {compact ? (
            "A"
          ) : (
            <span>
              <span className="block font-display text-base font-semibold leading-none">
                AureScore
              </span>
              <span className="mt-0.5 block text-[9px] font-medium uppercase leading-normal tracking-[0.1em] text-[var(--app-muted)]">
                Academic result management
              </span>
            </span>
          )}
        </Link>
        {mobile && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="app-icon-button"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div
        className={`nav-scroll flex-1 overflow-y-auto py-4 ${compact ? "px-2" : "px-4"}`}
      >
        {!compact && (
          <p className="px-3 text-[9px] font-bold uppercase tracking-[0.13em] text-[var(--app-muted)]">
            Switch workspace
          </p>
        )}
        <nav
          aria-label="Workspace destinations"
          className={compact ? "space-y-2" : "mt-2 space-y-1"}
        >
          {destinations.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              compact={compact}
              active={pathname === item.href}
              close={close}
            />
          ))}
        </nav>

        <div className="my-4 border-t border-[var(--app-border)]" />
        {!compact && (
          <p className="px-3 text-[9px] font-bold uppercase tracking-[0.13em] text-[var(--app-muted)]">
            {area === "dashboard"
              ? "Your account"
              : area === "institution"
                ? "Institution tools"
                : area === "workspace"
                  ? "Workspace tools"
                  : "Developer tools"}
          </p>
        )}
        <nav
          aria-label="Current workspace tools"
          className={compact ? "space-y-2" : "mt-2 space-y-1"}
        >
          {navigation.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              compact={compact}
              active={
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              }
              close={close}
            />
          ))}
        </nav>
      </div>

      <div
        className={`relative shrink-0 border-t border-[var(--app-border)] p-3 ${compact ? "space-y-2" : "space-y-1"}`}
      >
        <Link
          href="/"
          onClick={close}
          title={compact ? "View public site" : undefined}
          className={`focus-ring flex min-h-10 items-center rounded-sm text-[10px] font-semibold text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)] ${compact ? "justify-center px-2" : "gap-3 px-3"}`}
        >
          <ExternalLink size={16} />
          <span className={compact ? "sr-only" : ""}>View public site</span>
        </Link>
        <button
          type="button"
          onClick={toggleTheme}
          title={
            compact
              ? theme === "dark"
                ? "Use light mode"
                : "Use dark mode"
              : undefined
          }
          className={`focus-ring flex min-h-10 w-full items-center rounded-sm text-[10px] font-semibold text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)] ${compact ? "justify-center px-2" : "gap-3 px-3"}`}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          <span className={compact ? "sr-only" : ""}>
            {theme === "dark" ? "Use light mode" : "Use dark mode"}
          </span>
        </button>
        <NavigationLink
          item={settings}
          compact={compact}
          active={
            pathname === settings.href ||
            pathname.startsWith(`${settings.href}/`)
          }
          close={close}
        />

        {profileOpen && (
          <>
            <button
              type="button"
              aria-label="Close profile menu"
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 z-30 cursor-default"
            />
            <div
              className={`app-panel absolute bottom-[4.5rem] z-40 w-64 rounded-lg border border-[var(--app-border)] p-2 shadow-2xl ${compact ? "left-[4.75rem]" : "left-3"}`}
              role="menu"
            >
              <div className="border-b border-[var(--app-border)] px-3 py-3">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  {user?.email}
                </p>
              </div>
              <Link
                href="/dashboard/settings"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  close?.();
                }}
                className="focus-ring mt-1 flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]"
              >
                <UserRound size={17} />
                Account settings
              </Link>
              <LogoutButton
                onComplete={() => {
                  setProfileOpen(false);
                  close?.();
                }}
                className="focus-ring flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-red-500 hover:bg-[var(--app-hover)]"
              />
              <Link
                href="/dashboard/settings"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  close?.();
                }}
                className="focus-ring flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]"
              >
                <MonitorCog size={17} />
                Manage sign-in sessions
              </Link>
            </div>
          </>
        )}

        <button
          type="button"
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          aria-label="Open account menu"
          onClick={() => setProfileOpen((current) => !current)}
          title={compact ? "Open profile menu" : undefined}
          className={`focus-ring flex min-h-12 w-full items-center rounded-md hover:bg-[var(--app-hover)] ${compact ? "justify-center px-2" : "gap-3 px-3"}`}
        >
          <UserAvatar user={user} />
          {!compact && (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-xs font-semibold">
                  {user?.name}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-[var(--app-muted)]">
                  Personal account
                </span>
              </span>
              <ChevronUp
                size={15}
                className={`text-[var(--app-muted)] transition-transform ${profileOpen ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
