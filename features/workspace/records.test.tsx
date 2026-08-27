import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { apiClient } from "@/lib/api/client";
import { recordsApi } from "./records-api";
import {
  useResolveCourseOffering,
  useResultMutations,
  useStudentMutations,
} from "./records-hooks";
import { workspaceKeys } from "./query-keys";
import type { CourseOffering, ResultRecord, Student } from "./types";

const apiMock = new MockAdapter(apiClient);
const offering: CourseOffering = {
  id: "cm-offering",
  workspaceId: "cm-one",
  courseId: "cm-course",
  sessionId: "cm-session",
  termId: null,
  levelId: null,
  assessmentSchemeId: "cm-scheme",
  gradingSchemeId: null,
  creditUnits: "3.000",
  createdAt: "",
  updatedAt: "",
  course: {
    id: "cm-course",
    name: "Algorithms",
    code: "CSC 201",
    type: "COURSE",
  },
  session: { id: "cm-session", name: "2026/2027" },
  term: null,
  level: null,
  assessmentScheme: {
    id: "cm-scheme",
    name: "CA/Exam",
    components: [
      { key: "ca", label: "CA", maxScore: 30, weight: 30 },
      { key: "exam", label: "Exam", maxScore: 70, weight: 70 },
    ],
  },
  gradingScheme: null,
};
const student: Student = {
  id: "cm-student",
  workspaceId: "cm-one",
  name: "Ada",
  matricNumber: null,
  metadata: null,
  createdAt: "",
  updatedAt: "",
};
const result: ResultRecord = {
  id: "cm-result",
  workspaceId: "cm-one",
  courseOfferingId: offering.id,
  studentId: student.id,
  scores: { ca: 24, exam: 61 },
  totalScore: "85.000",
  createdAt: "",
  updatedAt: "",
  student,
  courseOffering: {
    id: offering.id,
    courseId: offering.courseId,
    sessionId: offering.sessionId,
    termId: offering.termId,
    levelId: offering.levelId,
    assessmentSchemeId: offering.assessmentSchemeId,
    gradingSchemeId: offering.gradingSchemeId,
    creditUnits: offering.creditUnits,
    course: offering.course,
    session: offering.session,
    term: offering.term,
    level: offering.level,
    assessmentScheme: offering.assessmentScheme,
    gradingScheme: offering.gradingScheme,
  },
};

function renderClient(ui: ReactNode, setup?: (client: QueryClient) => void) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  setup?.(client);
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return client;
}

describe("workspace record API and cache behavior", () => {
  beforeEach(() => apiMock.reset());

  it("resolves lazily with and without optional academic context and permits server reuse", async () => {
    apiMock
      .onPost("/workspace/cm-one/course-offerings/resolve")
      .reply(200, offering);
    const fullInput = {
      courseId: "cm-course",
      sessionId: "cm-session",
      termId: "cm-term",
      levelId: null,
      assessmentSchemeId: "cm-scheme",
      gradingSchemeId: "cm-grading",
      creditUnits: 3,
    };
    const requiredInput = {
      courseId: "cm-course",
      sessionId: "cm-session",
      assessmentSchemeId: "cm-scheme",
    };
    expect(await recordsApi.resolveCourseOffering("cm-one", fullInput)).toEqual(
      offering,
    );
    expect(
      await recordsApi.resolveCourseOffering("cm-one", requiredInput),
    ).toEqual(offering);
    expect(
      apiMock.history.post.map((request) => JSON.parse(request.data)),
    ).toEqual([fullInput, requiredInput]);
  });

  it("preserves conflict and rate-limit status/messages", async () => {
    apiMock
      .onPost("/workspace/cm-one/course-offerings/resolve")
      .reply(409, { message: "This context already uses another scheme." });
    await expect(
      recordsApi.resolveCourseOffering("cm-one", {
        courseId: "c",
        sessionId: "s",
        assessmentSchemeId: "a",
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: "This context already uses another scheme.",
    });
    apiMock
      .onPost("/workspace/cm-one/students")
      .reply(429, { message: "Too many requests. Try again shortly." });
    await expect(
      recordsApi.createStudent("cm-one", { name: "Ada" }),
    ).rejects.toMatchObject({ status: 429 });
  });

  it("seeds offering detail and invalidates only its workspace list", async () => {
    apiMock
      .onPost("/workspace/cm-one/course-offerings/resolve")
      .reply(200, offering);
    function Probe() {
      const mutation = useResolveCourseOffering("cm-one");
      return (
        <button
          onClick={() =>
            mutation.mutate({
              courseId: "c",
              sessionId: "s",
              assessmentSchemeId: "a",
            })
          }
        >
          Resolve
        </button>
      );
    }
    const client = renderClient(<Probe />, (cache) => {
      cache.setQueryData(workspaceKeys.courseOfferings("cm-one"), []);
      cache.setQueryData(workspaceKeys.courseOfferings("cm-two"), []);
    });
    fireEvent.click(screen.getByRole("button", { name: "Resolve" }));
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
      client.getQueryState(workspaceKeys.courseOfferings("cm-two"))
        ?.isInvalidated,
    ).toBe(false);
  });

  it("does not mutate cached students on a duplicate-matric conflict", async () => {
    apiMock
      .onPost("/workspace/cm-one/students")
      .reply(409, { message: "Matric number already exists." });
    function Probe() {
      const mutation = useStudentMutations("cm-one").create;
      return (
        <button
          onClick={() =>
            mutation.mutate({ name: "Ada", matricNumber: "ENG/1" })
          }
        >
          Create student
        </button>
      );
    }
    const client = renderClient(<Probe />, (cache) =>
      cache.setQueryData(workspaceKeys.students("cm-one"), [student]),
    );
    fireEvent.click(screen.getByRole("button", { name: "Create student" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    await waitFor(() =>
      expect(client.getMutationCache().getAll()[0]?.state.status).toBe("error"),
    );
    expect(client.getQueryData(workspaceKeys.students("cm-one"))).toEqual([
      student,
    ]);
  });

  it("uses the authoritative update response and sends a status-free exact score payload", async () => {
    apiMock
      .onPatch("/workspace/cm-one/results/cm-result")
      .reply(200, { ...result, totalScore: "86.714" });
    function Probe() {
      const mutations = useResultMutations("cm-one");
      return (
        <button
          onClick={() =>
            mutations.update.mutate({
              id: result.id,
              input: { scores: result.scores },
            })
          }
        >
          Update
        </button>
      );
    }
    const client = renderClient(<Probe />, (cache) => {
      cache.setQueryData(workspaceKeys.results("cm-one"), [result]);
      cache.setQueryData(workspaceKeys.result("cm-one", result.id), {
        ...result,
        totalScore: "85",
      });
    });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() =>
      expect(
        client.getQueryData<ResultRecord>(
          workspaceKeys.result("cm-one", result.id),
        )?.totalScore,
      ).toBe("86.714"),
    );
    expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
      scores: result.scores,
    });
  });

  it("handles a 204 deletion and invalidates result and affected-student academic caches", async () => {
    apiMock.onDelete("/workspace/cm-one/results/cm-result").reply(204);
    function Probe() {
      const mutations = useResultMutations("cm-one");
      return (
        <button
          onClick={() =>
            mutations.remove.mutate({ id: result.id, studentId: student.id })
          }
        >
          Delete
        </button>
      );
    }
    const client = renderClient(<Probe />, (cache) => {
      cache.setQueryData(workspaceKeys.results("cm-one"), [result]);
      cache.setQueryData(workspaceKeys.result("cm-one", result.id), result);
      cache.setQueryData(
        workspaceKeys.academicRecord("cm-one", student.id),
        {},
      );
      cache.setQueryData(workspaceKeys.academicRevision("cm-one"), 0);
    });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(
        client.getQueryData(workspaceKeys.result("cm-one", result.id)),
      ).toBeUndefined(),
    );
    expect(apiMock.history.delete).toHaveLength(1);
    expect(
      client.getQueryState(workspaceKeys.results("cm-one"))?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(
        workspaceKeys.academicRecord("cm-one", student.id),
      )?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryData(workspaceKeys.academicRevision("cm-one")),
    ).toBe(1);
    expect(apiMock.history.post).toHaveLength(0);
  });
});
