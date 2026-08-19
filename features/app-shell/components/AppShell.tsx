"use client";

import { useState } from "react";
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
  const { collapsed } = useAppShell();
  return (
    <main
      className={`app-shell min-h-screen text-[var(--app-text)] transition-[padding] duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-64"}`}
    >
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-[var(--app-border)] transition-[width] duration-300 lg:flex ${collapsed ? "w-20" : "w-64"}`}
      >
        <AppSidebar area={area} />
      </aside>
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
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
      {children}
    </main>
  );
}
