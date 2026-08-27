import type { CalculatorDraft, PublicCalculatorDetail } from "./types";

export const calculatorDraftKey = (calculatorId: string) =>
  `aurescore:public-calculator:${calculatorId}:draft:v1`;

export function configurationFingerprint(calculator: PublicCalculatorDetail) {
  return JSON.stringify({
    courses: calculator.courses.map((course) => [
      course.id,
      course.levelId,
      course.termId,
      course.creditUnits,
    ]),
    bands: calculator.gradingScheme.bands.map((band) => [
      band.label,
      band.minScore,
      band.gradePoint,
    ]),
  });
}

function storage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readCalculatorDraft(
  calculatorId: string,
  fingerprint: string,
): CalculatorDraft | null {
  try {
    const raw = storage()?.getItem(calculatorDraftKey(calculatorId));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<CalculatorDraft>;
    if (
      value.version !== 1 ||
      value.configurationFingerprint !== fingerprint ||
      (value.mode !== "score" && value.mode !== "grade") ||
      !Array.isArray(value.selectedCourseIds) ||
      !value.inputs ||
      typeof value.inputs !== "object"
    ) {
      clearCalculatorDraft(calculatorId);
      return null;
    }
    return value as CalculatorDraft;
  } catch {
    clearCalculatorDraft(calculatorId);
    return null;
  }
}

export function writeCalculatorDraft(
  calculatorId: string,
  draft: CalculatorDraft,
) {
  try {
    storage()?.setItem(calculatorDraftKey(calculatorId), JSON.stringify(draft));
  } catch {}
}

export function clearCalculatorDraft(calculatorId: string) {
  try {
    storage()?.removeItem(calculatorDraftKey(calculatorId));
  } catch {}
}
