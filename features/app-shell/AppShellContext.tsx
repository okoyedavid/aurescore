"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type AppShellContextValue = {
  collapsed: boolean;
  theme: Theme;
  toggleCollapsed: () => void;
  toggleTheme: () => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = window.localStorage.getItem("aurescore-app-theme");
    const initialTheme: Theme = storedTheme === "dark" ? "dark" : "light";

    root.classList.add("app-surface");
    root.dataset.appTheme = initialTheme;
    queueMicrotask(() => setTheme(initialTheme));

    return () => {
      root.classList.remove("app-surface");
      delete root.dataset.appTheme;
    };
  }, []);

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.appTheme = next;
      window.localStorage.setItem("aurescore-app-theme", next);
      return next;
    });
  }

  const value = useMemo(
    () => ({
      collapsed,
      theme,
      toggleCollapsed: () => setCollapsed((current) => !current),
      toggleTheme,
    }),
    [collapsed, theme],
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context)
    throw new Error("useAppShell must be used inside AppShellProvider");
  return context;
}
