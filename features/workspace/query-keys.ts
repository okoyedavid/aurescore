export const workspaceKeys = {
  all: ["workspaces"] as const,
  detail: (workspaceId: string) => ["workspace", workspaceId] as const,
  sessions: (workspaceId: string) =>
    ["workspace", workspaceId, "sessions"] as const,
  session: (workspaceId: string, sessionId: string) =>
    ["workspace", workspaceId, "sessions", sessionId] as const,
  levels: (workspaceId: string) =>
    ["workspace", workspaceId, "levels"] as const,
  level: (workspaceId: string, levelId: string) =>
    ["workspace", workspaceId, "levels", levelId] as const,
  courses: (workspaceId: string) =>
    ["workspace", workspaceId, "courses"] as const,
  course: (workspaceId: string, courseId: string) =>
    ["workspace", workspaceId, "courses", courseId] as const,
  assessmentSchemes: (workspaceId: string) =>
    ["workspace", workspaceId, "assessment-schemes"] as const,
  assessmentScheme: (workspaceId: string, assessmentSchemeId: string) =>
    [
      "workspace",
      workspaceId,
      "assessment-schemes",
      assessmentSchemeId,
    ] as const,
  students: (workspaceId: string) =>
    ["workspace", workspaceId, "students"] as const,
  student: (workspaceId: string, studentId: string) =>
    ["workspace", workspaceId, "students", studentId] as const,
  courseOfferings: (workspaceId: string) =>
    ["workspace", workspaceId, "course-offerings"] as const,
  courseOffering: (workspaceId: string, courseOfferingId: string) =>
    ["workspace", workspaceId, "course-offerings", courseOfferingId] as const,
  results: (workspaceId: string) =>
    ["workspace", workspaceId, "results"] as const,
  result: (workspaceId: string, resultId: string) =>
    ["workspace", workspaceId, "results", resultId] as const,
};
