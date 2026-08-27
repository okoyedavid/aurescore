import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { apiClient } from "@/lib/api/client";
import { recordsApi } from "./records-api";
import {
  useSaveBatchGpa,
  useSaveGpa,
  useUpdateCourseOfferingConfiguration,
} from "./records-hooks";
import { workspaceKeys } from "./query-keys";
import type {
  CourseOffering,
  SaveBatchGpaReadyResponse,
  SaveGpaReadyResponse,
} from "./types";

const apiMock = new MockAdapter(apiClient);
const offering: CourseOffering = {
  id: "cm-offering",
  workspaceId: "cm-one",
  courseId: "cm-course",
  sessionId: "cm-session",
  termId: "cm-term",
  levelId: null,
  assessmentSchemeId: null,
  gradingSchemeId: "cm-grading",
  creditUnits: "3.000",
  createdAt: "",
  updatedAt: "",
  course: {
    id: "cm-course",
    name: "Algorithms",
    code: "CSC201",
    type: "COURSE",
  },
  session: { id: "cm-session", name: "2026/2027" },
  term: { id: "cm-term", name: "First Semester", code: "SEM1", order: 1 },
  level: null,
  assessmentScheme: null,
  gradingScheme: {
    id: "cm-grading",
    name: "Common 5-point scale",
    maxGradePoint: "5.00",
    bands: [],
  },
};

function clientRender(ui: ReactNode, setup?: (client: QueryClient) => void) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  setup?.(client);
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return client;
}

describe("GPA API and cache behavior", () => {
  beforeEach(() => apiMock.reset());

  it("uses exact singular workspace endpoints and scope-only payloads", async () => {
    apiMock.onPost("/workspace/cm-one/gpa/calculate").reply(200, {
      ready: true,
      scope: { sessionId: "cm-session", termId: null, levelId: null },
      students: [],
      incompleteStudents: [],
    });
    apiMock.onPost("/workspace/cm-one/gpa/save").reply(200, {
      ready: false,
      scope: { sessionId: "cm-session", termId: null, levelId: null },
      missingConfiguration: [],
      incompleteStudents: [],
    });
    apiMock.onPost("/workspace/cm-one/gpa/save-batch").reply(200, {
      ready: true,
      scope: { sessionId: "cm-session", termId: null, levelId: null },
      savedSummaries: [],
      incompleteStudents: [],
    });
    apiMock
      .onPatch("/workspace/cm-one/course-offerings/cm-offering/configuration")
      .reply(200, offering);
    apiMock
      .onGet("/workspace/cm-one/students/cm-student/academic-record")
      .reply(200, {
        student: {},
        groups: [],
        savedSummaries: [],
        hasSavedSummaries: false,
      });

    await recordsApi.calculateGpa("cm-one", {
      sessionId: "cm-session",
      studentId: "cm-student",
    });
    await recordsApi.saveGpa("cm-one", {
      studentId: "cm-student",
      sessionId: "cm-session",
    });
    await recordsApi.saveBatchGpa("cm-one", { sessionId: "cm-session" });
    await recordsApi.updateCourseOfferingConfiguration(
      "cm-one",
      "cm-offering",
      { gradingSchemeId: "cm-grading", creditUnits: 3 },
    );
    await recordsApi.studentAcademicRecord("cm-one", "cm-student");

    expect(
      apiMock.history.post.map((request) => JSON.parse(request.data)),
    ).toEqual([
      { sessionId: "cm-session", studentId: "cm-student" },
      { studentId: "cm-student", sessionId: "cm-session" },
      { sessionId: "cm-session" },
    ]);
    expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
      gradingSchemeId: "cm-grading",
      creditUnits: 3,
    });
  });

  it("updates offering detail and invalidates only its workspace academic caches", async () => {
    apiMock
      .onPatch("/workspace/cm-one/course-offerings/cm-offering/configuration")
      .reply(200, offering);
    function Probe() {
      const mutation = useUpdateCourseOfferingConfiguration("cm-one");
      return (
        <button
          onClick={() =>
            mutation.mutate({
              id: offering.id,
              input: { gradingSchemeId: "cm-grading", creditUnits: 3 },
            })
          }
        >
          Configure
        </button>
      );
    }
    const client = clientRender(<Probe />, (cache) => {
      cache.setQueryData(workspaceKeys.courseOfferings("cm-one"), []);
      cache.setQueryData(workspaceKeys.courseOfferings("cm-two"), []);
      cache.setQueryData(workspaceKeys.results("cm-one"), []);
      cache.setQueryData(
        workspaceKeys.academicRecord("cm-one", "cm-student"),
        {},
      );
      cache.setQueryData(
        workspaceKeys.academicRecord("cm-two", "cm-student"),
        {},
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Configure" }));
    await waitFor(() =>
      expect(
        client.getQueryData(
          workspaceKeys.courseOffering("cm-one", offering.id),
        ),
      ).toEqual(offering),
    );
    expect(
      client.getQueryState(workspaceKeys.courseOfferings("cm-one"))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(workspaceKeys.results("cm-one"))?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(workspaceKeys.academicRecord("cm-one", "cm-student"))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(workspaceKeys.courseOfferings("cm-two"))
        ?.isInvalidated,
    ).toBe(false);
    expect(
      client.getQueryState(workspaceKeys.academicRecord("cm-two", "cm-student"))
        ?.isInvalidated,
    ).toBe(false);
    expect(client.getQueryData(workspaceKeys.academicRevision("cm-one"))).toBe(
      1,
    );
  });

  it("invalidates returned students after single and batch saves", async () => {
    const summary = {
      id: "cm-summary",
      workspaceId: "cm-one",
      studentId: "cm-student",
      sessionId: "cm-session",
      termId: null,
      levelId: null,
      gpa: "4.50",
      cgpa: "4.20",
      totalCreditUnits: "3.000",
      totalQualityPoints: "13.500",
      cumulativeCreditUnits: "30.000",
      cumulativeQualityPoints: "126.000",
      calculatedAt: "2026-08-27T10:00:00.000Z",
    };
    const singleResponse = {
      ready: true,
      summary,
      calculation: {
        ready: true,
        student: { id: "cm-student", name: "Ada", matricNumber: null },
        scope: { sessionId: "cm-session", termId: null, levelId: null },
        courses: [],
        totalCreditUnits: "3.000",
        totalQualityPoints: "13.500",
        gpa: "4.50",
        cumulativeCreditUnits: "30.000",
        cumulativeQualityPoints: "126.000",
        cgpa: "4.20",
      },
    } satisfies SaveGpaReadyResponse;
    const batchResponse = {
      ready: true,
      scope: { sessionId: "cm-session", termId: null, levelId: null },
      savedSummaries: [
        summary,
        { ...summary, id: "cm-summary-two", studentId: "cm-two" },
      ],
      incompleteStudents: [],
    } satisfies SaveBatchGpaReadyResponse;
    apiMock.onPost("/workspace/cm-one/gpa/save").reply(200, singleResponse);
    apiMock
      .onPost("/workspace/cm-one/gpa/save-batch")
      .reply(200, batchResponse);
    function Probe() {
      const single = useSaveGpa("cm-one");
      const batch = useSaveBatchGpa("cm-one");
      return (
        <>
          <button
            onClick={() =>
              single.mutate({
                studentId: "cm-student",
                sessionId: "cm-session",
              })
            }
          >
            Single
          </button>
          <button onClick={() => batch.mutate({ sessionId: "cm-session" })}>
            Batch
          </button>
        </>
      );
    }
    const client = clientRender(<Probe />, (cache) => {
      cache.setQueryData(
        workspaceKeys.academicRecord("cm-one", "cm-student"),
        {},
      );
      cache.setQueryData(workspaceKeys.academicRecord("cm-one", "cm-two"), {});
      cache.setQueryData(
        workspaceKeys.academicRecord("cm-two", "cm-student"),
        {},
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Single" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    await waitFor(() =>
      expect(
        client.getQueryState(
          workspaceKeys.academicRecord("cm-one", "cm-student"),
        )?.isInvalidated,
      ).toBe(true),
    );
    client.setQueryData(
      workspaceKeys.academicRecord("cm-one", "cm-student"),
      {},
    );
    fireEvent.click(screen.getByRole("button", { name: "Batch" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(2));
    await waitFor(() =>
      expect(
        client.getQueryState(workspaceKeys.academicRecord("cm-one", "cm-two"))
          ?.isInvalidated,
      ).toBe(true),
    );
    expect(
      client.getQueryState(workspaceKeys.academicRecord("cm-two", "cm-student"))
        ?.isInvalidated,
    ).toBe(false);
  });

  it.each([400, 404, 409, 429])(
    "preserves safe %s messages without retrying",
    async (status) => {
      apiMock.onPost("/workspace/cm-one/gpa/calculate").reply(status, {
        message: `Safe ${status} GPA message.`,
      });
      await expect(
        recordsApi.calculateGpa("cm-one", { sessionId: "cm-session" }),
      ).rejects.toMatchObject({
        status,
        message: `Safe ${status} GPA message.`,
      });
      expect(apiMock.history.post).toHaveLength(1);
    },
  );
});
