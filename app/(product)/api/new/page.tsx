import AppShell from "@/features/app-shell/components/AppShell";
import CreateOAuthClientPage from "@/features/developer/CreateOAuthClientPage";
export default function Page() {
  return (
    <AppShell area="developer">
      <CreateOAuthClientPage />
    </AppShell>
  );
}
