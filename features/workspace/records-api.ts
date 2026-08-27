import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/errors";
import type {
  AssessmentScheme,
  AssessmentSchemeInput,
  CalculateGpaResponse,
  CourseOffering,
  CreateResultInput,
  GradingScheme,
  GradingSchemeInput,
  GpaScopeInput,
  ResolveCourseOfferingInput,
  ResultRecord,
  SaveBatchGpaInput,
  SaveBatchGpaResponse,
  SaveGpaInput,
  SaveGpaResponse,
  Student,
  StudentAcademicRecordResponse,
  StudentInput,
  UpdateCourseOfferingConfigurationInput,
  UpdateResultInput,
} from "./types";

async function request<T>(operation: Promise<{ data: T }>) {
  try {
    return (await operation).data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

const root = (workspaceId: string) =>
  `/workspace/${encodeURIComponent(workspaceId)}`;
const item = (workspaceId: string, collection: string, id: string) =>
  `${root(workspaceId)}/${collection}/${encodeURIComponent(id)}`;

export const recordsApi = {
  assessmentSchemes: (workspaceId: string, signal?: AbortSignal) =>
    request<AssessmentScheme[]>(
      apiClient.get(`${root(workspaceId)}/assessment-schemes`, { signal }),
    ),
  assessmentScheme: (workspaceId: string, id: string, signal?: AbortSignal) =>
    request<AssessmentScheme>(
      apiClient.get(item(workspaceId, "assessment-schemes", id), { signal }),
    ),
  createAssessmentScheme: (workspaceId: string, input: AssessmentSchemeInput) =>
    request<AssessmentScheme>(
      apiClient.post(`${root(workspaceId)}/assessment-schemes`, input),
    ),
  updateAssessmentScheme: (
    workspaceId: string,
    id: string,
    input: Partial<AssessmentSchemeInput>,
  ) =>
    request<AssessmentScheme>(
      apiClient.patch(item(workspaceId, "assessment-schemes", id), input),
    ),
  removeAssessmentScheme: (workspaceId: string, id: string) =>
    request<void>(
      apiClient.delete(item(workspaceId, "assessment-schemes", id)),
    ),

  gradingSchemes: (workspaceId: string, signal?: AbortSignal) =>
    request<GradingScheme[]>(
      apiClient.get(`${root(workspaceId)}/grading-schemes`, { signal }),
    ),
  gradingScheme: (workspaceId: string, id: string, signal?: AbortSignal) =>
    request<GradingScheme>(
      apiClient.get(item(workspaceId, "grading-schemes", id), { signal }),
    ),
  createGradingScheme: (workspaceId: string, input: GradingSchemeInput) =>
    request<GradingScheme>(
      apiClient.post(`${root(workspaceId)}/grading-schemes`, input),
    ),
  updateGradingScheme: (
    workspaceId: string,
    id: string,
    input: Partial<GradingSchemeInput>,
  ) =>
    request<GradingScheme>(
      apiClient.patch(item(workspaceId, "grading-schemes", id), input),
    ),
  removeGradingScheme: (workspaceId: string, id: string) =>
    request<void>(apiClient.delete(item(workspaceId, "grading-schemes", id))),

  students: (workspaceId: string, signal?: AbortSignal) =>
    request<Student[]>(
      apiClient.get(`${root(workspaceId)}/students`, { signal }),
    ),
  student: (workspaceId: string, id: string, signal?: AbortSignal) =>
    request<Student>(
      apiClient.get(item(workspaceId, "students", id), { signal }),
    ),
  createStudent: (workspaceId: string, input: StudentInput) =>
    request<Student>(apiClient.post(`${root(workspaceId)}/students`, input)),
  updateStudent: (workspaceId: string, id: string, input: StudentInput) =>
    request<Student>(apiClient.patch(item(workspaceId, "students", id), input)),
  removeStudent: (workspaceId: string, id: string) =>
    request<void>(apiClient.delete(item(workspaceId, "students", id))),

  courseOfferings: (workspaceId: string, signal?: AbortSignal) =>
    request<CourseOffering[]>(
      apiClient.get(`${root(workspaceId)}/course-offerings`, { signal }),
    ),
  courseOffering: (workspaceId: string, id: string, signal?: AbortSignal) =>
    request<CourseOffering>(
      apiClient.get(item(workspaceId, "course-offerings", id), { signal }),
    ),
  resolveCourseOffering: (
    workspaceId: string,
    input: ResolveCourseOfferingInput,
  ) =>
    request<CourseOffering>(
      apiClient.post(`${root(workspaceId)}/course-offerings/resolve`, input),
    ),
  updateCourseOfferingConfiguration: (
    workspaceId: string,
    id: string,
    input: UpdateCourseOfferingConfigurationInput,
  ) =>
    request<CourseOffering>(
      apiClient.patch(
        `${item(workspaceId, "course-offerings", id)}/configuration`,
        input,
      ),
    ),

  calculateGpa: (workspaceId: string, input: GpaScopeInput) =>
    request<CalculateGpaResponse>(
      apiClient.post(`${root(workspaceId)}/gpa/calculate`, input),
    ),
  saveGpa: (workspaceId: string, input: SaveGpaInput) =>
    request<SaveGpaResponse>(
      apiClient.post(`${root(workspaceId)}/gpa/save`, input),
    ),
  saveBatchGpa: (workspaceId: string, input: SaveBatchGpaInput) =>
    request<SaveBatchGpaResponse>(
      apiClient.post(`${root(workspaceId)}/gpa/save-batch`, input),
    ),

  results: (workspaceId: string, signal?: AbortSignal) =>
    request<ResultRecord[]>(
      apiClient.get(`${root(workspaceId)}/results`, { signal }),
    ),
  result: (workspaceId: string, id: string, signal?: AbortSignal) =>
    request<ResultRecord>(
      apiClient.get(item(workspaceId, "results", id), { signal }),
    ),
  createResult: (workspaceId: string, input: CreateResultInput) =>
    request<ResultRecord>(
      apiClient.post(`${root(workspaceId)}/results`, input),
    ),
  updateResult: (workspaceId: string, id: string, input: UpdateResultInput) =>
    request<ResultRecord>(
      apiClient.patch(item(workspaceId, "results", id), input),
    ),
  removeResult: (workspaceId: string, id: string) =>
    request<void>(apiClient.delete(item(workspaceId, "results", id))),

  studentAcademicRecord: (
    workspaceId: string,
    studentId: string,
    signal?: AbortSignal,
  ) =>
    request<StudentAcademicRecordResponse>(
      apiClient.get(
        `${item(workspaceId, "students", studentId)}/academic-record`,
        { signal },
      ),
    ),
};
