import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api/client";
import { AppShellProvider } from "@/features/app-shell/AppShellContext";
import { workspaceKeys } from "./query-keys";
import WorkspaceGpaPage, { buildGpaScopeInput } from "./WorkspaceGpaPage";
import type {
  BatchGpaResponse,
  GpaPreflightResponse,
  SaveGpaReadyResponse,
  SingleStudentGpaResponse,
  WorkspaceDetails,
} from "./types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace/cm-one/gpa",
}));

const apiMock = new MockAdapter(apiClient);
const workspace: WorkspaceDetails = {
  id: "cm-one",
  name: "Engineering",
  description: null,
  createdAt: "",
  updatedAt: "",
  sessions: [],
  terms: [],
  levels: [],
  courses: [],
};
const sessions = [
  {
    id: "cm-session",
    workspaceId: "cm-one",
    name: "2026/2027",
    startsAt: null,
    endsAt: null,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "cm-session-two",
    workspaceId: "cm-one",
    name: "2027/2028",
    startsAt: null,
    endsAt: null,
    createdAt: "",
    updatedAt: "",
  },
];
const term = {
  id: "cm-term",
  workspaceId: "cm-one",
  name: "First Semester",
  code: "SEM1",
  order: 1,
  metadata: null,
  createdAt: "",
  updatedAt: "",
};
const level = {
  id: "cm-level",
  workspaceId: "cm-one",
  name: "400 Level",
  code: "L400",
  order: 4,
  metadata: null,
  createdAt: "",
  updatedAt: "",
};
const student = {
  id: "cm-student",
  workspaceId: "cm-one",
  name: "Ada Lovelace",
  matricNumber: "ENG/001",
  metadata: null,
  createdAt: "",
  updatedAt: "",
};
const grading = {
  id: "cm-grading",
  workspaceId: "cm-one",
  name: "Common 5-point scale",
  maxGradePoint: "5.00",
  bands: [],
  createdAt: "",
  updatedAt: "",
};
const assessment = {
  id: "cm-assessment",
  workspaceId: "cm-one",
  name: "CA and Exam",
  components: [],
  createdAt: "",
  updatedAt: "",
};
const scope = {
  sessionId: "cm-session",
  termId: "cm-term",
  levelId: "cm-level",
};
const singleReady: SingleStudentGpaResponse = {
  ready: true,
  student: {
    id: student.id,
    name: student.name,
    matricNumber: student.matricNumber,
  },
  scope,
  courses: [
    {
      courseOfferingId: "cm-offering",
      courseCode: "CSC401",
      courseName: "Operating Systems",
      totalScore: "82.750",
      grade: "A",
      gradePoint: "5.000",
      creditUnits: "3.000",
      qualityPoints: "15.000",
    },
  ],
  totalCreditUnits: "3.000",
  totalQualityPoints: "15.000",
  gpa: "5.000",
  cumulativeCreditUnits: "30.000",
  cumulativeQualityPoints: "138.000",
  cgpa: "4.600",
};
const missingCourses = [
  {
    courseOfferingId: "cm-old-offering",
    courseId: "cm-old-course",
    courseCode: "CSC301",
    courseName: "Earlier Systems",
  },
  {
    courseOfferingId: "cm-missing-offering",
    courseId: "cm-missing-course",
    courseCode: "CSC302",
    courseName: "Compiler Construction",
  },
];
const incompleteStudents = [
  {
    studentId: "cm-incomplete",
    studentName: "Grace Hopper",
    matricNumber: "ENG/002",
    missingResults: missingCourses,
  },
];
const singleIncompleteStudents = [
  {
    studentId: student.id,
    studentName: student.name,
    matricNumber: student.matricNumber,
    missingResults: missingCourses,
  },
];
const batchReady: BatchGpaResponse = {
  ready: true,
  scope,
  students: [
    {
      studentId: student.id,
      name: student.name,
      matricNumber: student.matricNumber,
      totalCreditUnits: "3.000",
      totalQualityPoints: "15.000",
      gpa: "5.000",
      cumulativeCreditUnits: "30.000",
      cumulativeQualityPoints: "138.000",
      cgpa: "4.600",
    },
  ],
  incompleteStudents,
};

function renderClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <AppShellProvider>{ui}</AppShellProvider>
    </QueryClientProvider>,
  );
  return client;
}

function baseMocks() {
  apiMock.onGet("/workspace/cm-one").reply(200, workspace);
  apiMock.onGet("/workspace/cm-one/sessions").reply(200, sessions);
  apiMock.onGet("/workspace/cm-one/levels").reply(200, [level]);
  apiMock.onGet("/workspace/cm-one/students").reply(200, [student]);
  apiMock
    .onGet("/workspace/cm-one/assessment-schemes")
    .reply(200, [assessment]);
  apiMock.onGet("/workspace/cm-one/grading-schemes").reply(200, [grading]);
  apiMock.onGet("/workspace/cm-one/terms").reply(200, [term]);
}

async function selectSingleScope() {
  await screen.findByRole("option", { name: "2026/2027" });
  fireEvent.change(screen.getByLabelText("Session"), {
    target: { value: "cm-session" },
  });
  await screen.findByRole("option", { name: "First Semester" });
  fireEvent.change(screen.getByLabelText(/Term/), {
    target: { value: "cm-term" },
  });
  fireEvent.change(screen.getByLabelText(/Level/), {
    target: { value: "cm-level" },
  });
  fireEvent.change(screen.getByLabelText("Student"), {
    target: { value: "cm-student" },
  });
}

describe("GPA workspace flow", () => {
  beforeEach(() => {
    apiMock.reset();
    baseMocks();
    window.history.replaceState(null, "", "/workspace/cm-one/gpa");
    vi.restoreAllMocks();
  });

  it("constructs exact single and batch scopes without calculated values", () => {
    expect(
      buildGpaScopeInput(
        { sessionId: "s", termId: "t", levelId: "l", studentId: "u" },
        "single",
      ),
    ).toEqual({ sessionId: "s", termId: "t", levelId: "l", studentId: "u" });
    expect(
      buildGpaScopeInput(
        { sessionId: "s", termId: "", levelId: "", studentId: "u" },
        "batch",
      ),
    ).toEqual({ sessionId: "s" });
  });

  it("calculates only on explicit submission and keeps reusable Term when Session changes", async () => {
    apiMock.onPost("/workspace/cm-one/gpa/calculate").reply(200, singleReady);
    renderClient(<WorkspaceGpaPage workspaceId="cm-one" />);
    expect(apiMock.history.post).toHaveLength(0);
    await selectSingleScope();
    expect(new URLSearchParams(window.location.search).get("term")).toBe(
      "cm-term",
    );
    fireEvent.change(screen.getByLabelText("Session"), {
      target: { value: "cm-session-two" },
    });
    expect(screen.getByLabelText(/Term/)).toHaveValue("cm-term");
    expect(new URLSearchParams(window.location.search).get("term")).toBe(
      "cm-term",
    );
    fireEvent.change(screen.getByLabelText("Session"), {
      target: { value: "cm-session" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview GPA" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      sessionId: "cm-session",
      termId: "cm-term",
      levelId: "cm-level",
      studentId: "cm-student",
    });
    window.dispatchEvent(new Event("focus"));
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(apiMock.history.post).toHaveLength(1);
  });

  it("narrows ready false, repairs only missing offering fields, and recalculates the unchanged scope", async () => {
    const preflight: GpaPreflightResponse = {
      ready: false,
      scope,
      missingConfiguration: [
        {
          courseOfferingId: "cm-old-offering",
          courseId: "cm-old-course",
          courseCode: "CSC301",
          courseName: "Earlier Systems",
          missing: ["assessmentSchemeId", "creditUnits", "gradingSchemeId"],
        },
      ],
      incompleteStudents: singleIncompleteStudents,
    };
    apiMock.onPost("/workspace/cm-one/gpa/calculate").replyOnce(200, preflight);
    apiMock.onPost("/workspace/cm-one/gpa/calculate").reply(200, singleReady);
    apiMock
      .onPatch(
        "/workspace/cm-one/course-offerings/cm-old-offering/configuration",
      )
      .reply(200, { id: "cm-old-offering" });
    renderClient(<WorkspaceGpaPage workspaceId="cm-one" />);
    await selectSingleScope();
    fireEvent.click(screen.getByRole("button", { name: "Preview GPA" }));
    const heading = await screen.findByRole("heading", {
      name: /GPA not ready/,
    });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(screen.getAllByText(/Earlier Systems/)[0]).toBeVisible();
    expect(screen.getByRole("heading", { name: "Ada Lovelace" })).toBeVisible();
    expect(screen.getByText("ENG/001 · 2 missing results")).toBeVisible();
    expect(screen.getAllByText(/Compiler Construction/)[0]).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: /Enter result for Ada Lovelace in Compiler Construction/,
      }),
    ).toHaveAttribute(
      "href",
      "/workspace/cm-one/results?session=cm-session&course=cm-missing-course&offering=cm-missing-offering&student=cm-student&term=cm-term&level=cm-level",
    );
    expect(screen.queryByText("5.000")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Assessment scheme"), {
      target: { value: "cm-assessment" },
    });
    fireEvent.change(screen.getByLabelText("Credit units"), {
      target: { value: "3.125" },
    });
    fireEvent.change(screen.getByLabelText("Grading scheme"), {
      target: { value: "cm-grading" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update course" }));
    await waitFor(() => expect(apiMock.history.patch).toHaveLength(1));
    expect(JSON.parse(apiMock.history.patch[0].data)).toEqual({
      assessmentSchemeId: "cm-assessment",
      creditUnits: 3.125,
      gradingSchemeId: "cm-grading",
    });
    expect(screen.getByText("Updated")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Recalculate" }));
    expect(
      await screen.findByRole("heading", { name: "Ada Lovelace" }),
    ).toBeVisible();
    expect(
      apiMock.history.post.map((request) => JSON.parse(request.data)),
    ).toEqual([
      {
        sessionId: "cm-session",
        termId: "cm-term",
        levelId: "cm-level",
        studentId: "cm-student",
      },
      {
        sessionId: "cm-session",
        termId: "cm-term",
        levelId: "cm-level",
        studentId: "cm-student",
      },
    ]);
  });

  it("renders authoritative course audit values and saves only scope before presenting repeated save as update", async () => {
    const summary = {
      id: "cm-summary",
      workspaceId: "cm-one",
      studentId: student.id,
      sessionId: scope.sessionId,
      termId: scope.termId,
      levelId: scope.levelId,
      gpa: "5.000",
      cgpa: "4.600",
      totalCreditUnits: "3.000",
      totalQualityPoints: "15.000",
      cumulativeCreditUnits: "30.000",
      cumulativeQualityPoints: "138.000",
      calculatedAt: "2026-08-27T10:00:00.000Z",
    };
    const saveResponse = {
      ready: true,
      summary,
      calculation: singleReady,
    } satisfies SaveGpaReadyResponse;
    apiMock.onPost("/workspace/cm-one/gpa/calculate").reply(200, singleReady);
    apiMock.onPost("/workspace/cm-one/gpa/save").reply(200, saveResponse);
    renderClient(<WorkspaceGpaPage workspaceId="cm-one" />);
    await selectSingleScope();
    fireEvent.click(screen.getByRole("button", { name: "Preview GPA" }));
    expect((await screen.findAllByText("15.000")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("A")[0]).toBeVisible();
    expect(screen.getAllByText("82.750")[0]).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Save summary" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save summary" }),
    );
    await waitFor(() => expect(apiMock.history.post).toHaveLength(2));
    const payload = JSON.parse(apiMock.history.post[1].data);
    expect(payload).toEqual({
      studentId: "cm-student",
      sessionId: "cm-session",
      termId: "cm-term",
      levelId: "cm-level",
    });
    expect(payload).not.toHaveProperty("gpa");
    expect(payload).not.toHaveProperty("cgpa");
    expect(payload).not.toHaveProperty("courses");
    expect(
      await screen.findByRole("button", { name: "Update saved summary" }),
    ).toBeVisible();
    expect(screen.getByText(/Saved summary calculated/)).toBeVisible();
  });

  it("marks a calculated preview stale after relevant academic data changes", async () => {
    apiMock.onPost("/workspace/cm-one/gpa/calculate").reply(200, singleReady);
    const client = renderClient(<WorkspaceGpaPage workspaceId="cm-one" />);
    await selectSingleScope();
    fireEvent.click(screen.getByRole("button", { name: "Preview GPA" }));
    expect(
      await screen.findByRole("button", { name: "Save summary" }),
    ).toBeEnabled();

    act(() => {
      client.setQueryData(workspaceKeys.academicRevision("cm-one"), 1);
    });

    expect(await screen.findByText(/Academic data has changed/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Save summary" })).toBeDisabled();
  });

  it("handles a newly returned save preflight and a null-GPA no-results preview", async () => {
    const noGpa = {
      ...singleReady,
      courses: [],
      totalCreditUnits: "0.000",
      totalQualityPoints: "0.000",
      gpa: null,
    };
    apiMock.onPost("/workspace/cm-one/gpa/calculate").replyOnce(200, noGpa);
    renderClient(<WorkspaceGpaPage workspaceId="cm-one" />);
    await selectSingleScope();
    fireEvent.click(screen.getByRole("button", { name: "Preview GPA" }));
    expect(await screen.findByText(/no current GPA to save/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Save summary" })).toBeDisabled();
  });

  it("replaces a ready preview when save returns a fresh preflight", async () => {
    const changed: GpaPreflightResponse = {
      ready: false,
      scope,
      missingConfiguration: [
        {
          courseOfferingId: "cm-offering",
          courseId: "cm-course",
          courseCode: "CSC401",
          courseName: "Operating Systems",
          missing: ["gradingSchemeId"],
        },
      ],
      incompleteStudents: [],
    };
    apiMock.onPost("/workspace/cm-one/gpa/calculate").reply(200, singleReady);
    apiMock.onPost("/workspace/cm-one/gpa/save").reply(200, changed);
    renderClient(<WorkspaceGpaPage workspaceId="cm-one" />);
    await selectSingleScope();
    fireEvent.click(screen.getByRole("button", { name: "Preview GPA" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Save summary" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save summary" }),
    );
    expect(
      await screen.findByRole("heading", { name: /GPA not ready/ }),
    ).toBeVisible();
    expect(screen.getByText(/Missing: grading scheme/)).toBeVisible();
    expect(screen.queryByText("82.750")).not.toBeInTheDocument();
  });

  it("prevents duplicate calculation submissions and focuses a safe request error", async () => {
    let complete: ((value: [number, unknown]) => void) | undefined;
    apiMock.onPost("/workspace/cm-one/gpa/calculate").reply(
      () =>
        new Promise<[number, unknown]>((resolve) => {
          complete = resolve;
        }),
    );
    renderClient(<WorkspaceGpaPage workspaceId="cm-one" />);
    await selectSingleScope();
    fireEvent.click(screen.getByRole("button", { name: "Preview GPA" }));
    const pending = await screen.findByRole("button", {
      name: "Calculating…",
    });
    expect(pending).toBeDisabled();
    expect(screen.getByLabelText("Session")).toBeDisabled();
    expect(screen.getByLabelText(/Term/)).toBeDisabled();
    expect(screen.getByLabelText("Level (optional)")).toBeDisabled();
    expect(screen.getByLabelText("Student")).toBeDisabled();
    expect(screen.getByLabelText("All applicable")).toBeDisabled();
    fireEvent.click(pending);
    expect(apiMock.history.post).toHaveLength(1);
    complete?.([429, { message: "GPA requests are temporarily limited." }]);
    const heading = await screen.findByRole("heading", {
      name: "Calculation unavailable",
    });
    expect(
      screen.getByText("GPA requests are temporarily limited."),
    ).toBeVisible();
    await waitFor(() => expect(document.activeElement).toBe(heading));
  });

  it("renders batch rows, confirms the named count, and saves a scope-only batch", async () => {
    apiMock.onPost("/workspace/cm-one/gpa/calculate").reply(200, batchReady);
    apiMock.onPost("/workspace/cm-one/gpa/save-batch").reply(200, {
      ready: true,
      scope,
      savedSummaries: [
        {
          id: "cm-summary",
          workspaceId: "cm-one",
          studentId: student.id,
          sessionId: scope.sessionId,
          termId: scope.termId,
          levelId: scope.levelId,
          gpa: "5.000",
          cgpa: "4.600",
          totalCreditUnits: "3.000",
          totalQualityPoints: "15.000",
          cumulativeCreditUnits: "30.000",
          cumulativeQualityPoints: "138.000",
          calculatedAt: "2026-08-27T10:00:00.000Z",
        },
      ],
      incompleteStudents,
    });
    renderClient(<WorkspaceGpaPage workspaceId="cm-one" />);
    await screen.findByRole("option", { name: "2026/2027" });
    fireEvent.change(screen.getByLabelText("Session"), {
      target: { value: "cm-session" },
    });
    await screen.findByRole("option", { name: "First Semester" });
    fireEvent.change(screen.getByLabelText(/Term/), {
      target: { value: "cm-term" },
    });
    fireEvent.change(screen.getByLabelText(/Level/), {
      target: { value: "cm-level" },
    });
    fireEvent.click(screen.getByLabelText("All applicable"));
    fireEvent.click(screen.getByRole("button", { name: "Preview GPA" }));
    expect(
      await screen.findByRole("heading", { name: "GPA preview" }),
    ).toBeVisible();
    expect(screen.getAllByText("Ada Lovelace")[0]).toBeVisible();
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      sessionId: "cm-session",
      termId: "cm-term",
      levelId: "cm-level",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save batch summaries" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Save GPA summaries for 1 student?");
    expect(dialog).toHaveTextContent("1 student has incomplete results");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save 1 summary" }),
    );
    await waitFor(() => expect(apiMock.history.post).toHaveLength(2));
    expect(JSON.parse(apiMock.history.post[1].data)).toEqual({
      sessionId: "cm-session",
      termId: "cm-term",
      levelId: "cm-level",
    });
    expect(await screen.findByText("1 summary saved.")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Skipped students" }),
    ).toBeVisible();
    expect(screen.getAllByText("Grace Hopper")[0]).toBeVisible();
  });

  it("renders an empty batch state and reuses dashboard surface and border tokens", async () => {
    apiMock
      .onPost("/workspace/cm-one/gpa/calculate")
      .reply(200, { ...batchReady, students: [] });
    renderClient(<WorkspaceGpaPage workspaceId="cm-one" />);
    await screen.findByRole("option", { name: "2026/2027" });
    fireEvent.change(screen.getByLabelText("Session"), {
      target: { value: "cm-session" },
    });
    fireEvent.click(screen.getByLabelText("All applicable"));
    const scopePanel = screen
      .getByRole("heading", { name: "Results to include" })
      .closest("form");
    expect(scopePanel).toHaveClass(
      "app-panel",
      "border",
      "border-[var(--app-border)]",
    );
    expect(scopePanel?.className).not.toMatch(/rounded-(?:xl|2xl|3xl)/);
    fireEvent.click(screen.getByRole("button", { name: "Preview GPA" }));
    expect(
      await screen.findByText(/No students have complete results/),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Save batch summaries" }),
    ).toBeDisabled();
  });
});
