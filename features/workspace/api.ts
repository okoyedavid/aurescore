import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  CourseInput,
  CreateWorkspaceInput,
  LevelInput,
  SessionInput,
  WorkspaceCourse,
  WorkspaceDetails,
  WorkspaceLevel,
  WorkspacePatch,
  WorkspaceSession,
  WorkspaceSummary,
} from "./types";

async function request<T>(operation: Promise<{ data: T }>) {
  try {
    return (await operation).data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

const workspacePath = (workspaceId: string) =>
  `/workspace/${encodeURIComponent(workspaceId)}`;

export const workspaceApi = {
  list: (signal?: AbortSignal) =>
    request<WorkspaceSummary[]>(apiClient.get("/workspace", { signal })),
  create: (input: CreateWorkspaceInput) =>
    request<WorkspaceDetails>(apiClient.post("/workspace", input)),
  detail: (workspaceId: string, signal?: AbortSignal) =>
    request<WorkspaceDetails>(
      apiClient.get(workspacePath(workspaceId), { signal }),
    ),
  patch: (workspaceId: string, input: WorkspacePatch) =>
    request<WorkspaceDetails>(
      apiClient.patch(workspacePath(workspaceId), input),
    ),
  remove: (workspaceId: string) =>
    request<void>(apiClient.delete(workspacePath(workspaceId))),
  sessions: (workspaceId: string, signal?: AbortSignal) =>
    request<WorkspaceSession[]>(
      apiClient.get(`${workspacePath(workspaceId)}/sessions`, { signal }),
    ),
  session: (workspaceId: string, sessionId: string, signal?: AbortSignal) =>
    request<WorkspaceSession>(
      apiClient.get(
        `${workspacePath(workspaceId)}/sessions/${encodeURIComponent(sessionId)}`,
        { signal },
      ),
    ),
  createSession: (workspaceId: string, input: SessionInput) =>
    request<WorkspaceSession>(
      apiClient.post(`${workspacePath(workspaceId)}/sessions`, input),
    ),
  updateSession: (
    workspaceId: string,
    sessionId: string,
    input: Partial<SessionInput>,
  ) =>
    request<WorkspaceSession>(
      apiClient.patch(
        `${workspacePath(workspaceId)}/sessions/${encodeURIComponent(sessionId)}`,
        input,
      ),
    ),
  removeSession: (workspaceId: string, sessionId: string) =>
    request<void>(
      apiClient.delete(
        `${workspacePath(workspaceId)}/sessions/${encodeURIComponent(sessionId)}`,
      ),
    ),
  levels: (workspaceId: string, signal?: AbortSignal) =>
    request<WorkspaceLevel[]>(
      apiClient.get(`${workspacePath(workspaceId)}/levels`, { signal }),
    ),
  level: (workspaceId: string, levelId: string, signal?: AbortSignal) =>
    request<WorkspaceLevel>(
      apiClient.get(
        `${workspacePath(workspaceId)}/levels/${encodeURIComponent(levelId)}`,
        { signal },
      ),
    ),
  createLevel: (workspaceId: string, input: LevelInput) =>
    request<WorkspaceLevel>(
      apiClient.post(`${workspacePath(workspaceId)}/levels`, input),
    ),
  updateLevel: (
    workspaceId: string,
    levelId: string,
    input: Partial<LevelInput>,
  ) =>
    request<WorkspaceLevel>(
      apiClient.patch(
        `${workspacePath(workspaceId)}/levels/${encodeURIComponent(levelId)}`,
        input,
      ),
    ),
  removeLevel: (workspaceId: string, levelId: string) =>
    request<void>(
      apiClient.delete(
        `${workspacePath(workspaceId)}/levels/${encodeURIComponent(levelId)}`,
      ),
    ),
  courses: (workspaceId: string, signal?: AbortSignal) =>
    request<WorkspaceCourse[]>(
      apiClient.get(`${workspacePath(workspaceId)}/courses`, { signal }),
    ),
  course: (workspaceId: string, courseId: string, signal?: AbortSignal) =>
    request<WorkspaceCourse>(
      apiClient.get(
        `${workspacePath(workspaceId)}/courses/${encodeURIComponent(courseId)}`,
        { signal },
      ),
    ),
  createCourse: (workspaceId: string, input: CourseInput) =>
    request<WorkspaceCourse>(
      apiClient.post(`${workspacePath(workspaceId)}/courses`, input),
    ),
  updateCourse: (
    workspaceId: string,
    courseId: string,
    input: Partial<CourseInput>,
  ) =>
    request<WorkspaceCourse>(
      apiClient.patch(
        `${workspacePath(workspaceId)}/courses/${encodeURIComponent(courseId)}`,
        input,
      ),
    ),
  removeCourse: (workspaceId: string, courseId: string) =>
    request<void>(
      apiClient.delete(
        `${workspacePath(workspaceId)}/courses/${encodeURIComponent(courseId)}`,
      ),
    ),
};
