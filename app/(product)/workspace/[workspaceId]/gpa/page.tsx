import WorkspaceGpaPage from "@/features/workspace/WorkspaceGpaPage";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceId } = await params;
  const query = await searchParams;
  const selected = (key: string) => {
    const value = query[key];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  };
  return (
    <WorkspaceGpaPage
      workspaceId={workspaceId}
      initialSelection={{
        sessionId: selected("session"),
        termId: selected("term"),
        levelId: selected("level"),
        studentId: selected("student"),
        mode: selected("mode") === "batch" ? "batch" : "single",
      }}
    />
  );
}
