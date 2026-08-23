import WorkspaceSessionsPage from "@/features/workspace/WorkspaceSessionsPage";
export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceSessionsPage workspaceId={workspaceId} />;
}
