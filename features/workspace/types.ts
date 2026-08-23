export type CourseType = "COURSE" | "SUBJECT" | "PROGRAM" | "MODULE" | "CUSTOM";

export interface WorkspaceSummary {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSession {
  id: string;
  workspaceId: string;
  name: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceLevel {
  id: string;
  workspaceId: string;
  name: string;
  code: string | null;
  order: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceCourse {
  id: string;
  workspaceId: string;
  name: string;
  code: string | null;
  type: CourseType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDetails extends WorkspaceSummary {
  sessions: WorkspaceSession[];
  levels: WorkspaceLevel[];
  courses: WorkspaceCourse[];
}

export type SessionInput = {
  name: string;
  startsAt?: string | null;
  endsAt?: string | null;
};
export type LevelInput = {
  name: string;
  code?: string | null;
  order?: number | null;
  metadata?: Record<string, unknown> | null;
};
export type CourseInput = {
  name: string;
  code?: string | null;
  type?: CourseType;
  metadata?: Record<string, unknown> | null;
};
export type CreateWorkspaceInput = {
  name: string;
  description?: string | null;
  sessions?: SessionInput[];
  levels?: LevelInput[];
};
export type WorkspacePatch = {
  name?: string;
  description?: string | null;
  sessions?: {
    create?: SessionInput[];
    update?: (Partial<SessionInput> & { sessionId: string })[];
  };
  levels?: {
    create?: LevelInput[];
    update?: (Partial<LevelInput> & { levelId: string })[];
  };
  courses?: {
    create?: CourseInput[];
    update?: (Partial<CourseInput> & { courseId: string })[];
  };
};
