import WorkspaceStudentsPage from "@/features/workspace/WorkspaceStudentsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceStudentsPage workspaceId={workspaceId} />;
}
