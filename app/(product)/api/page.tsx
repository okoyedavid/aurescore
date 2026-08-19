import AppShell from "@/features/app-shell/components/AppShell";
import OAuthClientsPage from "@/features/developer/OAuthClientsPage";
export default function Page() {
  return (
    <AppShell area="developer">
      <OAuthClientsPage />
    </AppShell>
  );
}
