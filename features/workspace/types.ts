export type CourseType = "COURSE" | "SUBJECT" | "PROGRAM" | "MODULE" | "CUSTOM";
export type DecimalString = string;

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

export interface WorkspaceTerm {
  id: string;
  workspaceId: string;
  name: string;
  code: string | null;
  order: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export type Term = WorkspaceTerm;

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
  defaultLevelId: string | null;
  defaultTermId: string | null;
  defaultLevel: CourseDefaultDimension | null;
  defaultTerm: CourseDefaultDimension | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDefaultDimension {
  id: string;
  name: string;
  code: string | null;
  order: number | null;
}

export interface CourseFilters {
  levelId?: string;
  termId?: string;
}

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

export interface GradingBand {
  label: string;
  minScore: number;
  gradePoint: number;
}

export interface GradingScheme {
  id: string;
  workspaceId: string;
  name: string;
  maxGradePoint: DecimalString | null;
  bands: GradingBand[];
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
  sessionId: string;
  termId: string | null;
  levelId: string | null;
  assessmentSchemeId: string | null;
  gradingSchemeId: string | null;
  creditUnits: DecimalString | null;
  createdAt: string;
  updatedAt: string;
  course: Pick<WorkspaceCourse, "id" | "name" | "code" | "type">;
  session: Pick<WorkspaceSession, "id" | "name">;
  term: Pick<WorkspaceTerm, "id" | "name" | "code" | "order"> | null;
  level: Pick<WorkspaceLevel, "id" | "name" | "code"> | null;
  assessmentScheme: Pick<AssessmentScheme, "id" | "name" | "components"> | null;
  gradingScheme: Pick<
    GradingScheme,
    "id" | "name" | "maxGradePoint" | "bands"
  > | null;
}

export type ResultOfferingContext = Omit<
  CourseOffering,
  "workspaceId" | "createdAt" | "updatedAt"
>;

export interface ResultRecord {
  id: string;
  workspaceId: string;
  courseOfferingId: string;
  studentId: string;
  scores: Record<string, number>;
  totalScore: DecimalString;
  createdAt: string;
  updatedAt: string;
  student: Pick<Student, "id" | "matricNumber" | "name">;
  courseOffering: ResultOfferingContext;
}

export type AssessmentSchemeInput = Pick<
  AssessmentScheme,
  "name" | "components"
>;
export type GradingSchemeInput = {
  name: string;
  maxGradePoint?: number | null;
  bands: GradingBand[];
};
export type StudentInput = {
  name: string;
  matricNumber?: string | null;
  metadata?: Record<string, unknown>;
};
export type ResolveCourseOfferingInput = {
  courseId: string;
  sessionId: string;
  levelId?: string | null;
  termId?: string | null;
  assessmentSchemeId?: string | null;
  gradingSchemeId?: string | null;
  creditUnits?: number | null;
};
export type UpdateCourseOfferingConfigurationInput = {
  assessmentSchemeId?: string | null;
  gradingSchemeId?: string | null;
  creditUnits?: number | null;
};
export type CreateResultInput = {
  courseOfferingId: string;
  studentId: string;
  scores: Record<string, number>;
};
export type UpdateResultInput = {
  scores: Record<string, number>;
};

export interface GpaScopeInput {
  sessionId: string;
  termId?: string | null;
  levelId?: string | null;
  studentId?: string;
}

export interface GpaScope {
  sessionId: string;
  termId: string | null;
  levelId: string | null;
}

export interface MissingOfferingConfiguration {
  courseOfferingId: string;
  courseId: string;
  courseCode: string | null;
  courseName: string;
  missing: Array<"assessmentSchemeId" | "creditUnits" | "gradingSchemeId">;
}

export interface MissingCourseResult {
  courseOfferingId: string;
  courseId: string;
  courseCode: string | null;
  courseName: string;
}

export interface IncompleteStudent {
  studentId: string;
  studentName: string;
  matricNumber: string | null;
  missingResults: MissingCourseResult[];
}

export interface GpaPreflightResponse {
  ready: false;
  scope: GpaScope;
  missingConfiguration: MissingOfferingConfiguration[];
  incompleteStudents: IncompleteStudent[];
}

export interface GpaCourseCalculation {
  courseOfferingId: string;
  courseCode: string | null;
  courseName: string;
  totalScore: DecimalString;
  grade: string;
  gradePoint: DecimalString;
  creditUnits: DecimalString;
  qualityPoints: DecimalString;
}

export interface SingleStudentGpaResponse {
  ready: true;
  student: Pick<Student, "id" | "name" | "matricNumber">;
  scope: GpaScope;
  courses: GpaCourseCalculation[];
  totalCreditUnits: DecimalString;
  totalQualityPoints: DecimalString;
  gpa: DecimalString | null;
  cumulativeCreditUnits: DecimalString;
  cumulativeQualityPoints: DecimalString;
  cgpa: DecimalString | null;
}

export interface BatchStudentGpa {
  studentId: string;
  name: string;
  matricNumber: string | null;
  totalCreditUnits: DecimalString;
  totalQualityPoints: DecimalString;
  gpa: DecimalString | null;
  cumulativeCreditUnits: DecimalString;
  cumulativeQualityPoints: DecimalString;
  cgpa: DecimalString | null;
}

export interface BatchGpaResponse {
  ready: true;
  scope: GpaScope;
  students: BatchStudentGpa[];
  incompleteStudents: IncompleteStudent[];
}

export type CalculateGpaResponse =
  | GpaPreflightResponse
  | SingleStudentGpaResponse
  | BatchGpaResponse;

export interface SaveGpaInput {
  studentId: string;
  sessionId: string;
  termId?: string | null;
  levelId?: string | null;
}

export interface SaveBatchGpaInput {
  sessionId: string;
  termId?: string | null;
  levelId?: string | null;
}

export interface SavedAcademicSummary {
  id: string;
  workspaceId: string;
  studentId: string;
  sessionId: string;
  termId: string | null;
  levelId: string | null;
  gpa: DecimalString;
  cgpa: DecimalString | null;
  totalCreditUnits: DecimalString;
  totalQualityPoints: DecimalString;
  cumulativeCreditUnits: DecimalString | null;
  cumulativeQualityPoints: DecimalString | null;
  calculatedAt: string;
}

export interface SaveGpaReadyResponse {
  ready: true;
  summary: SavedAcademicSummary;
  calculation: SingleStudentGpaResponse;
}

export type SaveGpaResponse = GpaPreflightResponse | SaveGpaReadyResponse;

export interface SaveBatchGpaReadyResponse {
  ready: true;
  scope: GpaScope;
  savedSummaries: SavedAcademicSummary[];
  incompleteStudents: IncompleteStudent[];
}

export type SaveBatchGpaResponse =
  | GpaPreflightResponse
  | SaveBatchGpaReadyResponse;

export interface AcademicRecordResult {
  id: string;
  courseOfferingId: string;
  course: Pick<WorkspaceCourse, "id" | "code" | "name">;
  scores: Record<string, number>;
  totalScore: DecimalString;
  grade: string | null;
  gradePoint: DecimalString | null;
  creditUnits: DecimalString | null;
  createdAt: string;
}

export interface AcademicRecordGroup {
  session: Pick<WorkspaceSession, "id" | "name" | "startsAt" | "createdAt">;
  term: Pick<
    WorkspaceTerm,
    "id" | "name" | "code" | "order" | "createdAt"
  > | null;
  level: Pick<WorkspaceLevel, "id" | "name" | "code" | "order"> | null;
  results: AcademicRecordResult[];
}

export interface SavedAcademicSummaryWithLabels extends SavedAcademicSummary {
  session: Pick<WorkspaceSession, "id" | "name">;
  term: Pick<WorkspaceTerm, "id" | "name" | "code" | "order"> | null;
  level: Pick<WorkspaceLevel, "id" | "name" | "code"> | null;
}

export interface StudentAcademicRecordResponse {
  student: Student;
  groups: AcademicRecordGroup[];
  savedSummaries: SavedAcademicSummaryWithLabels[];
  hasSavedSummaries: boolean;
}

export type GpaScreenState =
  | { kind: "idle" }
  | { kind: "calculating"; scope: GpaScopeInput }
  | { kind: "preflight"; response: GpaPreflightResponse }
  | { kind: "single-ready"; response: SingleStudentGpaResponse }
  | { kind: "batch-ready"; response: BatchGpaResponse }
  | { kind: "error"; message: string };

export interface WorkspaceDetails extends WorkspaceSummary {
  sessions: WorkspaceSession[];
  terms: WorkspaceTerm[];
  levels: WorkspaceLevel[];
  courses: WorkspaceCourse[];
}

export type SessionInput = {
  name: string;
  startsAt?: string | null;
  endsAt?: string | null;
};
export type TermInput = {
  name: string;
  code?: string | null;
  order?: number | null;
  metadata?: Record<string, unknown> | null;
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
  defaultLevelId?: string | null;
  defaultTermId?: string | null;
  metadata?: Record<string, unknown> | null;
};
export type CreateWorkspaceInput = {
  name: string;
  description?: string | null;
  sessions?: SessionInput[];
  levels?: LevelInput[];
  terms?: TermInput[];
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
