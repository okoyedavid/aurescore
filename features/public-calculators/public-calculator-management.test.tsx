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
import PublicCalculatorManagementPage from "./PublicCalculatorManagementPage";
import type {
  CalculatorCourse,
  CalculatorTermOrLevel,
  CreatorCalculatorDetail,
} from "./types";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/features/app-shell/components/AppShell", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const apiMock = new MockAdapter(apiClient);
const term: CalculatorTermOrLevel = {
  id: "term_cuid",
  publicCalculatorId: "calc_cuid",
  name: "First Semester",
  code: "SEM1",
  order: 1,
  metadata: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const course: CalculatorCourse = {
  id: "course_cuid",
  publicCalculatorId: "calc_cuid",
  name: "Algorithms",
  code: "CSC201",
  levelId: null,
  termId: term.id,
  creditUnits: "3.00",
  order: 1,
  metadata: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  level: null,
  term: { id: term.id, name: term.name, code: term.code, order: term.order },
};

function calculator(
  overrides: Partial<CreatorCalculatorDetail> = {},
): CreatorCalculatorDetail {
  return {
    id: "calc_cuid",
    title: "Computer Science GPA",
    description: null,
    institutionName: "Example University",
    departmentName: "Computer Science",
    isPublished: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    sessions: [],
    terms: [term],
    levels: [],
    courses: [course],
    gradingScheme: {
      id: "scheme_cuid",
      maxGradePoint: "5.00",
      bands: [
        { label: "A", minScore: 70, gradePoint: 5 },
        { label: "F", minScore: 0, gradePoint: 0 },
      ],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    publicPath: "/public-calculator/calc_cuid",
    ...overrides,
  };
}

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

describe("public calculator management", () => {
  beforeEach(() => {
    apiMock.reset();
    navigation.replace.mockReset();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("uses reusable calculator-level Terms and retains a referenced Term after a 409", async () => {
    apiMock.onGet("/public-calculators/calc_cuid").reply(200, calculator());
    apiMock.onGet("/public-calculators/calc_cuid/terms").reply(200, [term]);
    apiMock
      .onDelete("/public-calculators/calc_cuid/terms/term_cuid")
      .reply(409, {
        message: "This Term is referenced by a Course.",
      });
    renderClient(
      <PublicCalculatorManagementPage
        calculatorId="calc_cuid"
        initialTab="terms"
      />,
    );
    expect(
      await screen.findByText(
        "Reusable Terms can be selected with any Session.",
      ),
    ).toBeVisible();
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete First Semester" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete term" }),
    );
    expect(
      await within(dialog).findByText("This Term is referenced by a Course."),
    ).toBeVisible();
    expect(screen.getByText("First Semester")).toBeVisible();
    expect(apiMock.history.delete[0].url).not.toMatch(/sessions/);
  });

  it("refetches publication status after a Course mutation automatically unpublishes", async () => {
    let current = calculator();
    apiMock.onGet("/public-calculators/calc_cuid").reply(() => [200, current]);
    apiMock
      .onGet("/public-calculators/calc_cuid/courses")
      .reply(() => [200, current.courses]);
    apiMock.onPost("/public-calculators/calc_cuid/courses").reply((request) => {
      const input = JSON.parse(request.data);
      const added = {
        ...course,
        id: "new_course",
        name: input.name,
        code: input.code,
        termId: null,
        term: null,
        creditUnits: String(input.creditUnits),
      };
      current = {
        ...current,
        isPublished: false,
        courses: [...current.courses, added],
        updatedAt: "2026-02-01T00:00:00.000Z",
      };
      return [201, added];
    });
    renderClient(
      <PublicCalculatorManagementPage
        calculatorId="calc_cuid"
        initialTab="courses"
      />,
    );
    expect(await screen.findByText("Algorithms")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Add Course" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Databases" },
    });
    fireEvent.change(within(dialog).getByLabelText("Credit units"), {
      target: { value: "4" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save Course" }),
    );
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    expect(JSON.parse(apiMock.history.post[0].data)).toMatchObject({
      name: "Databases",
      creditUnits: 4,
      levelId: null,
      termId: null,
    });
    await waitFor(() => expect(screen.getByText("Unpublished")).toBeVisible());
    expect(
      apiMock.history.get.filter(
        (request) => request.url === "/public-calculators/calc_cuid",
      ).length,
    ).toBeGreaterThan(1);
  });

  it("shows exact publish readiness errors and never marks publication optimistically", async () => {
    apiMock
      .onGet("/public-calculators/calc_cuid")
      .reply(
        200,
        calculator({ isPublished: false, courses: [], gradingScheme: null }),
      );
    apiMock.onPost("/public-calculators/calc_cuid/publish").reply(400, {
      message:
        "Add a grading scheme and at least one Course before publishing.",
    });
    renderClient(
      <PublicCalculatorManagementPage
        calculatorId="calc_cuid"
        initialTab="publish"
      />,
    );
    expect(
      await screen.findByText("Grading scheme configured: Needs attention"),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(
      await screen.findByText(
        "Add a grading scheme and at least one Course before publishing.",
      ),
    ).toBeVisible();
    expect(screen.getAllByText("Unpublished").length).toBeGreaterThan(0);
  });

  it("publishes and unpublishes only through their action endpoints", async () => {
    let current = calculator({ isPublished: false });
    apiMock.onGet("/public-calculators/calc_cuid").reply(() => [200, current]);
    apiMock.onPost("/public-calculators/calc_cuid/publish").reply(() => {
      current = { ...current, isPublished: true };
      return [200, current];
    });
    apiMock.onPost("/public-calculators/calc_cuid/unpublish").reply(() => {
      current = { ...current, isPublished: false };
      return [200, current];
    });
    renderClient(
      <PublicCalculatorManagementPage
        calculatorId="calc_cuid"
        initialTab="publish"
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Publish" }));
    expect(
      await screen.findByRole("button", { name: "Unpublish" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Unpublish" }));
    await waitFor(() =>
      expect(apiMock.history.post.map((request) => request.url)).toEqual([
        "/public-calculators/calc_cuid/publish",
        "/public-calculators/calc_cuid/unpublish",
      ]),
    );
  });

  it("shows an ownership-safe 404 state", async () => {
    apiMock
      .onGet("/public-calculators/foreign")
      .reply(404, { message: "Not found" });
    renderClient(<PublicCalculatorManagementPage calculatorId="foreign" />);
    expect(
      await screen.findByRole("heading", { name: "Calculator unavailable" }),
    ).toBeVisible();
    expect(
      screen.getByText(/does not exist or is not accessible/i),
    ).toBeVisible();
  });

  it("requires a named confirmation and redirects only after 204 deletion", async () => {
    apiMock.onGet("/public-calculators/calc_cuid").reply(200, calculator());
    apiMock.onDelete("/public-calculators/calc_cuid").reply(204);
    renderClient(
      <PublicCalculatorManagementPage
        calculatorId="calc_cuid"
        initialTab="publish"
      />,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete calculator" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Computer Science GPA/)).toBeVisible();
    expect(navigation.replace).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete calculator" }),
    );
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/dashboard/public-calculators",
      ),
    );
  });
});
