import type {
  AttemptType,
  CalculatorDraft,
  PublicCalculatorDetail,
} from "./types";

export const calculatorDraftKey = (calculatorId: string) =>
  `aurescore:public-calculator:${calculatorId}`;

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
    const parsed = JSON.parse(raw) as {
      version?: number;
      calculatorId?: string;
      updatedAt?: string;
      configurationFingerprint?: string;
      current?: Partial<CalculatorDraft["current"]> & {
        carryovers?: Array<
          Partial<CalculatorDraft["current"]["carryovers"][number]>
        >;
      };
      groups?: Array<
        Partial<Omit<CalculatorDraft["groups"][number], "entries">> & {
          entries: Array<
            Partial<CalculatorDraft["groups"][number]["entries"][number]>
          >;
        }
      >;
    };
    const isAttemptType = (value: unknown): value is AttemptType =>
      value === "REGULAR" || value === "CARRYOVER";
    const value =
      (parsed.version === 2 || parsed.version === 3) &&
      parsed.current &&
      Array.isArray(parsed.groups)
        ? {
            ...parsed,
            version: 4 as const,
            current: {
              ...parsed.current,
              carryovers: (parsed.current.carryovers ?? []).map((entry) => ({
                ...entry,
                attemptType: "CARRYOVER" as const,
              })),
            },
            groups: parsed.groups.map((group) => ({
              ...group,
              entries: group.entries.map((entry) => ({
                ...entry,
                attemptId:
                  entry.attemptId ??
                  `attempt:${group.sessionId}:${group.levelId}:${group.termId}:${entry.courseId}`,
                attemptType: isAttemptType(entry.attemptType)
                  ? entry.attemptType
                  : entry.isCarryover
                    ? ("CARRYOVER" as const)
                    : ("REGULAR" as const),
              })),
            })),
          }
        : parsed;
    if (
      value.version !== 4 ||
      value.calculatorId !== calculatorId ||
      value.configurationFingerprint !== fingerprint ||
      !value.current ||
      (value.current.mode !== "score" && value.current.mode !== "grade") ||
      typeof value.current.inputs !== "object" ||
      !Array.isArray(value.current.carryovers) ||
      value.current.carryovers.some(
        (entry) =>
          !entry ||
          typeof entry.attemptId !== "string" ||
          typeof entry.courseId !== "string" ||
          typeof entry.originalLevelId !== "string" ||
          typeof entry.originalTermId !== "string" ||
          !isAttemptType(entry.attemptType),
      ) ||
      !Array.isArray(value.groups) ||
      value.groups.some(
        (group) =>
          !group ||
          (group.mode !== "score" && group.mode !== "grade") ||
          !Array.isArray(group.entries) ||
          group.entries.some(
            (entry) =>
              !entry ||
              typeof entry.attemptId !== "string" ||
              typeof entry.courseId !== "string" ||
              typeof entry.value !== "string" ||
              !isAttemptType(entry.attemptType),
          ),
      )
    ) {
      clearCalculatorDraft(calculatorId);
      return null;
    }
    const draft = value as CalculatorDraft;
    if (parsed.version === 2 || parsed.version === 3)
      writeCalculatorDraft(calculatorId, draft);
    return draft;
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
