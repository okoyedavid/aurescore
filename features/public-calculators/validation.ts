import type {
  CalculatorCourseInput,
  CalculatorGradingSchemeInput,
  CalculatorSessionInput,
  CalculatorTermOrLevelInput,
  CreateCalculatorInput,
  GradingBand,
  PublicCalculationEntry,
  PublicCourse,
} from "./types";

export type CalculatorFieldErrors = Record<string, string>;
export type GradingBandDraft = {
  rowId: number;
  label: string;
  minScore: string;
  gradePoint: string;
};

const optional = (value: string) => value.trim() || null;
const optionalOrder = (value: string) =>
  value.trim() ? Number(value.trim()) : null;

export function parseMetadata(value: string): {
  value?: Record<string, unknown> | null;
  error?: string;
} {
  if (!value.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? { value: parsed as Record<string, unknown> }
      : { error: "Metadata must be a JSON object." };
  } catch {
    return { error: "Metadata must be valid JSON." };
  }
}

export function normalizeIdentity(values: {
  title: string;
  description: string;
  institutionName: string;
  departmentName: string;
}): Pick<
  CreateCalculatorInput,
  "title" | "description" | "institutionName" | "departmentName"
> {
  return {
    title: values.title.trim(),
    description: optional(values.description),
    institutionName: optional(values.institutionName),
    departmentName: optional(values.departmentName),
  };
}

export function validateIdentity(
  input: Pick<
    CreateCalculatorInput,
    "title" | "description" | "institutionName" | "departmentName"
  >,
): CalculatorFieldErrors {
  const errors: CalculatorFieldErrors = {};
  if (!input.title || input.title.length > 120)
    errors.title = "Title must be between 1 and 120 characters.";
  if ((input.description?.length ?? 0) > 500)
    errors.description = "Description must be at most 500 characters.";
  if ((input.institutionName?.length ?? 0) > 160)
    errors.institutionName = "Institution name must be at most 160 characters.";
  if ((input.departmentName?.length ?? 0) > 160)
    errors.departmentName = "Department name must be at most 160 characters.";
  return errors;
}

export function normalizeDimension(
  values: { name: string; code?: string; order: string; metadata?: string },
  withCode: boolean,
): CalculatorSessionInput | CalculatorTermOrLevelInput {
  const metadata = parseMetadata(values.metadata ?? "");
  return {
    name: values.name.trim(),
    ...(withCode ? { code: optional(values.code ?? "") } : {}),
    order: optionalOrder(values.order),
    ...(metadata.error ? {} : { metadata: metadata.value }),
  };
}

export function validateDimension(
  input: CalculatorSessionInput | CalculatorTermOrLevelInput,
  prefix: string,
  metadataError?: string,
): CalculatorFieldErrors {
  const errors: CalculatorFieldErrors = {};
  if (!input.name || input.name.length > 120)
    errors[`${prefix}.name`] = "Name must be between 1 and 120 characters.";
  if ("code" in input && (input.code?.length ?? 0) > 30)
    errors[`${prefix}.code`] = "Code must be at most 30 characters.";
  if (
    input.order !== null &&
    input.order !== undefined &&
    (!Number.isInteger(input.order) || input.order < 0)
  )
    errors[`${prefix}.order`] = "Order must be a non-negative whole number.";
  if (metadataError) errors[`${prefix}.metadata`] = metadataError;
  return errors;
}

export function normalizeCourse(values: {
  name: string;
  code: string;
  levelId: string;
  termId: string;
  creditUnits: string;
  order: string;
  metadata: string;
}): CalculatorCourseInput {
  const metadata = parseMetadata(values.metadata);
  return {
    name: values.name.trim(),
    code: optional(values.code),
    levelId: optional(values.levelId),
    termId: optional(values.termId),
    creditUnits: Number(values.creditUnits),
    order: optionalOrder(values.order),
    ...(metadata.error ? {} : { metadata: metadata.value }),
  };
}

export function validateCourse(
  input: CalculatorCourseInput,
  metadataError?: string,
): CalculatorFieldErrors {
  const errors: CalculatorFieldErrors = {};
  if (!input.name || input.name.length > 120)
    errors["course.name"] = "Name must be between 1 and 120 characters.";
  if ((input.code?.length ?? 0) > 30)
    errors["course.code"] = "Code must be at most 30 characters.";
  if (!Number.isFinite(input.creditUnits) || input.creditUnits <= 0)
    errors["course.creditUnits"] = "Credit units must be greater than zero.";
  if (
    input.order !== null &&
    input.order !== undefined &&
    (!Number.isInteger(input.order) || input.order < 0)
  )
    errors["course.order"] = "Order must be a non-negative whole number.";
  if (metadataError) errors["course.metadata"] = metadataError;
  return errors;
}

export function buildGradingScheme(values: {
  maxGradePoint: string;
  bands: GradingBandDraft[];
}): {
  input?: CalculatorGradingSchemeInput;
  errors: CalculatorFieldErrors;
} {
  const errors: CalculatorFieldErrors = {};
  const maxGradePoint = Number(values.maxGradePoint);
  if (
    !values.maxGradePoint.trim() ||
    !Number.isFinite(maxGradePoint) ||
    maxGradePoint < 0
  )
    errors.maxGradePoint = "Enter a non-negative maximum grade point.";
  if (!values.bands.length) errors.bands = "Add at least one grading band.";

  const bands: GradingBand[] = values.bands.map((band, index) => {
    const label = band.label.trim();
    const minScore = Number(band.minScore);
    const gradePoint = Number(band.gradePoint);
    if (!label) errors[`bands.${index}.label`] = "Enter a grade label.";
    if (
      !band.minScore.trim() ||
      !Number.isFinite(minScore) ||
      minScore < 0 ||
      minScore > 100
    )
      errors[`bands.${index}.minScore`] =
        "Minimum score must be from 0 to 100.";
    if (
      !band.gradePoint.trim() ||
      !Number.isFinite(gradePoint) ||
      gradePoint < 0 ||
      (Number.isFinite(maxGradePoint) && gradePoint > maxGradePoint)
    )
      errors[`bands.${index}.gradePoint`] =
        "Grade point must be non-negative and not exceed the maximum.";
    return { label, minScore, gradePoint };
  });

  const labels = new Set<string>();
  const boundaries = new Set<number>();
  bands.forEach((band, index) => {
    const normalizedLabel = band.label.toLocaleLowerCase();
    if (normalizedLabel && labels.has(normalizedLabel))
      errors[`bands.${index}.label`] = "Grade labels must be unique.";
    labels.add(normalizedLabel);
    if (Number.isFinite(band.minScore) && boundaries.has(band.minScore))
      errors[`bands.${index}.minScore`] =
        "Minimum-score boundaries must be unique.";
    boundaries.add(band.minScore);
  });
  if (bands.length && !bands.some((band) => band.minScore === 0))
    errors.bands = "The lowest grading band must start at 0.";

  const ordered = bands.slice().sort((a, b) => b.minScore - a.minScore);
  for (let index = 0; index < ordered.length - 1; index += 1) {
    if (ordered[index].gradePoint < ordered[index + 1].gradePoint)
      errors.bands = "Higher score bands cannot have lower grade points.";
  }

  return Object.keys(errors).length
    ? { errors }
    : { errors, input: { maxGradePoint, bands: ordered } };
}

export function eligibleCourses(
  courses: PublicCourse[],
  termId: string,
  levelId: string,
) {
  return courses.filter(
    (course) =>
      (!termId || course.termId === null || course.termId === termId) &&
      (!levelId || course.levelId === null || course.levelId === levelId),
  );
}

export function buildCalculationEntries(values: {
  mode: "score" | "grade";
  selectedCourseIds: string[];
  inputs: Record<string, string>;
  allowedGrades?: string[];
}): { entries: PublicCalculationEntry[]; errors: CalculatorFieldErrors } {
  const errors: CalculatorFieldErrors = {};
  const seen = new Set<string>();
  const entries: PublicCalculationEntry[] = [];
  values.selectedCourseIds.forEach((courseId) => {
    if (seen.has(courseId)) {
      errors.entries = "A Course can only be submitted once per calculation.";
      return;
    }
    seen.add(courseId);
    const raw = values.inputs[courseId]?.trim() ?? "";
    if (!raw) return;
    if (values.mode === "score") {
      const score = Number(raw);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        errors[`entries.${courseId}`] = "Score must be from 0 to 100.";
        return;
      }
      entries.push({ courseId, score });
    } else {
      if (
        values.allowedGrades &&
        !values.allowedGrades.some(
          (grade) => grade.toLocaleLowerCase() === raw.toLocaleLowerCase(),
        )
      ) {
        errors[`entries.${courseId}`] =
          "Select a grade from this calculator's scheme.";
        return;
      }
      entries.push({ courseId, grade: raw });
    }
  });
  if (!entries.length)
    errors.entries = "Complete at least one selected Course.";
  return { entries, errors };
}
