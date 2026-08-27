export type DecimalString = string;

export type CalculatorSession = {
  id: string;
  publicCalculatorId: string;
  name: string;
  order: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type CalculatorTermOrLevel = CalculatorSession & {
  code: string | null;
};

export type DimensionSummary = {
  id: string;
  name: string;
  code: string | null;
  order: number | null;
};

export type CalculatorCourse = {
  id: string;
  publicCalculatorId: string;
  name: string;
  code: string | null;
  levelId: string | null;
  termId: string | null;
  creditUnits: DecimalString;
  order: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  level: DimensionSummary | null;
  term: DimensionSummary | null;
};

export type GradingBand = {
  label: string;
  minScore: number;
  gradePoint: number;
};

export type CalculatorGradingScheme = {
  id: string;
  maxGradePoint: DecimalString;
  bands: GradingBand[];
  createdAt: string;
  updatedAt: string;
};

export type CreatorCalculatorSummary = {
  id: string;
  title: string;
  description: string | null;
  institutionName: string | null;
  departmentName: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    sessions: number;
    terms: number;
    levels: number;
    courses: number;
  };
};

export type CreatorCalculatorDetail = Omit<
  CreatorCalculatorSummary,
  "_count"
> & {
  sessions: CalculatorSession[];
  terms: CalculatorTermOrLevel[];
  levels: CalculatorTermOrLevel[];
  courses: CalculatorCourse[];
  gradingScheme: CalculatorGradingScheme | null;
  publicPath?: string;
};

export type CalculatorSessionInput = {
  name: string;
  order?: number | null;
  metadata?: Record<string, unknown> | null;
};

export type CalculatorTermOrLevelInput = CalculatorSessionInput & {
  code?: string | null;
};

export type CalculatorGradingSchemeInput = {
  maxGradePoint: number;
  bands: GradingBand[];
};

export type CreateCalculatorInput = {
  title: string;
  description?: string | null;
  institutionName?: string | null;
  departmentName?: string | null;
  sessions?: CalculatorSessionInput[];
  terms?: CalculatorTermOrLevelInput[];
  levels?: CalculatorTermOrLevelInput[];
  gradingScheme?: CalculatorGradingSchemeInput;
};

export type UpdateCalculatorInput = Partial<
  Pick<
    CreateCalculatorInput,
    "title" | "description" | "institutionName" | "departmentName"
  >
> & { gradingScheme?: CalculatorGradingSchemeInput };

export type CalculatorCourseInput = {
  name: string;
  code?: string | null;
  levelId?: string | null;
  termId?: string | null;
  creditUnits: number;
  order?: number | null;
  metadata?: Record<string, unknown> | null;
};

export type CalculatorCourseFilters = {
  levelId?: string;
  termId?: string;
};

export type PublicCatalogueItem = Pick<
  CreatorCalculatorSummary,
  | "id"
  | "title"
  | "description"
  | "institutionName"
  | "departmentName"
  | "createdAt"
>;

export type PublicCatalogueResponse = {
  items: PublicCatalogueItem[];
  nextCursor: string | null;
};

export type PublicSession = Pick<
  CalculatorSession,
  "id" | "name" | "order" | "metadata"
>;
export type PublicTermOrLevel = PublicSession & { code: string | null };
export type PublicCourse = Pick<
  CalculatorCourse,
  | "id"
  | "name"
  | "code"
  | "levelId"
  | "termId"
  | "creditUnits"
  | "order"
  | "metadata"
>;

export type PublicCalculatorDetail = {
  id: string;
  title: string;
  description: string | null;
  institutionName: string | null;
  departmentName: string | null;
  sessions: PublicSession[];
  terms: PublicTermOrLevel[];
  levels: PublicTermOrLevel[];
  courses: PublicCourse[];
  gradingScheme: Pick<
    CalculatorGradingScheme,
    "id" | "maxGradePoint" | "bands"
  >;
  publicPath: string;
};

export type CalculationInputContext = {
  sessionId?: string;
  termId?: string;
  levelId?: string;
};

export type ScoreCalculationEntry = CalculationInputContext & {
  courseId: string;
  score: number;
};
export type GradeCalculationEntry = CalculationInputContext & {
  courseId: string;
  grade: string;
};
export type PublicCalculationEntry =
  | ScoreCalculationEntry
  | GradeCalculationEntry;

export type PublicCalculationInput = CalculationInputContext & {
  entries: PublicCalculationEntry[];
};

export type CalculationDimension = { id: string; name: string };

export type CalculatedCourse = {
  course: {
    id: string;
    name: string;
    code: string | null;
    metadata: Record<string, unknown> | null;
  };
  session: CalculationDimension | null;
  term: CalculationDimension | null;
  level: CalculationDimension | null;
  score: DecimalString | null;
  grade: string;
  gradePoint: DecimalString;
  creditUnits: DecimalString;
  qualityPoints: DecimalString;
};

export type CalculationTotals = {
  totalCreditUnits: DecimalString;
  totalQualityPoints: DecimalString;
  gpa: DecimalString | null;
};

export type PublicCalculationResponse = CalculationTotals & {
  calculator: {
    id: string;
    title: string;
    institutionName: string | null;
    departmentName: string | null;
    maxGradePoint: DecimalString;
  };
  publicPath: string;
  entries: CalculatedCourse[];
  cgpa: DecimalString | null;
  groups: Array<
    CalculationTotals & {
      session: CalculationDimension | null;
      term: CalculationDimension | null;
      level: CalculationDimension | null;
    }
  >;
  sessions: Array<CalculationTotals & { session: CalculationDimension | null }>;
};

export type CalculatorDraft = {
  version: 1;
  updatedAt: string;
  configurationFingerprint: string;
  mode: "score" | "grade";
  sessionId: string;
  termId: string;
  levelId: string;
  selectedCourseIds: string[];
  inputs: Record<string, string>;
};
