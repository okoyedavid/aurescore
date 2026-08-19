"use client";

import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthUser } from "@/features/auth/hooks";
import { useAppShell } from "../AppShellContext";
import UserAvatar from "./UserAvatar";
import LogoutButton from "@/features/auth/components/LogoutButton";

export default function AppHeader({ openMenu }: { openMenu: () => void }) {
  const { data: user } = useAuthUser();
  const { collapsed, theme, toggleCollapsed, toggleTheme } = useAppShell();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [accountMenuOpen]);

  function toggleAccountMenu() {
    setAccountMenuOpen((current) => {
      const next = !current;
      if (next) {
        queueMicrotask(() =>
          menuRef.current
            ?.querySelector<HTMLElement>("[role='menuitem']")
            ?.focus(),
        );
      }
      return next;
    });
  }

  return (
    <header className="sticky top-0 z-20 flex h-18 items-center gap-3 border-b border-[var(--app-border)] bg-[var(--app-header)] px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        type="button"
        aria-label="Open menu"
        onClick={openMenu}
        className="app-icon-button lg:hidden"
      >
        <Menu size={19} />
      </button>
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="app-icon-button hidden lg:inline-flex"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
        />
        <input
          aria-label="Search"
          className="h-10 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-panel)] pl-10 pr-4 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)] focus:border-blue-500"
          placeholder="Search AureScore"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Use light mode" : "Use dark mode"}
          title={theme === "dark" ? "Use light mode" : "Use dark mode"}
          className="app-icon-button"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="app-icon-button relative"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange" />
        </button>
        <div className="relative ml-1">
          <button
            type="button"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            aria-controls="header-account-menu"
            onClick={toggleAccountMenu}
            className="focus-ring block rounded-full"
          >
            <UserAvatar
              user={user}
              className="h-10 w-10 border border-[var(--app-border)]"
            />
          </button>
          {accountMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close account menu"
                onClick={() => setAccountMenuOpen(false)}
                className="fixed inset-0 z-30 cursor-default"
              />
              <div
                ref={menuRef}
                id="header-account-menu"
                role="menu"
                className="app-panel absolute right-0 top-12 z-40 w-64 rounded-lg border border-[var(--app-border)] p-2 shadow-2xl"
              >
                <div className="border-b border-[var(--app-border)] px-3 py-3">
                  <p className="truncate text-sm font-semibold">{user?.name}</p>
                  <p className="mt-1 truncate text-xs text-[var(--app-muted)]">
                    {user?.email}
                  </p>
                </div>
                <Link
                  href="/dashboard/settings"
                  role="menuitem"
                  onClick={() => setAccountMenuOpen(false)}
                  className="focus-ring mt-1 flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]"
                >
                  <UserRound size={17} />
                  Account settings
                </Link>
                <LogoutButton
                  onComplete={() => setAccountMenuOpen(false)}
                  className="focus-ring flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-red-500 hover:bg-[var(--app-hover)]"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
