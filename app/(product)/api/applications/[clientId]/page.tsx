import AppShell from "@/features/app-shell/components/AppShell";
import OAuthClientDetailsPage from "@/features/developer/OAuthClientDetailsPage";
export default async function Page({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return (
    <AppShell area="developer">
      <OAuthClientDetailsPage clientId={clientId} />
    </AppShell>
  );
}
