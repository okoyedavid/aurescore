"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppShell } from "../AppShellContext";
import type { AppArea } from "../navigation";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

export default function AppShell({
  area,
  children,
}: {
  area: AppArea;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { collapsed, toggleCollapsed } = useAppShell();
  return (
    <div
      className={`app-shell min-h-screen text-[var(--app-text)] transition-[padding] duration-200 ${collapsed ? "min-[901px]:pl-[76px]" : "min-[901px]:pl-[252px]"}`}
    >
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[var(--app-border)] transition-[width] duration-200 min-[901px]:flex ${collapsed ? "w-[76px]" : "w-[252px]"}`}
      >
        <AppSidebar area={area} />
      </aside>
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`focus-ring fixed top-[19px] z-40 hidden h-[34px] w-[34px] items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-text)] transition-[left,background-color] duration-200 hover:bg-[var(--app-hover)] min-[901px]:inline-flex ${collapsed ? "left-[59px]" : "left-[235px]"}`}
      >
        {collapsed ? (
          <ChevronRight size={16} aria-hidden="true" />
        ) : (
          <ChevronLeft size={16} aria-hidden="true" />
        )}
      </button>
      {menuOpen && (
        <div className="fixed inset-0 z-50 min-[901px]:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(86vw,320px)] shadow-2xl">
            <AppSidebar area={area} mobile close={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}
      <AppHeader openMenu={() => setMenuOpen(true)} />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
