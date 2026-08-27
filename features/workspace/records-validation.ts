import type {
  AssessmentComponent,
  AssessmentSchemeInput,
  CreateResultInput,
  GradingSchemeInput,
  StudentInput,
} from "./types";

export type RecordErrors = Record<string, string>;
const decimalPlaces = (value: number) =>
  String(value).split(".")[1]?.length ?? 0;

export function validateScheme(input: AssessmentSchemeInput): RecordErrors {
  const errors: RecordErrors = {};
  if (!input.name.trim()) errors.name = "Name is required.";
  else if (input.name.trim().length > 120)
    errors.name = "Name must be 120 characters or fewer.";
  if (input.components.length < 1 || input.components.length > 20)
    errors.components = "Add between 1 and 20 components.";
  const seen = new Set<string>();
  input.components.forEach((component, index) => {
    const base = `components.${index}`;
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(component.key))
      errors[`${base}.key`] =
        "Use 1–40 lowercase letters, numbers, or underscores, starting with a letter.";
    else if (seen.has(component.key))
      errors[`${base}.key`] = "Component keys must be unique.";
    seen.add(component.key);
    if (!component.label.trim() || component.label.trim().length > 80)
      errors[`${base}.label`] = "Label must be 1–80 characters.";
    if (
      !Number.isFinite(component.maxScore) ||
      component.maxScore <= 0 ||
      component.maxScore > 100000 ||
      decimalPlaces(component.maxScore) > 3
    )
      errors[`${base}.maxScore`] =
        "Maximum score must be above 0, at most 100000, with up to 3 decimals.";
    if (
      !Number.isFinite(component.weight) ||
      component.weight <= 0 ||
      component.weight > 100 ||
      decimalPlaces(component.weight) > 3
    )
      errors[`${base}.weight`] =
        "Weight must be above 0, at most 100, with up to 3 decimals.";
  });
  const total = input.components.reduce(
    (sum, component) => sum + component.weight,
    0,
  );
  if (Math.abs(total - 100) > 0.000001)
    errors.weightTotal = "Component weights must total exactly 100%.";
  return errors;
}

export function validateStudent(input: StudentInput): RecordErrors {
  const errors: RecordErrors = {};
  if (!input.name.trim()) errors.name = "Name is required.";
  else if (input.name.trim().length > 160)
    errors.name = "Name must be 160 characters or fewer.";
  if (input.matricNumber && input.matricNumber.trim().length > 80)
    errors.matricNumber = "Matric number must be 80 characters or fewer.";
  return errors;
}

export type GradingBandDraft = {
  label: string;
  minScore: string;
  gradePoint: string;
};
export type GradingSchemeDraft = {
  name: string;
  maxGradePoint: string;
  bands: GradingBandDraft[];
};

function validDecimal(
  value: string,
  maximum: number,
  decimals: number,
  minimum = 0,
) {
  if (!/^\d+(?:\.\d+)?$/.test(value.trim())) return false;
  const number = Number(value);
  const fraction = value.trim().split(".")[1]?.length ?? 0;
  return (
    Number.isFinite(number) &&
    number >= minimum &&
    number <= maximum &&
    fraction <= decimals
  );
}

export function validateGradingSchemeDraft(
  draft: GradingSchemeDraft,
): RecordErrors {
  const errors: RecordErrors = {};
  const name = draft.name.trim();
  if (!name || name.length > 120)
    errors.name = "Name must be between 1 and 120 characters.";
  const maximumText = draft.maxGradePoint.trim();
  if (maximumText && !validDecimal(maximumText, 100000, 2))
    errors.maxGradePoint =
      "Maximum grade point must be between 0 and 100000 with up to 2 decimals.";
  if (draft.bands.length < 1 || draft.bands.length > 100)
    errors.bands = "Add between 1 and 100 grade bands.";
  const maximum =
    maximumText && !errors.maxGradePoint ? Number(maximumText) : null;
  const boundaries = new Map<string, number>();
  let hasZero = false;
  draft.bands.forEach((band, index) => {
    const base = `bands.${index}`;
    const label = band.label.trim();
    if (!label || label.length > 40)
      errors[`${base}.label`] = "Label must be between 1 and 40 characters.";
    if (!validDecimal(band.minScore, 100, 3))
      errors[`${base}.minScore`] =
        "Minimum score must be between 0 and 100 with up to 3 decimals.";
    else {
      const boundary = String(Number(band.minScore));
      if (boundaries.has(boundary))
        errors[`${base}.minScore`] = "Minimum score boundaries must be unique.";
      boundaries.set(boundary, index);
      if (Number(band.minScore) === 0) hasZero = true;
    }
    if (!validDecimal(band.gradePoint, 100000, 3))
      errors[`${base}.gradePoint`] =
        "Grade point must be between 0 and 100000 with up to 3 decimals.";
    else if (maximum !== null && Number(band.gradePoint) > maximum)
      errors[`${base}.gradePoint`] =
        "Grade point cannot exceed the configured maximum.";
  });
  if (!hasZero) {
    errors.zeroBoundary = "Add a grade band with a minimum score of 0.";
    if (draft.bands.length)
      errors["bands.0.minScore"] ??= "At least one minimum score must be 0.";
  }
  return errors;
}

export function buildGradingSchemeInput(draft: GradingSchemeDraft): {
  input: GradingSchemeInput;
  errors: RecordErrors;
} {
  const errors = validateGradingSchemeDraft(draft);
  const input: GradingSchemeInput = {
    name: draft.name.trim(),
    maxGradePoint: draft.maxGradePoint.trim()
      ? Number(draft.maxGradePoint)
      : null,
    bands: draft.bands
      .map((band) => ({
        label: band.label.trim(),
        minScore: Number(band.minScore),
        gradePoint: Number(band.gradePoint),
      }))
      .sort((a, b) => b.minScore - a.minScore),
  };
  return { input, errors };
}

export function buildScores(
  components: AssessmentComponent[],
  values: Record<string, string>,
) {
  const scores: Record<string, number> = {};
  const errors: RecordErrors = {};
  components.forEach((component) => {
    const value = Number(values[component.key]);
    if (values[component.key]?.trim() === "" || !Number.isFinite(value))
      errors[component.key] = `${component.label} requires a finite score.`;
    else if (value < 0 || value > component.maxScore)
      errors[component.key] =
        `${component.label} must be between 0 and ${component.maxScore}.`;
    else scores[component.key] = value;
  });
  return { scores, errors };
}

export function exactResultInput(
  courseOfferingId: string,
  studentId: string,
  components: AssessmentComponent[],
  values: Record<string, string>,
) {
  const built = buildScores(components, values);
  return {
    ...built,
    input: {
      courseOfferingId,
      studentId,
      scores: built.scores,
    } satisfies CreateResultInput,
  };
}
