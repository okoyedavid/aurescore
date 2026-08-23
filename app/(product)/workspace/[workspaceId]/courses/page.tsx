import WorkspaceCoursesPage from "@/features/workspace/WorkspaceCoursesPage";
export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceCoursesPage workspaceId={workspaceId} />;
}
