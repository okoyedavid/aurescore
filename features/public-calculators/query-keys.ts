import type { CalculatorCourseFilters } from "./types";

export const publicCalculatorKeys = {
  all: ["public-calculators"] as const,
  creator: ["public-calculators", "creator"] as const,
  creatorList: () => ["public-calculators", "creator", "list"] as const,
  creatorDetail: (calculatorId: string) =>
    ["public-calculators", "creator", "detail", calculatorId] as const,
  resource: (calculatorId: string, resource: "sessions" | "terms" | "levels") =>
    ["public-calculators", "creator", calculatorId, resource] as const,
  resourceDetail: (
    calculatorId: string,
    resource: "sessions" | "terms" | "levels",
    resourceId: string,
  ) =>
    [
      "public-calculators",
      "creator",
      calculatorId,
      resource,
      resourceId,
    ] as const,
  courses: (calculatorId: string, filters: CalculatorCourseFilters = {}) =>
    [
      "public-calculators",
      "creator",
      calculatorId,
      "courses",
      { levelId: filters.levelId ?? null, termId: filters.termId ?? null },
    ] as const,
  coursePrefix: (calculatorId: string) =>
    ["public-calculators", "creator", calculatorId, "courses"] as const,
  course: (calculatorId: string, courseId: string) =>
    [
      "public-calculators",
      "creator",
      calculatorId,
      "courses",
      "detail",
      courseId,
    ] as const,
  public: ["public-calculators", "public"] as const,
  catalogues: ["public-calculators", "public", "catalogue"] as const,
  catalogue: (limit: number) =>
    ["public-calculators", "public", "catalogue", { limit }] as const,
  publicDetail: (calculatorId: string) =>
    ["public-calculators", "public", "detail", calculatorId] as const,
};
