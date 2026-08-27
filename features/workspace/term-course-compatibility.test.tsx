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
import WorkspaceCoursesPage from "./WorkspaceCoursesPage";
import { workspaceApi } from "./api";
import { workspaceKeys } from "./query-keys";
import type {
  WorkspaceCourse,
  WorkspaceDetails,
  WorkspaceLevel,
  WorkspaceTerm,
} from "./types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace/cm-one/courses",
}));
vi.mock("@/features/app-shell/components/AppShell", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const apiMock = new MockAdapter(apiClient);
const level: WorkspaceLevel = {
  id: "cm-level",
  workspaceId: "cm-one",
  name: "400 Level",
  code: "400",
  order: 4,
  metadata: null,
  createdAt: "",
  updatedAt: "",
};
const term: WorkspaceTerm = {
  id: "cm-term",
  workspaceId: "cm-one",
  name: "First Semester",
  code: "SEM1",
  order: 1,
  metadata: null,
  createdAt: "",
  updatedAt: "",
};
const course: WorkspaceCourse = {
  id: "cm-course",
  workspaceId: "cm-one",
  name: "Operating Systems",
  code: "CSC401",
  type: "COURSE",
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
const workspace: WorkspaceDetails = {
  id: "cm-one",
  name: "Engineering",
  description: null,
  sessions: [],
  terms: [term],
  levels: [level],
  courses: [course],
  createdAt: "",
  updatedAt: "",
};

function renderClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return client;
}

describe("reusable terms and course defaults", () => {
  beforeEach(() => apiMock.reset());

  it("keeps filtered course requests and cache keys distinct", async () => {
    apiMock.onGet("/workspace/cm-one/courses").reply(200, []);
    await workspaceApi.courses("cm-one");
    await workspaceApi.courses("cm-one", { levelId: level.id });
    await workspaceApi.courses("cm-one", { termId: term.id });
    await workspaceApi.courses("cm-one", {
      levelId: level.id,
      termId: term.id,
    });
    expect(apiMock.history.get.map((request) => request.params ?? {})).toEqual([
      {},
      { levelId: level.id },
      { termId: term.id },
      { levelId: level.id, termId: term.id },
    ]);
    expect(workspaceKeys.courses("cm-one")).not.toEqual(
      workspaceKeys.courses("cm-one", { levelId: level.id }),
    );
    expect(workspaceKeys.courses("cm-one", { levelId: level.id })).not.toEqual(
      workspaceKeys.courses("cm-one", { termId: term.id }),
    );
  });

  it("supports course creation with no default, either default, or both", async () => {
    apiMock.onPost("/workspace/cm-one/courses").reply(201, course);
    await workspaceApi.createCourse("cm-one", { name: "Mathematics" });
    await workspaceApi.createCourse("cm-one", {
      name: "Physics",
      defaultLevelId: level.id,
    });
    await workspaceApi.createCourse("cm-one", {
      name: "Chemistry",
      defaultTermId: term.id,
    });
    await workspaceApi.createCourse("cm-one", {
      name: "Operating Systems",
      defaultLevelId: level.id,
      defaultTermId: term.id,
    });
    expect(
      apiMock.history.post.map((request) => JSON.parse(request.data)),
    ).toEqual([
      { name: "Mathematics" },
      { name: "Physics", defaultLevelId: level.id },
      { name: "Chemistry", defaultTermId: term.id },
      {
        name: "Operating Systems",
        defaultLevelId: level.id,
        defaultTermId: term.id,
      },
    ]);
  });

  it("filters by both defaults and clears them explicitly during course edit", async () => {
    apiMock.onGet("/workspace/cm-one").reply(200, workspace);
    apiMock.onGet("/workspace/cm-one/levels").reply(200, [level]);
    apiMock.onGet("/workspace/cm-one/terms").reply(200, [term]);
    apiMock.onGet("/workspace/cm-one/courses").reply(200, [course]);
    apiMock.onPatch("/workspace/cm-one/courses/cm-course").reply((request) => [
      200,
      {
        ...course,
        ...JSON.parse(request.data),
        defaultLevel: null,
        defaultTerm: null,
      },
    ]);
    renderClient(<WorkspaceCoursesPage workspaceId="cm-one" />);
    expect(await screen.findByText("Operating Systems")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Default level"), {
      target: { value: level.id },
    });
    fireEvent.change(screen.getByLabelText("Default term"), {
      target: { value: term.id },
    });
    await waitFor(() =>
      expect(
        apiMock.history.get.some(
          (request) =>
            request.url === "/workspace/cm-one/courses" &&
            request.params?.levelId === level.id &&
            request.params?.termId === term.id,
        ),
      ).toBe(true),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Edit Operating Systems" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Default level/), {
      target: { value: "" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Default term/), {
      target: { value: "" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save course" }),
    );
    await waitFor(() => expect(apiMock.history.patch).toHaveLength(1));
    expect(JSON.parse(apiMock.history.patch[0].data)).toMatchObject({
      defaultLevelId: null,
      defaultTermId: null,
    });
  });
});
