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
};
