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
  ResultRecord,
  Student,
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
  levelId: null,
  assessmentSchemeId: scheme.id,
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
  level: null,
  assessmentScheme: scheme,
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
    apiMock.onGet("/workspace/cm-one").reply(200, workspace);
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
    apiMock
      .onPost("/workspace/cm-one/assessment-schemes")
      .reply(201, {
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

  it("generates keyboard-ordered score fields and displays the authoritative total", async () => {
    let saved: ResultRecord[] = [];
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
    apiMock.onGet("/workspace/cm-one/levels").reply(200, []);
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
    fireEvent.change(screen.getByLabelText("3. Course"), {
      target: { value: "cm-course" },
    });
    await waitFor(() =>
      expect(screen.getByLabelText("3. Course")).toHaveValue("cm-course"),
    );
    fireEvent.change(screen.getByLabelText("4. Scheme"), {
      target: { value: "cm-scheme" },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Open result entry" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Open result entry" }));
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Enter result for Ada Lovelace",
      }),
    );
    const dialog = screen.getByRole("dialog");
    const ca = within(dialog).getByLabelText(/Continuous Assessment/);
    const exam = within(dialog).getByLabelText(/Examination/);
    expect(
      ca.compareDocumentPosition(exam) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.change(ca, { target: { value: "24" } });
    fireEvent.change(exam, { target: { value: "61" } });
    expect(
      within(dialog).getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent?.includes("Estimated total: 85.000") === true,
      ),
    ).toBeInTheDocument();
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
      status: "DRAFT",
    });
    expect(payload).not.toHaveProperty("totalScore");
    expect(await screen.findByText("85.714")).toBeInTheDocument();
  });
});
