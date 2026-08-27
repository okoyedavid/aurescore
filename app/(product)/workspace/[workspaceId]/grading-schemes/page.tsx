import WorkspaceGradingSchemesPage from "@/features/workspace/WorkspaceGradingSchemesPage";

export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceGradingSchemesPage workspaceId={workspaceId} />;
}
