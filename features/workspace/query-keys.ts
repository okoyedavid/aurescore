export const workspaceKeys = {
  all: ["workspaces"] as const,
  detail: (workspaceId: string) => ["workspace", workspaceId] as const,
  sessions: (workspaceId: string) =>
    ["workspace", workspaceId, "sessions"] as const,
  session: (workspaceId: string, sessionId: string) =>
    ["workspace", workspaceId, "sessions", sessionId] as const,
  terms: (workspaceId: string) => ["workspace", workspaceId, "terms"] as const,
  term: (workspaceId: string, termId: string) =>
    ["workspace", workspaceId, "terms", termId] as const,
  levels: (workspaceId: string) =>
    ["workspace", workspaceId, "levels"] as const,
  level: (workspaceId: string, levelId: string) =>
    ["workspace", workspaceId, "levels", levelId] as const,
  courses: (
    workspaceId: string,
    filters?: { levelId?: string; termId?: string },
  ) =>
    filters?.levelId || filters?.termId
      ? ([
          "workspace",
          workspaceId,
          "courses",
          {
            levelId: filters.levelId || null,
            termId: filters.termId || null,
          },
        ] as const)
      : (["workspace", workspaceId, "courses"] as const),
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
  gradingSchemes: (workspaceId: string) =>
    ["workspace", workspaceId, "grading-schemes"] as const,
  gradingScheme: (workspaceId: string, gradingSchemeId: string) =>
    ["workspace", workspaceId, "grading-schemes", gradingSchemeId] as const,
  students: (workspaceId: string) =>
    ["workspace", workspaceId, "students"] as const,
  student: (workspaceId: string, studentId: string) =>
    ["workspace", workspaceId, "students", studentId] as const,
  courseOfferings: (workspaceId: string) =>
    ["workspace", workspaceId, "course-offerings"] as const,
  courseOffering: (workspaceId: string, courseOfferingId: string) =>
    ["workspace", workspaceId, "course-offerings", courseOfferingId] as const,
  academicRevision: (workspaceId: string) =>
    ["workspace", workspaceId, "academic-revision"] as const,
  academicRecords: (workspaceId: string) =>
    ["workspace", workspaceId, "students", "academic-record"] as const,
  academicRecord: (workspaceId: string, studentId: string) =>
    [
      "workspace",
      workspaceId,
      "students",
      "academic-record",
      studentId,
    ] as const,
  results: (workspaceId: string) =>
    ["workspace", workspaceId, "results"] as const,
  result: (workspaceId: string, resultId: string) =>
    ["workspace", workspaceId, "results", resultId] as const,
};
