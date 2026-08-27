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
import CreateWorkspacePage from "./CreateWorkspacePage";
import WorkspaceOverviewPage from "./WorkspaceOverviewPage";
import WorkspaceSessionsPage from "./WorkspaceSessionsPage";
import type { WorkspaceDetails, WorkspaceSession } from "./types";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/workspace/cm-one",
}));
vi.mock("@/features/app-shell/components/AppShell", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
const apiMock = new MockAdapter(apiClient);
const workspace: WorkspaceDetails = {
  id: "cm-one",
  name: "Engineering",
  description: "Private",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  sessions: [],
  terms: [],
  levels: [],
  courses: [],
};
const session: WorkspaceSession = {
  id: "cm-session",
  workspaceId: "cm-one",
  name: "2026/2027",
  startsAt: null,
  endsAt: null,
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

describe("workspace forms", () => {
  beforeEach(() => {
    apiMock.reset();
    navigation.replace.mockReset();
    navigation.back.mockReset();
  });
  it("creates without empty child collections or courses", async () => {
    apiMock.onPost("/workspace").reply(201, workspace);
    renderClient(<CreateWorkspacePage />);
    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: " Engineering " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create workspace" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    expect(JSON.parse(apiMock.history.post[0].data)).toEqual({
      name: "Engineering",
      description: null,
    });
    expect(apiMock.history.post[0].data).not.toContain("courses");
  });
  it("provides keyboard-operable repeatable groups and sends initial sessions and levels", async () => {
    apiMock.onPost("/workspace").reply(201, workspace);
    renderClient(<CreateWorkspacePage />);
    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Engineering" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add session" }));
    fireEvent.click(screen.getByRole("button", { name: "Add level" }));
    expect(
      screen.getByRole("button", { name: "Remove session 1" }),
    ).toHaveAttribute("type", "button");
    expect(
      screen.getByRole("button", { name: "Remove level 1" }),
    ).toHaveAttribute("type", "button");
    const names = screen.getAllByLabelText("Name");
    fireEvent.change(names[0], { target: { value: "2026/2027" } });
    fireEvent.change(names[1], { target: { value: "Level 100" } });
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2027-07-31" },
    });
    fireEvent.change(screen.getByLabelText("Code"), {
      target: { value: "100L" },
    });
    fireEvent.change(screen.getByLabelText("Order"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create workspace" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    expect(JSON.parse(apiMock.history.post[0].data)).toMatchObject({
      sessions: [
        {
          name: "2026/2027",
          startsAt: "2026-09-01T00:00:00.000Z",
          endsAt: "2027-07-31T00:00:00.000Z",
        },
      ],
      levels: [{ name: "Level 100", code: "100L", order: 100 }],
    });
    expect(apiMock.history.post[0].data).not.toContain("courses");
  });
  it("generates editable reusable Term rows and submits them once at workspace creation", async () => {
    apiMock.onPost("/workspace").reply(201, workspace);
    renderClient(<CreateWorkspacePage />);
    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Engineering" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Two semesters" }));
    const termNames = screen.getAllByLabelText("Name");
    expect(termNames).toHaveLength(2);
    fireEvent.change(termNames[1], { target: { value: "Rain Semester" } });
    fireEvent.click(screen.getByRole("button", { name: "Create workspace" }));
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    const payload = JSON.parse(apiMock.history.post[0].data);
    expect(payload.terms).toEqual([
      { name: "First Semester", code: null, order: 1, metadata: null },
      { name: "Rain Semester", code: null, order: 2, metadata: null },
    ]);
    expect(payload).not.toHaveProperty("termSystem");
  });
  it("focuses validation, announces the date-range error, and submits only once while pending", async () => {
    let resolve: ((value: [number, WorkspaceDetails]) => void) | undefined;
    apiMock.onPost("/workspace").reply(
      () =>
        new Promise<[number, WorkspaceDetails]>((done) => {
          resolve = done;
        }),
    );
    renderClient(<CreateWorkspacePage />);
    fireEvent.change(screen.getByLabelText("Workspace name"), {
      target: { value: "Engineering" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add session" }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "2026/2027" },
    });
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2027-01-01" },
    });
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create workspace" }));
    await waitFor(() =>
      expect(
        screen.getAllByText("End date must not precede the start date."),
      ).toHaveLength(2),
    );
    expect(
      screen
        .getAllByText("End date must not precede the start date.")
        .find((element) => element.getAttribute("role") === "alert"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/^End date/)).toHaveFocus(),
    );
    fireEvent.change(screen.getByLabelText(/^End date/), {
      target: { value: "2027-07-31" },
    });
    const submit = screen.getByRole("button", { name: "Create workspace" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    await waitFor(() => expect(apiMock.history.post).toHaveLength(1));
    expect(
      screen.getByRole("button", { name: "Creating workspace…" }),
    ).toBeDisabled();
    resolve?.([201, workspace]);
    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith("/workspace/cm-one"),
    );
  });
  it("requires the exact workspace name before destructive cascade confirmation", async () => {
    apiMock.onGet("/workspace/cm-one").reply(200, workspace);
    apiMock.onDelete("/workspace/cm-one").reply(204);
    renderClient(<WorkspaceOverviewPage workspaceId="cm-one" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete Engineering" }),
    );
    const dialog = screen.getByRole("dialog");
    const destructive = within(dialog).getByRole("button", {
      name: "Delete workspace and private data",
    });
    expect(destructive).toBeDisabled();
    fireEvent.change(
      within(dialog).getByLabelText("Type the workspace name to confirm"),
      { target: { value: "Engineering" } },
    );
    expect(destructive).not.toBeDisabled();
    fireEvent.click(destructive);
    await waitFor(() => expect(apiMock.history.delete).toHaveLength(1));
    expect(navigation.replace).toHaveBeenCalledWith("/workspace");
  });
  it("retains a session and shows the server explanation after a 409 deletion conflict", async () => {
    apiMock
      .onGet("/workspace/cm-one")
      .reply(200, { ...workspace, sessions: [session] });
    apiMock.onGet("/workspace/cm-one/sessions").reply(200, [session]);
    apiMock.onDelete("/workspace/cm-one/sessions/cm-session").reply(409, {
      message: "This session is referenced by course offerings.",
    });
    renderClient(<WorkspaceSessionsPage workspaceId="cm-one" />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete 2026/2027" }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete session",
      }),
    );
    expect(
      await within(screen.getByRole("dialog")).findByText(
        "This session is referenced by course offerings.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("2026/2027")).toBeInTheDocument();
  });
  it("uses ownership-safe language for a 404 workspace", async () => {
    apiMock
      .onGet("/workspace/cm-hidden")
      .reply(404, { message: "Forbidden internal ownership record" });
    renderClient(<WorkspaceOverviewPage workspaceId="cm-hidden" />);
    expect(
      await screen.findByText(
        "This workspace does not exist or is not accessible to your account.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Forbidden internal/)).not.toBeInTheDocument();
  });
});
