import WorkspaceEditPage from "@/features/workspace/WorkspaceEditPage";
export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceEditPage workspaceId={workspaceId} />;
}
