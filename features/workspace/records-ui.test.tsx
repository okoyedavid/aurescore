import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
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
import WorkspaceAssessmentSchemesPage from "./WorkspaceAssessmentSchemesPage";
import { Results } from "./WorkspaceResultsPage";
import type {
  AssessmentScheme,
  CourseOffering,
  GradingScheme,
  ResultRecord,
  Student,
  Term,
  WorkspaceDetails,
} from "./types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace/cm-one/results",
}));
vi.mock("@/features/app-shell/components/AppShell", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
const apiMock = new MockAdapter(apiClient);
const scheme: AssessmentScheme = {
  id: "cm-scheme",
  workspaceId: "cm-one",
  name: "CA/Exam",
  components: [
    { key: "ca", label: "Continuous Assessment", maxScore: 30, weight: 30 },
    { key: "exam", label: "Examination", maxScore: 70, weight: 70 },
  ],
  createdAt: "",
  updatedAt: "",
};
const term: Term = {
  id: "cm-term",
  workspaceId: "cm-one",
  name: "First Semester",
  code: "SEM1",
  order: 1,
  metadata: null,
  createdAt: "",
  updatedAt: "",
};
const grading: GradingScheme = {
  id: "cm-grading",
  workspaceId: "cm-one",
  name: "Common 5-point scale",
  maxGradePoint: "5.00",
  bands: [
    { label: "A", minScore: 70, gradePoint: 5 },
    { label: "F", minScore: 0, gradePoint: 0 },
  ],
  createdAt: "",
  updatedAt: "",
};
const student: Student = {
  id: "cm-student",
  workspaceId: "cm-one",
  name: "Ada Lovelace",
  matricNumber: "CSC/001",
  metadata: null,
  createdAt: "",
  updatedAt: "",
};
const workspace: WorkspaceDetails = {
  id: "cm-one",
  name: "Engineering",
  description: null,
  sessions: [],
  terms: [],
  levels: [],
  courses: [],
  createdAt: "",
  updatedAt: "",
};
const offering: CourseOffering = {
  id: "cm-offering",
  workspaceId: "cm-one",
  courseId: "cm-course",
  sessionId: "cm-session",
  termId: term.id,
  levelId: null,
  assessmentSchemeId: scheme.id,
  gradingSchemeId: grading.id,
  creditUnits: "3",
  createdAt: "",
  updatedAt: "",
  course: {
    id: "cm-course",
    name: "Algorithms",
    code: "CSC 201",
    type: "COURSE",
  },
  session: { id: "cm-session", name: "2026/2027" },
  term,
  level: null,
  assessmentScheme: scheme,
  gradingScheme: grading,
};

function renderClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("workspace records UI", () => {
  beforeEach(() => {
    apiMock.reset();
    window.history.replaceState(null, "", "/");
    apiMock.onGet("/workspace/cm-one").reply(200, workspace);
    apiMock.onGet("/workspace/cm-one/grading-schemes").reply(200, [grading]);
  });

  it("offers cloning after immutable scheme components return 409", async () => {
    apiMock.onGet("/workspace/cm-one/assessment-schemes").reply(200, [scheme]);
    apiMock
      .onPatch("/workspace/cm-one/assessment-schemes/cm-scheme")
      .reply(409, { message: "Components cannot change after results exist." });
    apiMock
      .onPost("/workspace/cm-one/assessment-schemes")
      .reply(201, { ...scheme, id: "cm-clone", name: "CA/Exam copy" });
    renderClient(<WorkspaceAssessmentSchemesPage workspaceId="cm-one" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit CA/Exam" }),
    );
    fireEvent.change(
      screen.getAllByLabelText("Label", { selector: "input" })[0],
      { target: { value: "Coursework" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save scheme" }));
    expect(
      await screen.findByText(/historical meaning is protected/i),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Create a new scheme/ }),
    );
    expect(screen.getByDisplayValue("CA/Exam copy")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save scheme" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    expect(JSON.parse(apiMock.history.post[0].data).components[0].label).toBe(
      "Coursework",
    );
  });

  it("creates Final Score Only through the ordinary scheme endpoint", async () => {
    apiMock.onGet("/workspace/cm-one/assessment-schemes").reply(200, []);
    apiMock.onPost("/workspace/cm-one/assessment-schemes").reply(201, {
      ...scheme,
      name: "Final Score Only",
      components: [
        { key: "total", label: "Final Score", maxScore: 100, weight: 100 },
      ],
    });
    renderClient(<WorkspaceAssessmentSchemesPage workspaceId="cm-one" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Final Score Only" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save scheme" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      name: "Final Score Only",
      components: [
        { key: "total", label: "Final Score", maxScore: 100, weight: 100 },
      ],
    });
  });

  it("restores result selector IDs supplied by the route query", async () => {
    apiMock.onGet("/workspace/cm-one/sessions").reply(200, [
      {
        id: "cm-session",
        workspaceId: "cm-one",
        name: "2026/2027",
        startsAt: null,
        endsAt: null,
        createdAt: "",
        updatedAt: "",
      },
    ]);
    apiMock.onGet("/workspace/cm-one/levels").reply(200, []);
    apiMock.onGet("/workspace/cm-one/terms").reply(200, [term]);
    apiMock.onGet("/workspace/cm-one/courses").reply(200, [offering.course]);
    apiMock.onGet("/workspace/cm-one/assessment-schemes").reply(200, [scheme]);
    apiMock.onGet("/workspace/cm-one/students").reply(200, []);
    apiMock.onGet("/workspace/cm-one/course-offerings").reply(200, []);
    apiMock.onGet("/workspace/cm-one/results").reply(200, []);

    renderClient(
      <Results
        workspaceId="cm-one"
        initialSelection={{
          sessionId: "cm-session",
          termId: "cm-term",
          levelId: "",
          courseId: "cm-course",
          assessmentSchemeId: "cm-scheme",
          gradingSchemeId: "cm-grading",
          creditUnits: "3",
        }}
      />,
    );

    await screen.findByRole("option", { name: "2026/2027" });
    expect(screen.getByLabelText("1. Session")).toHaveValue("cm-session");
    expect(screen.getByLabelText(/2\. Term/)).toHaveValue("cm-term");
    expect(screen.getByLabelText("4. Course")).toHaveValue("cm-course");
    expect(screen.getByLabelText("5. Assessment scheme")).toHaveValue(
      "cm-scheme",
    );
    expect(screen.getByLabelText(/6\. Grading scheme/)).toHaveValue(
      "cm-grading",
    );
    expect(screen.getByLabelText(/Credit units/i)).toHaveValue(3);
    expect(
      screen.getByRole("button", { name: "Open result entry" }),
    ).toBeEnabled();
  });

  it("prefills Course defaults while omitting those dimensions from resolution", async () => {
    const level = {
      id: "cm-level",
      workspaceId: "cm-one",
      name: "200 Level",
      code: "200",
      order: 2,
      metadata: null,
      createdAt: "",
      updatedAt: "",
    };
    const alternateLevel = {
      ...level,
      id: "cm-level-two",
      name: "300 Level",
      code: "300",
      order: 3,
    };
    const alternateTerm = {
      ...term,
      id: "cm-term-two",
      name: "Second Semester",
      code: "SEM2",
      order: 2,
    };
    const defaultCourse = {
      ...offering.course,
      workspaceId: "cm-one",
      defaultLevelId: level.id,
      defaultTermId: term.id,
      defaultLevel: {
        id: level.id,
        name: level.name,
        code: level.code,
        order: level.order,
      },
      defaultTerm: {
        id: term.id,
        name: term.name,
        code: term.code,
        order: term.order,
      },
      metadata: null,
      createdAt: "",
      updatedAt: "",
    };
    apiMock
      .onGet("/workspace/cm-one/sessions")
      .reply(200, [
        {
          id: "cm-session",
          workspaceId: "cm-one",
          name: "2026/2027",
          startsAt: null,
          endsAt: null,
          createdAt: "",
          updatedAt: "",
        },
      ]);
    apiMock.onGet("/workspace/cm-one/terms").reply(200, [term, alternateTerm]);
    apiMock
      .onGet("/workspace/cm-one/levels")
      .reply(200, [level, alternateLevel]);
    apiMock.onGet("/workspace/cm-one/courses").reply(200, [defaultCourse]);
    apiMock.onGet("/workspace/cm-one/assessment-schemes").reply(200, [scheme]);
    apiMock.onGet("/workspace/cm-one/students").reply(200, []);
    apiMock.onGet("/workspace/cm-one/course-offerings").reply(200, []);
    apiMock.onGet("/workspace/cm-one/results").reply(200, []);
    apiMock
      .onPost("/workspace/cm-one/course-offerings/resolve")
      .reply(200, { ...offering, levelId: level.id, level });
    renderClient(<Results workspaceId="cm-one" />);
    await screen.findByRole("option", { name: "2026/2027" });
    fireEvent.change(screen.getByLabelText("1. Session"), {
      target: { value: "cm-session" },
    });
    fireEvent.change(screen.getByLabelText("4. Course"), {
      target: { value: "cm-course" },
    });
    expect(screen.getByLabelText(/2\. Term/)).toHaveValue(term.id);
    expect(screen.getByLabelText(/3\. Level/)).toHaveValue(level.id);
    fireEvent.change(screen.getByLabelText("5. Assessment scheme"), {
      target: { value: scheme.id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Open result entry" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      courseId: "cm-course",
      sessionId: "cm-session",
      assessmentSchemeId: "cm-scheme",
      gradingSchemeId: null,
      creditUnits: null,
    });
    fireEvent.change(screen.getByLabelText(/2\. Term/), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText(/3\. Level/), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Open result entry" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(2));
    expect(JSON.parse(apiMock.history.post[1].data)).toMatchObject({
      termId: null,
      levelId: null,
    });
    fireEvent.change(screen.getByLabelText(/2\. Term/), {
      target: { value: alternateTerm.id },
    });
    fireEvent.change(screen.getByLabelText(/3\. Level/), {
      target: { value: alternateLevel.id },
    });
    fireEvent.click(screen.getByRole("button", { name: "Open result entry" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(3));
    expect(JSON.parse(apiMock.history.post[2].data)).toMatchObject({
      termId: alternateTerm.id,
      levelId: alternateLevel.id,
    });
  });

  it("uses GPA remediation offering and student IDs to open the existing result editor", async () => {
    apiMock.onGet("/workspace/cm-one/sessions").reply(200, [
      {
        id: "cm-session",
        workspaceId: "cm-one",
        name: "2026/2027",
        startsAt: null,
        endsAt: null,
        createdAt: "",
        updatedAt: "",
      },
    ]);
    apiMock.onGet("/workspace/cm-one/levels").reply(200, []);
    apiMock.onGet("/workspace/cm-one/terms").reply(200, [term]);
    apiMock.onGet("/workspace/cm-one/courses").reply(200, [offering.course]);
    apiMock.onGet("/workspace/cm-one/assessment-schemes").reply(200, [scheme]);
    apiMock.onGet("/workspace/cm-one/students").reply(200, [student]);
    apiMock.onGet("/workspace/cm-one/course-offerings").reply(200, [offering]);
    apiMock.onGet("/workspace/cm-one/results").reply(200, []);
    apiMock
      .onPost("/workspace/cm-one/course-offerings/resolve")
      .reply(200, offering);

    renderClient(
      <Results
        workspaceId="cm-one"
        initialSelection={{
          sessionId: "cm-session",
          termId: "cm-term",
          levelId: "",
          courseId: "cm-course",
          assessmentSchemeId: "",
          gradingSchemeId: "",
          creditUnits: "",
        }}
        initialOfferingId="cm-offering"
        initialStudentId="cm-student"
      />,
    );

    const open = await screen.findByRole("button", {
      name: "Open result entry",
    });
    await waitFor(() => expect(open).toBeEnabled());
    fireEvent.click(open);
    expect(
      await screen.findByRole("dialog", {
        name: "Enter result — Ada Lovelace",
      }),
    ).toBeVisible();
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      courseId: "cm-course",
      sessionId: "cm-session",
      termId: "cm-term",
      levelId: null,
      assessmentSchemeId: "cm-scheme",
      gradingSchemeId: "cm-grading",
      creditUnits: 3,
    });
  });

  it("keeps a reusable selected term when session changes", async () => {
    const secondSession = {
      id: "cm-session-two",
      workspaceId: "cm-one",
      name: "2027/2028",
      startsAt: null,
      endsAt: null,
      createdAt: "",
      updatedAt: "",
    };
    apiMock
      .onGet("/workspace/cm-one/sessions")
      .reply(200, [
        { ...secondSession, id: "cm-session", name: "2026/2027" },
        secondSession,
      ]);
    apiMock.onGet("/workspace/cm-one/levels").reply(200, []);
    apiMock.onGet("/workspace/cm-one/courses").reply(200, []);
    apiMock.onGet("/workspace/cm-one/assessment-schemes").reply(200, []);
    apiMock.onGet("/workspace/cm-one/students").reply(200, []);
    apiMock.onGet("/workspace/cm-one/course-offerings").reply(200, []);
    apiMock.onGet("/workspace/cm-one/results").reply(200, []);
    apiMock.onGet("/workspace/cm-one/terms").reply(200, [term]);
    renderClient(<Results workspaceId="cm-one" />);
    await screen.findByRole("option", { name: "2026/2027" });
    fireEvent.change(screen.getByLabelText("1. Session"), {
      target: { value: "cm-session" },
    });
    await screen.findByRole("option", { name: "First Semester" });
    fireEvent.change(screen.getByLabelText(/2\. Term/), {
      target: { value: "cm-term" },
    });
    expect(new URLSearchParams(window.location.search).get("term")).toBe(
      "cm-term",
    );
    fireEvent.change(screen.getByLabelText("1. Session"), {
      target: { value: "cm-session-two" },
    });
    expect(screen.getByLabelText(/2\. Term/)).toHaveValue("cm-term");
    expect(new URLSearchParams(window.location.search).get("term")).toBe(
      "cm-term",
    );
  });

  it("generates keyboard-ordered score fields and displays the authoritative total", async () => {
    let saved: ResultRecord[] = [];
    apiMock.onGet("/workspace/cm-one/sessions").reply(200, [
      {
        id: "cm-session",
        workspaceId: "cm-one",
        name: "2026/2027",
        startsAt: null,
        endsAt: null,
        createdAt: "",
        updatedAt: "",
      },
    ]);
    apiMock.onGet("/workspace/cm-one/levels").reply(200, []);
    apiMock.onGet("/workspace/cm-one/terms").reply(200, [term]);
    apiMock.onGet("/workspace/cm-one/courses").reply(200, [offering.course]);
    apiMock.onGet("/workspace/cm-one/assessment-schemes").reply(200, [scheme]);
    apiMock.onGet("/workspace/cm-one/students").reply(200, [student]);
    apiMock.onGet("/workspace/cm-one/course-offerings").reply(200, []);
    apiMock.onGet("/workspace/cm-one/results").reply(() => [200, saved]);
    apiMock
      .onPost("/workspace/cm-one/course-offerings/resolve")
      .reply(200, offering);
    apiMock.onPost("/workspace/cm-one/results").reply((config) => {
      const body = JSON.parse(config.data);
      saved = [
        {
          id: "cm-result",
          workspaceId: "cm-one",
          ...body,
          totalScore: "85.714",
          createdAt: "",
          updatedAt: "",
          student,
          courseOffering: offering,
        },
      ];
      return [201, saved[0]];
    });
    renderClient(<Results workspaceId="cm-one" />);
    await screen.findByRole("option", { name: "2026/2027" });
    fireEvent.change(screen.getByLabelText("1. Session"), {
      target: { value: "cm-session" },
    });
    await waitFor(() =>
      expect(screen.getByLabelText("1. Session")).toHaveValue("cm-session"),
    );
    await screen.findByRole("option", { name: "First Semester" });
    fireEvent.change(screen.getByLabelText(/2\. Term/), {
      target: { value: "cm-term" },
    });
    fireEvent.change(screen.getByLabelText("4. Course"), {
      target: { value: "cm-course" },
    });
    await waitFor(() =>
      expect(screen.getByLabelText("4. Course")).toHaveValue("cm-course"),
    );
    fireEvent.change(screen.getByLabelText("5. Assessment scheme"), {
      target: { value: "cm-scheme" },
    });
    fireEvent.change(screen.getByLabelText(/6\. Grading scheme/), {
      target: { value: "cm-grading" },
    });
    fireEvent.change(screen.getByLabelText(/Credit units/i), {
      target: { value: "3" },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Open result entry" }),
      ).toBeEnabled(),
    );
    expect(
      Object.fromEntries(new URLSearchParams(window.location.search)),
    ).toEqual({
      session: "cm-session",
      term: "cm-term",
      course: "cm-course",
      scheme: "cm-scheme",
      grading: "cm-grading",
      units: "3",
    });
    fireEvent.click(screen.getByRole("button", { name: "Open result entry" }));
    await waitFor(() =>
      expect(
        apiMock.history.post.find((request) =>
          request.url?.endsWith("/course-offerings/resolve"),
        ),
      ).toBeDefined(),
    );
    expect(
      JSON.parse(
        apiMock.history.post.find((request) =>
          request.url?.endsWith("/course-offerings/resolve"),
        )!.data,
      ),
    ).toEqual({
      courseId: "cm-course",
      sessionId: "cm-session",
      termId: "cm-term",
      levelId: null,
      assessmentSchemeId: "cm-scheme",
      gradingSchemeId: "cm-grading",
      creditUnits: 3,
    });
    const summary = screen
      .getByText(
        (_, element) =>
          element?.tagName === "STRONG" &&
          element.textContent?.includes("Algorithms") === true,
      )
      .closest("div");
    expect(summary).toHaveTextContent("First Semester");
    expect(summary).toHaveTextContent("Common 5-point scale");
    expect(summary).toHaveTextContent("3 units");
    expect(summary).not.toHaveTextContent("No level");
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Enter result for Ada Lovelace",
      }),
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByLabelText("Status")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Status" }),
    ).not.toBeInTheDocument();
    const ca = within(dialog).getByLabelText(/Continuous Assessment/);
    const exam = within(dialog).getByLabelText(/Examination/);
    expect(
      ca.compareDocumentPosition(exam) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.change(ca, { target: { value: "24" } });
    fireEvent.change(exam, { target: { value: "61" } });
    expect(
      within(dialog).queryByText(/Estimated total/),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /total is calculated automatically/,
      ),
    ).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save result" }),
    );
    await waitFor(() =>
      expect(
        apiMock.history.post.filter((request) =>
          request.url?.endsWith("/results"),
        ),
      ).toHaveLength(1),
    );
    const payload = JSON.parse(
      apiMock.history.post.find((request) => request.url?.endsWith("/results"))!
        .data,
    );
    expect(payload).toEqual({
      courseOfferingId: "cm-offering",
      studentId: "cm-student",
      scores: { ca: 24, exam: 61 },
    });
    expect(payload).not.toHaveProperty("totalScore");
    expect(payload).not.toHaveProperty("status");
    expect(await screen.findByText("85.714")).toBeInTheDocument();
    expect(
      screen.getByText(
        /CSC 201.*2026\/2027.*First Semester.*CA\/Exam.*Common 5-point scale.*3 units/,
      ),
    ).toBeVisible();
  });
});
