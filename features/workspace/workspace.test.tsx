import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api/client";
import { workspaceApi } from "./api";
import { usePatchWorkspace, useSessionMutations } from "./hooks";
import { workspaceKeys } from "./query-keys";
import type { WorkspaceDetails } from "./types";
import WorkspacePage from "./WorkspacePage";

vi.mock("@/features/app-shell/components/AppShell", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
const apiMock = new MockAdapter(apiClient);
const one: WorkspaceDetails = {
  id: "cm-one",
  name: "Engineering",
  description: "Private",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  sessions: [],
  levels: [],
  courses: [],
};
const two: WorkspaceDetails = { ...one, id: "cm-two", name: "Sciences" };
function renderClient(ui: ReactNode, setup?: (client: QueryClient) => void) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  setup?.(client);
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return client;
}

describe("workspace API and cache isolation", () => {
  beforeEach(() => apiMock.reset());
  it("lists multiple private workspaces with direct navigation", async () => {
    apiMock.onGet("/workspace").reply(200, [two, one]);
    renderClient(<WorkspacePage />);
    expect(
      await screen.findByRole("link", { name: /Sciences/ }),
    ).toHaveAttribute("href", "/workspace/cm-two");
    expect(screen.getByRole("link", { name: /Engineering/ })).toHaveAttribute(
      "href",
      "/workspace/cm-one",
    );
  });
  it("uses workspace-scoped standalone create, update, and delete endpoints", async () => {
    apiMock
      .onAny()
      .reply((config) =>
        config.method === "delete" ? [204] : [200, { id: "child" }],
      );
    await workspaceApi.createSession("cm/work", { name: "Session" });
    await workspaceApi.updateSession("cm/work", "cm/session", {
      name: "Revised",
    });
    await workspaceApi.removeSession("cm/work", "cm/session");
    await workspaceApi.createLevel("cm/work", { name: "Level" });
    await workspaceApi.updateLevel("cm/work", "cm/level", { code: "100L" });
    await workspaceApi.removeLevel("cm/work", "cm/level");
    await workspaceApi.createCourse("cm/work", { name: "Course" });
    await workspaceApi.updateCourse("cm/work", "cm/course", {
      name: "Revised",
    });
    await workspaceApi.removeCourse("cm/work", "cm/course");
    expect(apiMock.history.map((item) => `${item.method} ${item.url}`)).toEqual(
      [
        "post /workspace/cm%2Fwork/sessions",
        "patch /workspace/cm%2Fwork/sessions/cm%2Fsession",
        "delete /workspace/cm%2Fwork/sessions/cm%2Fsession",
        "post /workspace/cm%2Fwork/levels",
        "patch /workspace/cm%2Fwork/levels/cm%2Flevel",
        "delete /workspace/cm%2Fwork/levels/cm%2Flevel",
        "post /workspace/cm%2Fwork/courses",
        "patch /workspace/cm%2Fwork/courses/cm%2Fcourse",
        "delete /workspace/cm%2Fwork/courses/cm%2Fcourse",
      ],
    );
  });
  it("invalidates only the relevant workspace child and embedded detail caches", async () => {
    apiMock.onPost("/workspace/cm-one/sessions").reply(200, { id: "session" });
    function Probe() {
      const mutation = useSessionMutations("cm-one").create;
      return (
        <button onClick={() => mutation.mutate({ name: "Session" })}>
          Create
        </button>
      );
    }
    const client = renderClient(<Probe />, (cache) => {
      cache.setQueryData(workspaceKeys.detail("cm-one"), one);
      cache.setQueryData(workspaceKeys.sessions("cm-one"), []);
      cache.setQueryData(workspaceKeys.detail("cm-two"), two);
      cache.setQueryData(workspaceKeys.sessions("cm-two"), []);
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(
        client.getQueryState(workspaceKeys.sessions("cm-one"))?.isInvalidated,
      ).toBe(true),
    );
    expect(
      client.getQueryState(workspaceKeys.detail("cm-one"))?.isInvalidated,
    ).toBe(true);
    expect(
      client.getQueryState(workspaceKeys.sessions("cm-two"))?.isInvalidated,
    ).toBe(false);
    expect(
      client.getQueryState(workspaceKeys.detail("cm-two"))?.isInvalidated,
    ).toBe(false);
  });
  it("keeps the previous detail cache when an atomic wide patch fails and does not retry", async () => {
    apiMock
      .onPatch("/workspace/cm-one")
      .reply(400, { message: "One nested update is invalid." });
    function Probe() {
      const mutation = usePatchWorkspace("cm-one");
      return (
        <button onClick={() => mutation.mutate({ name: "Changed" })}>
          Save
        </button>
      );
    }
    const client = renderClient(<Probe />, (cache) =>
      cache.setQueryData(workspaceKeys.detail("cm-one"), one),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(apiMock.history.patch).toHaveLength(1));
    await waitFor(() =>
      expect(client.getMutationCache().getAll()[0]?.state.status).toBe("error"),
    );
    expect(client.getQueryData(workspaceKeys.detail("cm-one"))).toEqual(one);
  });
  it.each([
    [404, "Workspace not found."],
    [409, "This course is used by an offering."],
    [429, "Too many requests. Try again shortly."],
  ] as const)(
    "preserves the server message for status %s",
    async (status, message) => {
      apiMock.onGet("/workspace/cm-one").reply(status, { message });
      await expect(workspaceApi.detail("cm-one")).rejects.toMatchObject({
        status,
        message,
      });
    },
  );
});
