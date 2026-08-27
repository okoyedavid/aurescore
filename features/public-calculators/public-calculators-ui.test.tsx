import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
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
import CreatePublicCalculatorPage from "./CreatePublicCalculatorPage";
import PublicCalculatorCataloguePage from "./PublicCalculatorCataloguePage";
import PublicCalculatorPage from "./PublicCalculatorPage";
import type {
  CreatorCalculatorDetail,
  PublicCalculationResponse,
  PublicCalculatorDetail,
} from "./types";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/features/app-shell/components/AppShell", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const apiMock = new MockAdapter(apiClient);

const publicDetail: PublicCalculatorDetail = {
  id: "calc_cuid",
  title: "Computer Science GPA",
  description: "A public departmental calculator.",
  institutionName: "Example University",
  departmentName: "Computer Science",
  sessions: [
    { id: "session_1", name: "2025/2026", order: 1, metadata: null },
    { id: "session_2", name: "2026/2027", order: 2, metadata: null },
  ],
  terms: [
    {
      id: "term_1",
      name: "First Semester",
      code: "SEM1",
      order: 1,
      metadata: null,
    },
    {
      id: "term_2",
      name: "Second Semester",
      code: "SEM2",
      order: 2,
      metadata: null,
    },
  ],
  levels: [
    { id: "level_1", name: "100 Level", code: null, order: 1, metadata: null },
  ],
  courses: [
    {
      id: "course_1",
      name: "Algorithms",
      code: "CSC201",
      levelId: "level_1",
      termId: "term_1",
      creditUnits: "3.00",
      order: 1,
      metadata: null,
    },
    {
      id: "course_2",
      name: "General Studies",
      code: null,
      levelId: null,
      termId: null,
      creditUnits: "2.00",
      order: 2,
      metadata: null,
    },
    {
      id: "course_3",
      name: "Databases",
      code: "CSC202",
      levelId: "level_1",
      termId: "term_2",
      creditUnits: "4.00",
      order: 3,
      metadata: null,
    },
  ],
  gradingScheme: {
    id: "scheme_1",
    maxGradePoint: "5.00",
    bands: [
      { label: "A", minScore: 70, gradePoint: 5 },
      { label: "F", minScore: 0, gradePoint: 0 },
    ],
  },
  publicPath: "/public-calculator/calc_cuid",
};

const creatorDetail: CreatorCalculatorDetail = {
  ...publicDetail,
  isPublished: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  sessions: [],
  terms: [],
  levels: [],
  courses: [],
  gradingScheme: null,
};

const calculation: PublicCalculationResponse = {
  calculator: {
    id: "calc_cuid",
    title: "Computer Science GPA",
    institutionName: "Example University",
    departmentName: "Computer Science",
    maxGradePoint: "5.00",
  },
  publicPath: "/public-calculator/calc_cuid",
  entries: [
    {
      course: {
        id: "course_1",
        name: "Algorithms",
        code: "CSC201",
        metadata: null,
      },
      session: { id: "session_2", name: "2026/2027" },
      term: { id: "term_1", name: "First Semester" },
      level: { id: "level_1", name: "100 Level" },
      score: "0.00",
      grade: "BACKEND-GRADE",
      gradePoint: "0.00",
      creditUnits: "3.00",
      qualityPoints: "0.00",
    },
  ],
  totalCreditUnits: "3.00",
  totalQualityPoints: "0.00",
  gpa: "1.234",
  cgpa: "4.321",
  groups: [
    {
      session: { id: "session_1", name: "2025/2026" },
      term: null,
      level: null,
      totalCreditUnits: "1.00",
      totalQualityPoints: "4.00",
      gpa: "4.00",
    },
    {
      session: { id: "session_2", name: "2026/2027" },
      term: null,
      level: null,
      totalCreditUnits: "2.00",
      totalQualityPoints: "6.00",
      gpa: "3.00",
    },
  ],
  sessions: [
    {
      session: { id: "session_1", name: "2025/2026" },
      totalCreditUnits: "1.00",
      totalQualityPoints: "4.00",
      gpa: "4.00",
    },
    {
      session: { id: "session_2", name: "2026/2027" },
      totalCreditUnits: "2.00",
      totalQualityPoints: "6.00",
      gpa: "3.00",
    },
  ],
};

function renderClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return client;
}

describe("public calculator UI", () => {
  beforeEach(() => {
    apiMock.reset();
    navigation.replace.mockReset();
    navigation.back.mockReset();
    localStorage.clear();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    Object.defineProperty(window, "print", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("creates identity first and transitions to Course setup", async () => {
    apiMock.onPost("/public-calculators").reply(201, creatorDetail);
    renderClient(<CreatePublicCalculatorPage />);
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Computer Science GPA" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create and add Courses" }),
    );
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      title: "Computer Science GPA",
      description: null,
      institutionName: null,
      departmentName: null,
    });
    expect(navigation.replace).toHaveBeenCalledWith(
      "/dashboard/public-calculators/calc_cuid?tab=courses",
    );
  });

  it("loads the anonymous catalogue with cursor pagination and no private owner fields", async () => {
    apiMock.onGet("/public/public-calculators").reply((request) => {
      if (request.params?.cursor === "calc_2") {
        return [
          200,
          {
            items: [
              {
                id: "calc_3",
                title: "Third",
                description: null,
                institutionName: null,
                departmentName: null,
                createdAt: "",
              },
            ],
            nextCursor: null,
          },
        ];
      }
      return [
        200,
        {
          items: [
            {
              id: "calc_2",
              title: "Second",
              description: null,
              institutionName: null,
              departmentName: null,
              createdAt: "",
            },
          ],
          nextCursor: "calc_2",
        },
      ];
    });
    renderClient(<PublicCalculatorCataloguePage />);
    expect(await screen.findByText("Second")).toBeVisible();
    expect(screen.queryByText(/owner|email/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByText("Third")).toBeVisible();
    expect(apiMock.history.get[1].params.cursor).toBe("calc_2");
  });

  it("renders clear catalogue and calculator Course empty states", async () => {
    apiMock
      .onGet("/public/public-calculators")
      .reply(200, { items: [], nextCursor: null });
    const first = renderClient(<PublicCalculatorCataloguePage />);
    expect(
      await screen.findByRole("heading", {
        name: "No published calculators yet",
      }),
    ).toBeVisible();
    first.clear();
    cleanup();

    apiMock
      .onGet("/public/public-calculators/calc_cuid")
      .reply(200, { ...publicDetail, courses: [] });
    renderClient(<PublicCalculatorPage calculatorId="calc_cuid" />);
    expect(
      await screen.findByText("No Courses match this context and search."),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Calculate GPA" }),
    ).toBeDisabled();
  });

  it("renders a public 404 without navigating to authentication", async () => {
    apiMock
      .onGet("/public/public-calculators/missing")
      .reply(404, { message: "Not found" });
    renderClient(<PublicCalculatorPage calculatorId="missing" />);
    expect(
      await screen.findByRole("heading", {
        name: "This calculator is unavailable",
      }),
    ).toBeVisible();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it("does not let Session filter Courses and includes unassigned Courses for Term and Level", async () => {
    apiMock
      .onGet("/public/public-calculators/calc_cuid")
      .reply(200, publicDetail);
    renderClient(<PublicCalculatorPage calculatorId="calc_cuid" />);
    expect(await screen.findByText(/CSC201/)).toBeVisible();
    fireEvent.change(screen.getByLabelText("Term"), {
      target: { value: "term_1" },
    });
    fireEvent.change(screen.getByLabelText("Level"), {
      target: { value: "level_1" },
    });
    expect(screen.getByText(/CSC201/)).toBeVisible();
    expect(screen.getByText("General Studies")).toBeVisible();
    expect(screen.queryByText(/CSC202/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Session"), {
      target: { value: "session_2" },
    });
    expect(screen.getByText(/CSC201/)).toBeVisible();
    expect(screen.getByText("General Studies")).toBeVisible();
  });

  it("sends score zero without units and renders authoritative backend GPA, CGPA, grade, and points", async () => {
    apiMock
      .onGet("/public/public-calculators/calc_cuid")
      .reply(200, publicDetail);
    apiMock
      .onPost("/public/public-calculators/calc_cuid/calculate")
      .reply(200, calculation);
    renderClient(<PublicCalculatorPage calculatorId="calc_cuid" />);
    const label = await screen.findByText(/CSC201/);
    fireEvent.click(within(label.closest("label")!).getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText("Score for Algorithms"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Calculate GPA" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    const payload = JSON.parse(apiMock.history.post[0].data);
    expect(payload).toEqual({ entries: [{ courseId: "course_1", score: 0 }] });
    expect(JSON.stringify(payload)).not.toMatch(
      /creditUnits|gradePoint|qualityPoints|gpa|cgpa/i,
    );
    expect(await screen.findByText("BACKEND-GRADE")).toBeVisible();
    expect(screen.getByText("4.321")).toBeVisible();
    expect(screen.getAllByText("0.00").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Print / download" }),
    ).toBeVisible();
    expect(screen.getByText("Calculated with AureScore")).toBeVisible();
    expect(screen.getByText("/public-calculator/calc_cuid")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Print / download" }));
    expect(window.print).toHaveBeenCalledOnce();
  });

  it("sends exactly one grade field and can edit or reset local inputs", async () => {
    apiMock
      .onGet("/public/public-calculators/calc_cuid")
      .reply(200, publicDetail);
    apiMock
      .onPost("/public/public-calculators/calc_cuid/calculate")
      .reply(200, {
        ...calculation,
        groups: [calculation.groups[0]],
        sessions: [calculation.sessions[0]],
      });
    renderClient(<PublicCalculatorPage calculatorId="calc_cuid" />);
    fireEvent.click(await screen.findByRole("button", { name: /grade/i }));
    const label = screen.getByText(/CSC201/);
    fireEvent.click(within(label.closest("label")!).getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText("Grade for Algorithms"), {
      target: { value: "F" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Calculate GPA" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      entries: [{ courseId: "course_1", grade: "F" }],
    });
    expect(
      await screen.findByRole("button", { name: /Edit inputs/ }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Edit inputs/ }));
    expect(await screen.findByLabelText("Grade for Algorithms")).toHaveValue(
      "F",
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset draft" }));
    expect(screen.getByText("0 Courses selected")).toBeVisible();
  });
});
