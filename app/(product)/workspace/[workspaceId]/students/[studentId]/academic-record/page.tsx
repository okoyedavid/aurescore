import StudentAcademicRecordPage from "@/features/workspace/StudentAcademicRecordPage";

export default async function Page({
  params,
}: {
  params: Promise<{ workspaceId: string; studentId: string }>;
}) {
  const { workspaceId, studentId } = await params;
  return (
    <StudentAcademicRecordPage
      workspaceId={workspaceId}
      studentId={studentId}
    />
  );
}
