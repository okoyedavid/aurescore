import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  CalculatorCourse,
  CalculatorCourseFilters,
  CalculatorCourseInput,
  CalculatorSession,
  CalculatorSessionInput,
  CalculatorTermOrLevel,
  CalculatorTermOrLevelInput,
  CreateCalculatorInput,
  CreatorCalculatorDetail,
  CreatorCalculatorSummary,
  PublicCalculationInput,
  PublicCalculationResponse,
  PublicCalculatorDetail,
  PublicCatalogueResponse,
  UpdateCalculatorInput,
} from "./types";

async function request<T>(operation: Promise<{ data: T }>) {
  try {
    return (await operation).data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

const creatorRoot = "/public-calculators";
const publicRoot = "/public/public-calculators";
const calculatorPath = (calculatorId: string) =>
  `${creatorRoot}/${encodeURIComponent(calculatorId)}`;
const publicCalculatorPath = (calculatorId: string) =>
  `${publicRoot}/${encodeURIComponent(calculatorId)}`;
const resourcePath = (
  calculatorId: string,
  resource: "sessions" | "terms" | "levels" | "courses",
  resourceId?: string,
) =>
  `${calculatorPath(calculatorId)}/${resource}${
    resourceId ? `/${encodeURIComponent(resourceId)}` : ""
  }`;

export const publicCalculatorsApi = {
  creatorList: (signal?: AbortSignal) =>
    request<CreatorCalculatorSummary[]>(apiClient.get(creatorRoot, { signal })),
  creatorDetail: (calculatorId: string, signal?: AbortSignal) =>
    request<CreatorCalculatorDetail>(
      apiClient.get(calculatorPath(calculatorId), { signal }),
    ),
  create: (input: CreateCalculatorInput) =>
    request<CreatorCalculatorDetail>(apiClient.post(creatorRoot, input)),
  update: (calculatorId: string, input: UpdateCalculatorInput) =>
    request<CreatorCalculatorDetail>(
      apiClient.patch(calculatorPath(calculatorId), input),
    ),
  remove: (calculatorId: string) =>
    request<void>(apiClient.delete(calculatorPath(calculatorId))),
  publish: (calculatorId: string) =>
    request<CreatorCalculatorDetail>(
      apiClient.post(`${calculatorPath(calculatorId)}/publish`),
    ),
  unpublish: (calculatorId: string) =>
    request<CreatorCalculatorDetail>(
      apiClient.post(`${calculatorPath(calculatorId)}/unpublish`),
    ),

  sessions: (calculatorId: string, signal?: AbortSignal) =>
    request<CalculatorSession[]>(
      apiClient.get(resourcePath(calculatorId, "sessions"), { signal }),
    ),
  session: (calculatorId: string, sessionId: string, signal?: AbortSignal) =>
    request<CalculatorSession>(
      apiClient.get(resourcePath(calculatorId, "sessions", sessionId), {
        signal,
      }),
    ),
  createSession: (calculatorId: string, input: CalculatorSessionInput) =>
    request<CalculatorSession>(
      apiClient.post(resourcePath(calculatorId, "sessions"), input),
    ),
  updateSession: (
    calculatorId: string,
    sessionId: string,
    input: Partial<CalculatorSessionInput>,
  ) =>
    request<CalculatorSession>(
      apiClient.patch(resourcePath(calculatorId, "sessions", sessionId), input),
    ),
  removeSession: (calculatorId: string, sessionId: string) =>
    request<void>(
      apiClient.delete(resourcePath(calculatorId, "sessions", sessionId)),
    ),

  terms: (calculatorId: string, signal?: AbortSignal) =>
    request<CalculatorTermOrLevel[]>(
      apiClient.get(resourcePath(calculatorId, "terms"), { signal }),
    ),
  term: (calculatorId: string, termId: string, signal?: AbortSignal) =>
    request<CalculatorTermOrLevel>(
      apiClient.get(resourcePath(calculatorId, "terms", termId), { signal }),
    ),
  createTerm: (calculatorId: string, input: CalculatorTermOrLevelInput) =>
    request<CalculatorTermOrLevel>(
      apiClient.post(resourcePath(calculatorId, "terms"), input),
    ),
  updateTerm: (
    calculatorId: string,
    termId: string,
    input: Partial<CalculatorTermOrLevelInput>,
  ) =>
    request<CalculatorTermOrLevel>(
      apiClient.patch(resourcePath(calculatorId, "terms", termId), input),
    ),
  removeTerm: (calculatorId: string, termId: string) =>
    request<void>(
      apiClient.delete(resourcePath(calculatorId, "terms", termId)),
    ),

  levels: (calculatorId: string, signal?: AbortSignal) =>
    request<CalculatorTermOrLevel[]>(
      apiClient.get(resourcePath(calculatorId, "levels"), { signal }),
    ),
  level: (calculatorId: string, levelId: string, signal?: AbortSignal) =>
    request<CalculatorTermOrLevel>(
      apiClient.get(resourcePath(calculatorId, "levels", levelId), { signal }),
    ),
  createLevel: (calculatorId: string, input: CalculatorTermOrLevelInput) =>
    request<CalculatorTermOrLevel>(
      apiClient.post(resourcePath(calculatorId, "levels"), input),
    ),
  updateLevel: (
    calculatorId: string,
    levelId: string,
    input: Partial<CalculatorTermOrLevelInput>,
  ) =>
    request<CalculatorTermOrLevel>(
      apiClient.patch(resourcePath(calculatorId, "levels", levelId), input),
    ),
  removeLevel: (calculatorId: string, levelId: string) =>
    request<void>(
      apiClient.delete(resourcePath(calculatorId, "levels", levelId)),
    ),

  courses: (
    calculatorId: string,
    filters: CalculatorCourseFilters = {},
    signal?: AbortSignal,
  ) =>
    request<CalculatorCourse[]>(
      apiClient.get(resourcePath(calculatorId, "courses"), {
        signal,
        params: {
          ...(filters.levelId ? { levelId: filters.levelId } : {}),
          ...(filters.termId ? { termId: filters.termId } : {}),
        },
      }),
    ),
  course: (calculatorId: string, courseId: string, signal?: AbortSignal) =>
    request<CalculatorCourse>(
      apiClient.get(resourcePath(calculatorId, "courses", courseId), {
        signal,
      }),
    ),
  createCourse: (calculatorId: string, input: CalculatorCourseInput) =>
    request<CalculatorCourse>(
      apiClient.post(resourcePath(calculatorId, "courses"), input),
    ),
  updateCourse: (
    calculatorId: string,
    courseId: string,
    input: Partial<CalculatorCourseInput>,
  ) =>
    request<CalculatorCourse>(
      apiClient.patch(resourcePath(calculatorId, "courses", courseId), input),
    ),
  removeCourse: (calculatorId: string, courseId: string) =>
    request<void>(
      apiClient.delete(resourcePath(calculatorId, "courses", courseId)),
    ),

  publicCatalogue: (input: {
    limit: number;
    cursor?: string;
    signal?: AbortSignal;
  }) =>
    request<PublicCatalogueResponse>(
      apiClient.get(publicRoot, {
        signal: input.signal,
        params: {
          limit: input.limit,
          ...(input.cursor ? { cursor: input.cursor } : {}),
        },
      }),
    ),
  publicDetail: (calculatorId: string, signal?: AbortSignal) =>
    request<PublicCalculatorDetail>(
      apiClient.get(publicCalculatorPath(calculatorId), { signal }),
    ),
  calculate: (calculatorId: string, input: PublicCalculationInput) =>
    request<PublicCalculationResponse>(
      apiClient.post(`${publicCalculatorPath(calculatorId)}/calculate`, input),
    ),
};
