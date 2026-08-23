import WorkspaceOverviewPage from "@/features/workspace/WorkspaceOverviewPage";
export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceOverviewPage workspaceId={workspaceId} />;
}
