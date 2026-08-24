import WorkspaceResultsPage from "@/features/workspace/WorkspaceResultsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceResultsPage workspaceId={workspaceId} />;
}
