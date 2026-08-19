import { AppShellProvider } from "@/features/app-shell/AppShellContext";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShellProvider>{children}</AppShellProvider>
    </ProtectedRoute>
  );
}
