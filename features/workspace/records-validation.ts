import type {
  AssessmentComponent,
  AssessmentSchemeInput,
  CreateResultInput,
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

export function estimatedTotal(
  components: AssessmentComponent[],
  scores: Record<string, number>,
) {
  return components.reduce(
    (sum, component) =>
      sum +
      ((scores[component.key] ?? 0) / component.maxScore) * component.weight,
    0,
  );
}

export function exactResultInput(
  courseOfferingId: string,
  studentId: string,
  components: AssessmentComponent[],
  values: Record<string, string>,
  status: CreateResultInput["status"],
) {
  const built = buildScores(components, values);
  return {
    ...built,
    input: {
      courseOfferingId,
      studentId,
      scores: built.scores,
      status,
    } satisfies CreateResultInput,
  };
}
