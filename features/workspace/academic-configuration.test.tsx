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
import WorkspaceGradingSchemesPage from "./WorkspaceGradingSchemesPage";
import WorkspaceSessionsPage from "./WorkspaceSessionsPage";
import type {
  GradingScheme,
  Term,
  WorkspaceDetails,
  WorkspaceSession,
} from "./types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace/cm-one/sessions",
}));
vi.mock("@/features/app-shell/components/AppShell", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const apiMock = new MockAdapter(apiClient);
const session: WorkspaceSession = {
  id: "cm-session",
  workspaceId: "cm-one",
  name: "2026/2027",
  startsAt: null,
  endsAt: null,
  createdAt: "",
  updatedAt: "",
};
const workspace: WorkspaceDetails = {
  id: "cm-one",
  name: "Engineering",
  description: null,
  sessions: [session],
  terms: [],
  levels: [],
  courses: [],
  createdAt: "",
  updatedAt: "",
};
const firstTerm: Term = {
  id: "cm-term-one",
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

function renderClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return client;
}

function mockWorkspace() {
  apiMock.onGet("/workspace/cm-one").reply(200, workspace);
  apiMock.onGet("/workspace/cm-one/sessions").reply(200, [session]);
}

describe("workspace terms management", () => {
  beforeEach(() => {
    apiMock.reset();
    mockWorkspace();
  });

  it("lists reusable workspace terms using dashboard surfaces", async () => {
    apiMock
      .onGet("/workspace/cm-one/terms")
      .reply(200, [
        firstTerm,
        { ...firstTerm, id: "cm-term-two", name: "Second Semester", order: 2 },
      ]);
    renderClient(<WorkspaceSessionsPage workspaceId="cm-one" />);
    expect(await screen.findByText("First Semester")).toBeVisible();
    const panel = screen
      .getByRole("heading", { name: "Terms" })
      .closest("section");
    const names = within(panel!)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(names).toEqual(["First Semester", "Second Semester"]);
    expect(panel).toHaveClass("app-panel", "border");
    expect(panel).not.toHaveClass("rounded-xl");
    expect(
      apiMock.history.get.some(
        (request) => request.url === "/workspace/cm-one/terms",
      ),
    ).toBe(true);
  });

  it("shows an empty state and preserves values through duplicate-name errors", async () => {
    apiMock.onGet("/workspace/cm-one/terms").reply(200, []);
    apiMock
      .onPost("/workspace/cm-one/terms")
      .reply(409, { message: "A term with this name already exists." });
    renderClient(<WorkspaceSessionsPage workspaceId="cm-one" />);
    expect(await screen.findByText(/No workspace terms yet/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Add term" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "First Semester" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save term" }));
    expect(await within(dialog).findByText(/already exists/i)).toBeVisible();
    expect(within(dialog).getByLabelText("Name")).toHaveValue("First Semester");
  });

  it("edits a term and keeps it visible when referenced deletion returns 409", async () => {
    let current = firstTerm;
    apiMock.onGet("/workspace/cm-one/terms").reply(() => [200, [current]]);
    apiMock.onPatch("/workspace/cm-one/terms/cm-term-one").reply((request) => {
      current = { ...current, ...JSON.parse(request.data) };
      return [200, current];
    });
    apiMock
      .onDelete("/workspace/cm-one/terms/cm-term-one")
      .reply(409, { message: "A course offering still uses First Semester." });
    renderClient(<WorkspaceSessionsPage workspaceId="cm-one" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit First Semester" }),
    );
    const edit = screen.getByRole("dialog");
    fireEvent.change(within(edit).getByLabelText("Name"), {
      target: { value: "Semester One" },
    });
    fireEvent.click(within(edit).getByRole("button", { name: "Save term" }));
    expect(await screen.findByText("Semester One")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Delete Semester One" }),
    );
    const confirmation = screen.getByRole("dialog");
    expect(confirmation).toHaveTextContent("Semester One");
    fireEvent.click(
      within(confirmation).getByRole("button", { name: "Delete term" }),
    );
    expect(
      await within(confirmation).findByText(/course offering still uses/i),
    ).toBeVisible();
    expect(screen.getByText("Semester One")).toBeVisible();
  });
});

describe("grading scheme management", () => {
  beforeEach(() => {
    apiMock.reset();
    mockWorkspace();
  });

  it("creates the editable common preset through the ordinary endpoint", async () => {
    apiMock.onGet("/workspace/cm-one/grading-schemes").reply(200, []);
    apiMock.onPost("/workspace/cm-one/grading-schemes").reply(201, grading);
    renderClient(<WorkspaceGradingSchemesPage workspaceId="cm-one" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Common 5-point scale" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByDisplayValue("Common 5-point scale"),
    ).toBeVisible();
    expect(within(dialog).getAllByLabelText(/Minimum score \d/)).toHaveLength(
      6,
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save grading scheme" }),
    );
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    const payload = JSON.parse(apiMock.history.post[0].data);
    expect(payload.maxGradePoint).toBe(5);
    expect(
      payload.bands.map((band: { minScore: number }) => band.minScore),
    ).toEqual([70, 60, 50, 45, 40, 0]);
  });

  it("supports stable add/remove rows and validates grade points live", async () => {
    apiMock.onGet("/workspace/cm-one/grading-schemes").reply(200, []);
    renderClient(<WorkspaceGradingSchemesPage workspaceId="cm-one" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Create scheme" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Maximum grade point/i), {
      target: { value: "4" },
    });
    fireEvent.change(within(dialog).getByLabelText("Grade point 1"), {
      target: { value: "5" },
    });
    expect(await within(dialog).findByText(/cannot exceed/i)).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Add grade band/i }),
    );
    expect(within(dialog).getAllByLabelText(/Grade point \d/)).toHaveLength(2);
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Remove grade band 1" }),
    );
    expect(within(dialog).getAllByLabelText(/Grade point \d/)).toHaveLength(1);
  });

  it("edits a scheme and explains referenced-deletion conflicts without cache removal", async () => {
    let current = grading;
    apiMock
      .onGet("/workspace/cm-one/grading-schemes")
      .reply(() => [200, [current]]);
    apiMock
      .onPatch("/workspace/cm-one/grading-schemes/cm-grading")
      .reply((request) => {
        current = {
          ...current,
          ...JSON.parse(request.data),
          maxGradePoint: "5.00",
        };
        return [200, current];
      });
    apiMock
      .onDelete("/workspace/cm-one/grading-schemes/cm-grading")
      .reply(409, {
        message: "A course offering still uses this grading scheme.",
      });
    renderClient(<WorkspaceGradingSchemesPage workspaceId="cm-one" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit Common 5-point scale" }),
    );
    const edit = screen.getByRole("dialog");
    fireEvent.change(within(edit).getByLabelText("Scheme name"), {
      target: { value: "Faculty scale" },
    });
    fireEvent.click(
      within(edit).getByRole("button", { name: "Save grading scheme" }),
    );
    expect(await screen.findByText("Faculty scale")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Delete Faculty scale" }),
    );
    const confirmation = screen.getByRole("dialog");
    expect(confirmation).toHaveTextContent("Faculty scale");
    fireEvent.click(
      within(confirmation).getByRole("button", {
        name: "Delete grading scheme",
      }),
    );
    expect(
      await within(confirmation).findByText(/course offering still uses/i),
    ).toBeVisible();
    expect(screen.getByText("Faculty scale")).toBeVisible();
  });
});
