import WorkspaceLevelsPage from "@/features/workspace/WorkspaceLevelsPage";
export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceLevelsPage workspaceId={workspaceId} />;
}
