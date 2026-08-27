import { AppShellProvider } from "@/features/app-shell/AppShellContext";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div
        className="dashboard-scope min-h-screen bg-[var(--app-bg)] font-body text-[11px] leading-6 text-[var(--app-text)] antialiased [text-rendering:optimizeLegibility]"
        data-dashboard-shell
        style={
          {
            "--dashboard-background": "var(--app-bg)",
            "--dashboard-surface": "var(--app-panel)",
            "--dashboard-text": "var(--app-text)",
            "--dashboard-text-muted": "var(--app-muted)",
            "--dashboard-border": "var(--app-border)",
            "--dashboard-primary": "#2563eb",
            "--dashboard-accent": "#ff5a1f",
            "--dashboard-success": "#10b981",
            "--dashboard-warning": "#ff5a1f",
            "--dashboard-danger": "#ef4444",
          } as React.CSSProperties
        }
      >
        <AppShellProvider>{children}</AppShellProvider>
      </div>
    </ProtectedRoute>
  );
}
