import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api/client";
import { AppShellProvider } from "@/features/app-shell/AppShellContext";
import StudentAcademicRecordPage from "./StudentAcademicRecordPage";
import type { StudentAcademicRecordResponse, WorkspaceDetails } from "./types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace/cm-one/students/cm-student/academic-record",
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
const record: StudentAcademicRecordResponse = {
  student: {
    id: "cm-student",
    workspaceId: "cm-one",
    name: "Ada Lovelace",
    matricNumber: "ENG/001",
    metadata: null,
    createdAt: "",
    updatedAt: "",
  },
  groups: [
    {
      session: {
        id: "cm-session",
        name: "2026/2027",
        startsAt: null,
        createdAt: "",
      },
      term: {
        id: "cm-term",
        name: "First Semester",
        code: "SEM1",
        order: 1,
        createdAt: "",
      },
      level: { id: "cm-level", name: "400 Level", code: "L400", order: 4 },
      results: [
        {
          id: "cm-result-one",
          courseOfferingId: "cm-offering",
          course: {
            id: "cm-course",
            code: "CSC401",
            name: "Operating Systems",
          },
          scores: { ca: 24, exam: 60 },
          totalScore: "84.000",
          grade: "A",
          gradePoint: "5.000",
          creditUnits: "3.000",
          createdAt: "",
        },
        {
          id: "cm-result-two",
          courseOfferingId: "cm-second-offering",
          course: { id: "cm-second-course", code: "CSC402", name: "Networks" },
          scores: { project: 30 },
          totalScore: "30.000",
          grade: null,
          gradePoint: null,
          creditUnits: "2.000",
          createdAt: "",
        },
      ],
    },
  ],
  savedSummaries: [
    {
      id: "cm-summary",
      workspaceId: "cm-one",
      studentId: "cm-student",
      sessionId: "cm-session",
      termId: "cm-term",
      levelId: "cm-level",
      gpa: "5.000",
      cgpa: "4.600",
      totalCreditUnits: "3.000",
      totalQualityPoints: "15.000",
      cumulativeCreditUnits: "30.000",
      cumulativeQualityPoints: "138.000",
      calculatedAt: "2026-08-27T10:00:00.000Z",
      session: { id: "cm-session", name: "2026/2027" },
      term: { id: "cm-term", name: "First Semester", code: "SEM1", order: 1 },
      level: { id: "cm-level", name: "400 Level", code: "L400" },
    },
  ],
  hasSavedSummaries: true,
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <AppShellProvider>
        <StudentAcademicRecordPage
          workspaceId="cm-one"
          studentId="cm-student"
        />
      </AppShellProvider>
    </QueryClientProvider>,
  );
}

describe("student academic record", () => {
  beforeEach(() => {
    apiMock.reset();
    apiMock.onGet("/workspace/cm-one").reply(200, workspace);
  });

  it("groups complete results and displays returned summaries without calculating", async () => {
    apiMock
      .onGet("/workspace/cm-one/students/cm-student/academic-record")
      .reply(200, record);
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "Ada Lovelace" }),
    ).toBeVisible();
    expect(
      screen.getByRole("region", { name: /2026\/2027.*First Semester.*L400/ }),
    ).toBeVisible();
    expect(
      screen.queryByRole("columnheader", { name: "Status" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not resolved").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5.000").length).toBeGreaterThan(0);
    expect(screen.getByText(/Calculated/)).toBeVisible();
    expect(screen.getByRole("link", { name: /Calculate GPA/ })).toHaveAttribute(
      "href",
      "/workspace/cm-one/gpa?student=cm-student",
    );
    expect(apiMock.history.post).toHaveLength(0);
  });

  it("confirms a named Result deletion, handles 204, and refreshes the record", async () => {
    const afterDelete = {
      ...record,
      groups: [{ ...record.groups[0], results: [record.groups[0].results[1]] }],
    };
    apiMock
      .onGet("/workspace/cm-one/students/cm-student/academic-record")
      .replyOnce(200, record)
      .onGet("/workspace/cm-one/students/cm-student/academic-record")
      .reply(200, afterDelete);
    apiMock.onDelete("/workspace/cm-one/results/cm-result-one").reply(204);
    renderPage();
    const buttons = await screen.findAllByRole("button", {
      name: "Delete result for Operating Systems",
    });
    fireEvent.click(buttons[0]);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Ada Lovelace");
    expect(dialog).toHaveTextContent("Operating Systems");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete result" }),
    );
    await waitFor(() => expect(apiMock.history.delete).toHaveLength(1));
    await waitFor(() =>
      expect(
        screen.queryByText(/CSC401.*Operating Systems/),
      ).not.toBeInTheDocument(),
    );
    expect(apiMock.history.post).toHaveLength(0);
  });

  it("keeps a Result visible when deletion fails with a safe message", async () => {
    apiMock
      .onGet("/workspace/cm-one/students/cm-student/academic-record")
      .reply(200, record);
    apiMock.onDelete("/workspace/cm-one/results/cm-result-one").reply(409, {
      message: "This result cannot be deleted right now.",
    });
    renderPage();
    fireEvent.click(
      (
        await screen.findAllByRole("button", {
          name: "Delete result for Operating Systems",
        })
      )[0],
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete result",
      }),
    );
    expect(
      await screen.findByText("This result cannot be deleted right now."),
    ).toBeVisible();
    expect(screen.getAllByText(/Operating Systems/).length).toBeGreaterThan(0);
    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("shows the authoritative no-saved-summary state and never invokes calculate or save", async () => {
    apiMock
      .onGet("/workspace/cm-one/students/cm-student/academic-record")
      .reply(200, { ...record, savedSummaries: [], hasSavedSummaries: false });
    renderPage();
    expect(await screen.findByText(/No saved summaries/)).toBeVisible();
    expect(apiMock.history.post).toHaveLength(0);
  });

  it("uses ownership-safe 404 messaging", async () => {
    apiMock
      .onGet("/workspace/cm-one/students/cm-student/academic-record")
      .reply(404, { message: "Student not found." });
    renderPage();
    expect(
      await screen.findByText(/does not exist or is not accessible/),
    ).toBeVisible();
    expect(screen.queryByText("Student not found.")).not.toBeInTheDocument();
  });
});
