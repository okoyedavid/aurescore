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

export type ResultStatus = "DRAFT" | "PUBLISHED";

export interface AssessmentComponent {
  key: string;
  label: string;
  maxScore: number;
  weight: number;
}

export interface AssessmentScheme {
  id: string;
  workspaceId: string;
  name: string;
  components: AssessmentComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  workspaceId: string;
  matricNumber: string | null;
  name: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseOffering {
  id: string;
  workspaceId: string;
  courseId: string;
  sessionId: string | null;
  levelId: string | null;
  assessmentSchemeId: string;
  creditUnits: string | null;
  createdAt: string;
  updatedAt: string;
  course: Pick<WorkspaceCourse, "id" | "name" | "code" | "type">;
  session: Pick<WorkspaceSession, "id" | "name"> | null;
  level: Pick<WorkspaceLevel, "id" | "name" | "code"> | null;
  assessmentScheme: Pick<AssessmentScheme, "id" | "name" | "components">;
}

export interface ResultRecord {
  id: string;
  workspaceId: string;
  courseOfferingId: string;
  studentId: string;
  scores: Record<string, number>;
  totalScore: string;
  status: ResultStatus;
  createdAt: string;
  updatedAt: string;
  student: Pick<Student, "id" | "matricNumber" | "name">;
}

export type AssessmentSchemeInput = Pick<
  AssessmentScheme,
  "name" | "components"
>;
export type StudentInput = {
  name: string;
  matricNumber?: string | null;
  metadata?: Record<string, unknown>;
};
export type ResolveCourseOfferingInput = {
  courseId: string;
  sessionId: string;
  levelId?: string | null;
  assessmentSchemeId: string;
  creditUnits?: number | null;
};
export type CreateResultInput = {
  courseOfferingId: string;
  studentId: string;
  scores: Record<string, number>;
  status?: ResultStatus;
};
export type UpdateResultInput = {
  scores?: Record<string, number>;
  status?: ResultStatus;
};

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
