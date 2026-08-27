import WorkspaceResultsPage from "@/features/workspace/WorkspaceResultsPage";

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
    <WorkspaceResultsPage
      workspaceId={workspaceId}
      initialSelection={{
        sessionId: selected("session"),
        termId: selected("term"),
        levelId: selected("level"),
        courseId: selected("course"),
        assessmentSchemeId: selected("scheme"),
        gradingSchemeId: selected("grading"),
        creditUnits: selected("units"),
      }}
      initialOfferingId={selected("offering")}
      initialStudentId={selected("student")}
    />
  );
}
