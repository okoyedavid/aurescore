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
vi.mock("./components/PdfReportButton", () => ({
  default: () => <button>Download PDF report</button>,
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
      attemptType: "REGULAR",
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
    fireEvent.change(await screen.findByLabelText("Session *"), {
      target: { value: "session_1" },
    });
    fireEvent.change(screen.getByLabelText("Level *"), {
      target: { value: "level_1" },
    });
    fireEvent.change(screen.getByLabelText("Term *"), {
      target: { value: "term_1" },
    });
    expect(
      await screen.findByText(
        "No configured Courses are available for this Level and Term.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Calculate this Term" }),
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

  it("uses Session as context and excludes incomplete legacy Courses", async () => {
    apiMock
      .onGet("/public/public-calculators/calc_cuid")
      .reply(200, publicDetail);
    renderClient(<PublicCalculatorPage calculatorId="calc_cuid" />);
    fireEvent.change(await screen.findByLabelText("Term *"), {
      target: { value: "term_1" },
    });
    fireEvent.change(screen.getByLabelText("Level *"), {
      target: { value: "level_1" },
    });
    expect(screen.getByText(/CSC201/)).toBeVisible();
    expect(screen.queryByText("General Studies")).not.toBeInTheDocument();
    expect(screen.queryByText(/CSC202/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Session *"), {
      target: { value: "session_2" },
    });
    expect(screen.getByText(/CSC201/)).toBeVisible();
    expect(screen.getByText(/1 Course is unavailable/)).toBeVisible();
  });

  it("sends score zero without units and renders authoritative backend GPA, CGPA, grade, and points", async () => {
    apiMock
      .onGet("/public/public-calculators/calc_cuid")
      .reply(200, publicDetail);
    apiMock
      .onPost("/public/public-calculators/calc_cuid/calculate")
      .reply(200, calculation);
    renderClient(<PublicCalculatorPage calculatorId="calc_cuid" />);
    fireEvent.change(await screen.findByLabelText("Session *"), {
      target: { value: "session_2" },
    });
    fireEvent.change(screen.getByLabelText("Level *"), {
      target: { value: "level_1" },
    });
    fireEvent.change(screen.getByLabelText("Term *"), {
      target: { value: "term_1" },
    });
    fireEvent.change(screen.getByLabelText("Score for Algorithms"), {
      target: { value: "0" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate this Term" }),
    );
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    const payload = JSON.parse(apiMock.history.post[0].data);
    expect(payload).toEqual({
      sessionId: "session_2",
      levelId: "level_1",
      termId: "term_1",
      entries: [
        {
          courseId: "course_1",
          score: 0,
          sessionId: "session_2",
          levelId: "level_1",
          termId: "term_1",
          attemptType: "REGULAR",
        },
      ],
    });
    expect(JSON.stringify(payload)).not.toMatch(
      /creditUnits|gradePoint|qualityPoints|gpa|cgpa/i,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Add to calculation" }),
    );
    await waitFor(() => expect(apiMock.history.post).toHaveLength(2));
    expect(await screen.findAllByText("BACKEND-GRADE")).not.toHaveLength(0);
    expect(screen.getAllByText("4.321").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.00").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Download PDF report" }),
    ).toBeVisible();
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
    fireEvent.change(await screen.findByLabelText("Session *"), {
      target: { value: "session_2" },
    });
    fireEvent.change(screen.getByLabelText("Level *"), {
      target: { value: "level_1" },
    });
    fireEvent.change(screen.getByLabelText("Term *"), {
      target: { value: "term_1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^grade$/i }));
    fireEvent.change(screen.getByLabelText("Grade for Algorithms"), {
      target: { value: "F" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate this Term" }),
    );
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      sessionId: "session_2",
      levelId: "level_1",
      termId: "term_1",
      entries: [
        {
          courseId: "course_1",
          grade: "F",
          sessionId: "session_2",
          levelId: "level_1",
          termId: "term_1",
          attemptType: "REGULAR",
        },
      ],
    });
    fireEvent.click(
      await screen.findByRole("button", { name: "Add to calculation" }),
    );
    expect(await screen.findByRole("button", { name: "Edit" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Grade for Algorithms")).toHaveValue("F");
    fireEvent.click(screen.getByRole("button", { name: "Clear calculation" }));
    expect(
      screen.getByText("Calculate and add your first Term."),
    ).toBeVisible();
  });

  it.each([
    [400, "Carryover level must be lower than the current level."],
    [409, "This course attempt already exists in the selected term."],
  ])("shows a backend %i calculation error", async (status, message) => {
    apiMock
      .onGet("/public/public-calculators/calc_cuid")
      .reply(200, publicDetail);
    apiMock
      .onPost("/public/public-calculators/calc_cuid/calculate")
      .reply(status, { message });
    renderClient(<PublicCalculatorPage calculatorId="calc_cuid" />);
    fireEvent.change(await screen.findByLabelText("Session *"), {
      target: { value: "session_2" },
    });
    fireEvent.change(screen.getByLabelText("Level *"), {
      target: { value: "level_1" },
    });
    fireEvent.change(screen.getByLabelText("Term *"), {
      target: { value: "term_1" },
    });
    fireEvent.change(screen.getByLabelText("Score for Algorithms"), {
      target: { value: "68" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate this Term" }),
    );
    expect(await screen.findByText(message)).toBeVisible();
  });

  it("builds multiple Terms and Sessions, replaces edits, and restores groups after refresh", async () => {
    apiMock
      .onGet("/public/public-calculators/calc_cuid")
      .reply(200, publicDetail);
    apiMock
      .onPost("/public/public-calculators/calc_cuid/calculate")
      .reply((request) => {
        const payload = JSON.parse(request.data) as {
          sessionId?: string;
          levelId?: string;
          termId?: string;
          entries: Array<{
            courseId: string;
            score?: number;
            sessionId?: string;
            levelId?: string;
            termId?: string;
            attemptType?: "REGULAR" | "CARRYOVER";
          }>;
        };
        const contexts = payload.entries.map((entry) => ({
          sessionId: entry.sessionId ?? payload.sessionId!,
          levelId: entry.levelId ?? payload.levelId!,
          termId: entry.termId ?? payload.termId!,
        }));
        const uniqueGroups = Array.from(
          new Map(
            contexts.map((context) => [
              `${context.sessionId}:${context.levelId}:${context.termId}`,
              context,
            ]),
          ).values(),
        );
        const uniqueSessions = Array.from(
          new Set(contexts.map((context) => context.sessionId)),
        );
        return [
          200,
          {
            ...calculation,
            entries: payload.entries.map((entry, index) => {
              const course = publicDetail.courses.find(
                (item) => item.id === entry.courseId,
              )!;
              const context = contexts[index];
              return {
                ...calculation.entries[0],
                course: {
                  id: course.id,
                  name: course.name,
                  code: course.code,
                  metadata: course.metadata,
                },
                session: {
                  id: context.sessionId,
                  name: publicDetail.sessions.find(
                    (item) => item.id === context.sessionId,
                  )!.name,
                },
                level: { id: context.levelId, name: "100 Level" },
                term: {
                  id: context.termId,
                  name: publicDetail.terms.find(
                    (item) => item.id === context.termId,
                  )!.name,
                },
                score: String(entry.score ?? 0),
                creditUnits: course.creditUnits,
              };
            }),
            groups: uniqueGroups.map((context) => ({
              session: {
                id: context.sessionId,
                name: publicDetail.sessions.find(
                  (item) => item.id === context.sessionId,
                )!.name,
              },
              level: { id: context.levelId, name: "100 Level" },
              term: {
                id: context.termId,
                name: publicDetail.terms.find(
                  (item) => item.id === context.termId,
                )!.name,
              },
              totalCreditUnits: "3.00",
              totalQualityPoints: "12.00",
              gpa: context.termId === "term_1" ? "4.00" : "3.50",
            })),
            sessions: uniqueSessions.map((sessionId) => ({
              session: {
                id: sessionId,
                name: publicDetail.sessions.find(
                  (item) => item.id === sessionId,
                )!.name,
              },
              totalCreditUnits: "6.00",
              totalQualityPoints: "23.00",
              gpa: "3.83",
            })),
            totalCreditUnits: String(payload.entries.length * 3),
            totalQualityPoints: String(payload.entries.length * 12),
            gpa: "4.00",
            cgpa: "3.83",
          },
        ];
      });

    renderClient(<PublicCalculatorPage calculatorId="calc_cuid" />);
    fireEvent.change(await screen.findByLabelText("Session *"), {
      target: { value: "session_1" },
    });
    fireEvent.change(screen.getByLabelText("Level *"), {
      target: { value: "level_1" },
    });
    fireEvent.change(screen.getByLabelText("Term *"), {
      target: { value: "term_1" },
    });
    fireEvent.change(screen.getByLabelText("Score for Algorithms"), {
      target: { value: "74" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate this Term" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Add to calculation" }),
    );

    fireEvent.change(screen.getByLabelText("Term *"), {
      target: { value: "term_2" },
    });
    fireEvent.change(await screen.findByLabelText("Score for Databases"), {
      target: { value: "62" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate this Term" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Add to calculation" }),
    );
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(2),
    );
    expect(
      JSON.parse(localStorage.getItem("aurescore:public-calculator:calc_cuid")!)
        .groups,
    ).toHaveLength(2);

    cleanup();
    renderClient(<PublicCalculatorPage calculatorId="calc_cuid" />);
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(2),
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    fireEvent.change(screen.getByLabelText("Score for Algorithms"), {
      target: { value: "80" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate this Term" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Update calculation" }),
    );
    await waitFor(() =>
      expect(
        JSON.parse(
          localStorage.getItem("aurescore:public-calculator:calc_cuid")!,
        ).groups,
      ).toHaveLength(2),
    );

    fireEvent.change(screen.getByLabelText("Session *"), {
      target: { value: "session_2" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate this Term" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Add to calculation" }),
    );
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(3),
    );
  });

  it("adds an earlier-Level Course as a linked repeat without exposing future Levels or overwriting the original", async () => {
    const levels = [
      {
        ...publicDetail.levels[0],
        id: "level_100",
        name: "100 Level",
        order: 1,
      },
      {
        ...publicDetail.levels[0],
        id: "level_200",
        name: "200 Level",
        order: 2,
      },
      {
        ...publicDetail.levels[0],
        id: "level_300",
        name: "300 Level",
        order: 3,
      },
      {
        ...publicDetail.levels[0],
        id: "level_400",
        name: "400 Level",
        order: 4,
      },
      {
        ...publicDetail.levels[0],
        id: "level_unordered",
        name: "Unordered Level",
        order: null,
      },
    ];
    const detail: PublicCalculatorDetail = {
      ...publicDetail,
      levels,
      courses: [
        {
          ...publicDetail.courses[0],
          id: "course_201",
          code: "CSC201",
          name: "Data Structures",
          levelId: "level_200",
        },
        {
          ...publicDetail.courses[0],
          id: "course_301",
          code: "CSC301",
          name: "Algorithms II",
          levelId: "level_300",
        },
        {
          ...publicDetail.courses[0],
          id: "course_401",
          code: "CSC401",
          name: "Advanced Computing",
          levelId: "level_400",
        },
        {
          ...publicDetail.courses[0],
          id: "course_wrong_term",
          code: "CSC202",
          name: "Wrong Term Course",
          levelId: "level_200",
          termId: "term_2",
        },
        {
          ...publicDetail.courses[0],
          id: "course_unordered",
          code: "CSC099",
          name: "Unordered Course",
          levelId: "level_unordered",
        },
      ],
    };
    apiMock.onGet("/public/public-calculators/calc_cuid").reply(200, detail);
    apiMock
      .onPost("/public/public-calculators/calc_cuid/calculate")
      .reply((request) => {
        const payload = JSON.parse(request.data) as {
          sessionId?: string;
          levelId?: string;
          termId?: string;
          entries: Array<{
            courseId: string;
            score: number;
            sessionId?: string;
            levelId?: string;
            termId?: string;
            attemptType?: "REGULAR" | "CARRYOVER";
          }>;
        };
        const entries = payload.entries.map((entry) => {
          const sessionId = entry.sessionId ?? payload.sessionId!;
          const levelId = entry.levelId ?? payload.levelId!;
          const termId = entry.termId ?? payload.termId!;
          const course = detail.courses.find(
            (item) => item.id === entry.courseId,
          )!;
          return {
            ...calculation.entries[0],
            course: {
              id: course.id,
              name: course.name,
              code: course.code,
              metadata: null,
            },
            session: {
              id: sessionId,
              name: detail.sessions.find((item) => item.id === sessionId)!.name,
            },
            level: {
              id: levelId,
              name: levels.find((item) => item.id === levelId)!.name,
            },
            term: {
              id: termId,
              name: detail.terms.find((item) => item.id === termId)!.name,
            },
            score: String(entry.score),
            creditUnits: course.creditUnits,
            attemptType: entry.attemptType ?? "REGULAR",
          };
        });
        const contexts = Array.from(
          new Map(
            entries.map((entry) => [
              `${entry.session!.id}:${entry.level!.id}:${entry.term!.id}`,
              entry,
            ]),
          ).values(),
        );
        return [
          200,
          {
            ...calculation,
            entries,
            groups: contexts.map((entry) => ({
              session: entry.session,
              level: entry.level,
              term: entry.term,
              totalCreditUnits: "3.00",
              totalQualityPoints: "12.00",
              gpa: "4.00",
            })),
            sessions: [
              {
                session: entries[0].session,
                totalCreditUnits: String(entries.length * 3),
                totalQualityPoints: String(entries.length * 12),
                gpa: "4.00",
              },
            ],
            totalCreditUnits: String(entries.length * 3),
            totalQualityPoints: String(entries.length * 12),
            gpa: "4.00",
            cgpa: "4.00",
          },
        ];
      });

    renderClient(<PublicCalculatorPage calculatorId="calc_cuid" />);
    fireEvent.change(await screen.findByLabelText("Session *"), {
      target: { value: "session_1" },
    });
    fireEvent.change(screen.getByLabelText("Level *"), {
      target: { value: "level_200" },
    });
    fireEvent.change(screen.getByLabelText("Term *"), {
      target: { value: "term_1" },
    });
    fireEvent.change(screen.getByLabelText("Score for Data Structures"), {
      target: { value: "45" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate this Term" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Add to calculation" }),
    );

    fireEvent.change(screen.getByLabelText("Level *"), {
      target: { value: "level_400" },
    });
    fireEvent.change(
      await screen.findByLabelText("Score for Advanced Computing"),
      { target: { value: "70" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate this Term" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Add to calculation" }),
    );

    fireEvent.change(screen.getByLabelText("Level *"), {
      target: { value: "level_300" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add Carryover Course" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Add Carryover Course" });
    expect(within(dialog).getByText("200 Level")).toBeVisible();
    expect(within(dialog).getByText("First Semester")).toBeVisible();
    expect(within(dialog).getByText(/CSC201/)).toBeVisible();
    expect(within(dialog).queryByText(/CSC401/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/CSC202/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/CSC099/)).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Add repeat" }));
    expect(within(dialog).queryByText(/CSC201/)).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Done" }));
    expect(screen.getByText("Carryover")).toBeVisible();
    fireEvent.change(
      screen.getByLabelText("Score for carryover Data Structures"),
      { target: { value: "80" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Calculate this Term" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Add to calculation" }),
    );

    await waitFor(() =>
      expect(apiMock.history.post.length).toBeGreaterThanOrEqual(6),
    );
    const aggregatePayload = JSON.parse(apiMock.history.post.at(-1)!.data) as {
      entries: Array<{
        courseId: string;
        levelId: string;
        termId: string;
        attemptType: "REGULAR" | "CARRYOVER";
      }>;
    };
    expect(
      aggregatePayload.entries.filter(
        (entry) => entry.courseId === "course_201",
      ),
    ).toEqual([
      expect.objectContaining({
        courseId: "course_201",
        levelId: "level_200",
        termId: "term_1",
        attemptType: "REGULAR",
      }),
      expect.objectContaining({
        courseId: "course_201",
        levelId: "level_300",
        termId: "term_1",
        attemptType: "CARRYOVER",
      }),
    ]);
    expect(JSON.stringify(aggregatePayload)).not.toMatch(
      /creditUnits|courseName|courseCode|gradePoint|qualityPoints/i,
    );
    const stored = JSON.parse(
      localStorage.getItem("aurescore:public-calculator:calc_cuid")!,
    );
    const repeat = stored.groups
      .flatMap(
        (group: { entries: Array<{ attemptType: string }> }) => group.entries,
      )
      .find((entry: { attemptType: string }) =>
        entry.attemptType === "CARRYOVER",
      );
    expect(repeat).toMatchObject({
      courseId: "course_201",
      attemptType: "CARRYOVER",
      originalLevelId: "level_200",
    });

    fireEvent.change(screen.getByLabelText("Level *"), {
      target: { value: "level_100" },
    });
    expect(
      screen.getByRole("button", { name: "Add Carryover Course" }),
    ).toBeDisabled();
  });
});
